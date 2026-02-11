"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedbackAction } from "@/lib/actions/feedback-actions";

type EmailType = "eerste_mail" | "opvolgmail_1" | "opvolgmail_2";

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
  });
  return z.object(shape).superRefine((data, ctx) => {
    const hasAnyFeedback = Object.values(data).some(
      (val) => val && val.trim().length > 0
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

  const variantIds = useMemo(
    () => form.email_variants.map((v) => v.id),
    [form.email_variants]
  );

  const schema = useMemo(() => buildFeedbackSchema(variantIds), [variantIds]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: Object.fromEntries(
      variantIds.map((id) => [`feedback_${id}`, ""])
    ),
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Build feedbackEntries array from form values
      const feedbackEntries = Object.entries(data)
        .filter(([key, value]) => key.startsWith("feedback_") && value && (value as string).trim().length > 0)
        .map(([key, value]) => ({
          variant_id: key.replace("feedback_", ""),
          feedback_text: (value as string).trim(),
        }));

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
                  <div>
                    <label
                      htmlFor={`feedback_${variant.id}`}
                      className="mb-2 block text-sm font-medium"
                    >
                      Jouw feedback
                    </label>
                    <Textarea
                      id={`feedback_${variant.id}`}
                      placeholder="Schrijf hier je feedback over deze variant..."
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
