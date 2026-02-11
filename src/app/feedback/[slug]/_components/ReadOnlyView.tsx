import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EmailType = "eerste_mail" | "opvolgmail_1" | "opvolgmail_2";

interface ReadOnlyViewProps {
  form: {
    id: string;
    client_name: string;
    email_variants: Array<{
      id: string;
      email_type: EmailType;
      variant_number: number;
      subject_line: string;
      email_body: string;
      sort_order: number;
    }>;
  };
  feedbackResponses: Array<{
    id: string;
    variant_id: string;
    feedback_text: string;
    submitted_at: string;
  }>;
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

export function ReadOnlyView({ form, feedbackResponses }: ReadOnlyViewProps) {
  // Create Map from feedbackResponses keyed by variant_id for O(1) lookup
  const feedbackMap = new Map(
    feedbackResponses.map((response) => [response.variant_id, response])
  );

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
    <div className="space-y-8">
      {/* Success banner */}
      <div className="flex items-start space-x-4 rounded-lg border border-green-200 bg-green-50 p-6">
        <CheckCircle className="h-6 w-6 shrink-0 text-green-600" />
        <div>
          <h2 className="text-lg font-semibold text-green-900">Bedankt!</h2>
          <p className="text-sm text-green-800">
            Je feedback is succesvol verstuurd.
          </p>
          <p className="mt-1 text-sm text-green-700">
            Hieronder kun je je ingezonden feedback nog terugzien.
          </p>
        </div>
      </div>

      {/* Display variants grouped by type */}
      {EMAIL_TYPE_ORDER.map((emailType) => {
        const variants = variantsByType[emailType];
        if (!variants || variants.length === 0) return null;

        return (
          <div key={emailType} className="space-y-4">
            <h2 className="text-xl font-semibold">
              {EMAIL_TYPE_LABELS[emailType]}
            </h2>
            {variants.map((variant) => {
              const feedback = feedbackMap.get(variant.id);

              return (
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
                      <div className="mb-2 text-sm font-medium">
                        Jouw feedback
                      </div>
                      {feedback ? (
                        <div className="whitespace-pre-wrap rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
                          {feedback.feedback_text}
                        </div>
                      ) : (
                        <p className="italic text-muted-foreground text-sm">
                          Geen feedback gegeven voor deze variant
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
