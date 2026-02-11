"use client";

import { useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Loader2, ThumbsUp, MessageSquare, ThumbsDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedbackAction } from "@/lib/actions/feedback-actions";

type EmailType = "eerste_mail" | "opvolgmail_1" | "opvolgmail_2";
type Rating = "good" | "notes" | "not_good";

const RATING_LABELS: Record<Rating, string> = {
  good: "Goed zo",
  notes: "Goed, maar heb opmerkingen",
  not_good: "Niet goed",
};

interface FeedbackFormProps {
  form: {
    id: string;
    client_name: string;
    slug: string;
    email_variants: Array<{
      id: string;
      email_type: EmailType;
      variant_number: number;
      subject_line: string;
      email_body: string;
      sort_order: number;
    }>;
  };
}

const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  eerste_mail: "Eerste mail",
  opvolgmail_1: "Opvolgmail 1",
  opvolgmail_2: "Opvolgmail 2",
};

const EMAIL_TYPE_ORDER: readonly EmailType[] = [
  "eerste_mail",
  "opvolgmail_1",
  "opvolgmail_2",
] as const;

const buildFeedbackSchema = (variantIds: string[]) => {
  const shape: Record<string, z.ZodOptional<z.ZodString>> = {};
  variantIds.forEach((id) => {
    shape[`feedback_${id}`] = z.string().optional();
    shape[`rating_${id}`] = z.string().optional();
  });
  return z.object(shape).superRefine((data, ctx) => {
    const hasAnyFeedback = Object.entries(data).some(
      ([key, val]) =>
        (key.startsWith("feedback_") && val && val.trim().length > 0) ||
        (key.startsWith("rating_") && val && val.trim().length > 0)
    );
    if (!hasAnyFeedback) {
      ctx.addIssue({
        code: "custom",
        message:
          "Vul minimaal een feedbackveld in om je feedback te versturen.",
        path: ["root"],
      });
    }
  });
};

export function FeedbackForm({ form }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, Rating | null>>({});

  const variantIds = useMemo(
    () => form.email_variants.map((v) => v.id),
    [form.email_variants]
  );

  const schema = useMemo(() => buildFeedbackSchema(variantIds), [variantIds]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: Object.fromEntries(
      variantIds.flatMap((id) => [
        [`feedback_${id}`, ""],
        [`rating_${id}`, ""],
      ])
    ),
  });

  const handleRatingClick = useCallback(
    (variantId: string, rating: Rating) => {
      setRatings((prev) => {
        const current = prev[variantId];
        const newRating = current === rating ? null : rating;
        // Sync hidden rating field
        setValue(`rating_${variantId}`, newRating ? RATING_LABELS[newRating] : "");
        // Clear text when selecting "good"
        if (newRating === "good") {
          setValue(`feedback_${variantId}`, "");
        }
        return { ...prev, [variantId]: newRating };
      });
    },
    [setValue]
  );

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Build feedbackEntries combining rating + text
      const feedbackEntries = variantIds
        .map((id) => {
          const rating = data[`rating_${id}`] as string | undefined;
          const text = (data[`feedback_${id}`] as string || "").trim();

          if (!rating && !text) return null;

          const parts: string[] = [];
          if (rating) parts.push(`[${rating}]`);
          if (text) parts.push(text);

          return {
            variant_id: id,
            feedback_text: parts.join(" "),
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

      const result = await submitFeedbackAction(
        form.id,
        form.slug,
        feedbackEntries
      );

      if (!result.success) {
        setSubmitError(result.error || "Er ging iets mis");
      } else {
        setIsSuccess(true);
      }
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError("Er ging iets mis bij het versturen van je feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center space-y-4 rounded-lg border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-600" />
        <h2 className="text-2xl font-bold">Bedankt!</h2>
        <p className="text-muted-foreground">
          Je feedback is succesvol verstuurd.
        </p>
        <p className="text-sm text-muted-foreground">
          Je kunt dit venster nu sluiten.
        </p>
      </div>
    );
  }

  // Group variants by email type
  const variantsByType = form.email_variants.reduce(
    (acc, variant) => {
      if (!acc[variant.email_type]) {
        acc[variant.email_type] = [];
      }
      acc[variant.email_type].push(variant);
      return acc;
    },
    {} as Record<EmailType, typeof form.email_variants>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {EMAIL_TYPE_ORDER.map((emailType) => {
        const variants = variantsByType[emailType];
        if (!variants || variants.length === 0) return null;

        return (
          <div key={emailType} className="space-y-4">
            <h2 className="text-xl font-semibold">
              {EMAIL_TYPE_LABELS[emailType]}
            </h2>
            {variants.map((variant) => (
              <Card key={variant.id}>
                <CardHeader>
                  <CardTitle className="text-base font-medium">
                    Variant {variant.variant_number}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm font-medium">
                    Onderwerp: {variant.subject_line}
                  </div>
                  <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm">
                    {variant.email_body}
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium">
                      Jouw feedback
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={ratings[variant.id] === "good" ? "default" : "outline"}
                        size="sm"
                        className={ratings[variant.id] === "good" ? "bg-green-600 hover:bg-green-700" : ""}
                        onClick={() => handleRatingClick(variant.id, "good")}
                      >
                        <ThumbsUp className="mr-1.5 h-4 w-4" />
                        Goed zo
                      </Button>
                      <Button
                        type="button"
                        variant={ratings[variant.id] === "notes" ? "default" : "outline"}
                        size="sm"
                        className={ratings[variant.id] === "notes" ? "bg-amber-500 hover:bg-amber-600" : ""}
                        onClick={() => handleRatingClick(variant.id, "notes")}
                      >
                        <MessageSquare className="mr-1.5 h-4 w-4" />
                        Goed, maar heb opmerkingen
                      </Button>
                      <Button
                        type="button"
                        variant={ratings[variant.id] === "not_good" ? "default" : "outline"}
                        size="sm"
                        className={ratings[variant.id] === "not_good" ? "bg-red-600 hover:bg-red-700" : ""}
                        onClick={() => handleRatingClick(variant.id, "not_good")}
                      >
                        <ThumbsDown className="mr-1.5 h-4 w-4" />
                        Niet goed
                      </Button>
                    </div>
                    <input type="hidden" {...register(`rating_${variant.id}`)} />
                    <Textarea
                      id={`feedback_${variant.id}`}
                      placeholder={
                        ratings[variant.id] === "good"
                          ? "Geen opmerkingen nodig"
                          : "Schrijf hier je feedback over deze variant..."
                      }
                      disabled={ratings[variant.id] === "good"}
                      className={ratings[variant.id] === "good" ? "opacity-50" : ""}
                      {...register(`feedback_${variant.id}`)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })}

      {/* Form-level validation error */}
      {errors.root && (
        <p className="text-sm text-red-500">{errors.root.message}</p>
      )}

      {/* Server action error */}
      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              Bezig met versturen...
            </>
          ) : (
            "Feedback versturen"
          )}
        </Button>
      </div>
    </form>
  );
}
