import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyLinkButton } from "../_components/copy-link-button";
import { formatDate, generatePublicUrl } from "@/lib/utils";

type EmailType = 'eerste_mail' | 'opvolgmail_1' | 'opvolgmail_2';

type FeedbackResponseData = {
  id: string;
  feedback_text: string;
  submitted_at: string;
};

type EmailVariantData = {
  id: string;
  email_type: EmailType;
  variant_number: number;
  subject_line: string;
  email_body: string;
  sort_order: number;
  feedback_responses: FeedbackResponseData[];
};

type FormWithVariantsAndFeedback = {
  id: string;
  client_name: string;
  slug: string;
  status: 'active' | 'completed';
  webhook_url: string | null;
  created_at: string;
  email_variants: EmailVariantData[];
};

const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  eerste_mail: 'Eerste mail',
  opvolgmail_1: 'Opvolgmail 1',
  opvolgmail_2: 'Opvolgmail 2'
};

const EMAIL_TYPE_ORDER: EmailType[] = ['eerste_mail', 'opvolgmail_1', 'opvolgmail_2'];

export default async function FormDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: form, error } = await supabase
    .from('forms')
    .select(`
      id, client_name, slug, status, webhook_url, created_at,
      email_variants (
        id, email_type, variant_number, subject_line, email_body, sort_order,
        feedback_responses (
          id, feedback_text, submitted_at
        )
      )
    `)
    .eq('id', id)
    .order('sort_order', { referencedTable: 'email_variants', ascending: true })
    .single();

  if (error || !form) {
    notFound();
  }

  // Type assertion after successful fetch
  const formData = form as unknown as FormWithVariantsAndFeedback;

  // Group variants by email type
  const variantsByType = formData.email_variants.reduce((acc, variant) => {
    const type = variant.email_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(variant);
    return acc;
  }, {} as Record<EmailType, EmailVariantData[]>);

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar overzicht
      </Link>

      {/* Page header with status badge */}
      <PageHeader
        title={formData.client_name}
        description={`Aangemaakt op ${formatDate(formData.created_at)}`}
      >
        <StatusBadge status={formData.status} />
      </PageHeader>

      {/* Form metadata card */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <StatusBadge status={formData.status} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Aangemaakt op:</span>
              <span>{formatDate(formData.created_at)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Deelbare link:</span>
              <CopyLinkButton url={generatePublicUrl(formData.slug)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variant sections grouped by email type */}
      {EMAIL_TYPE_ORDER.map((emailType) => {
        const variants = variantsByType[emailType];
        if (!variants || variants.length === 0) {
          return null;
        }

        return (
          <div key={emailType} className="space-y-4">
            <h2 className="text-xl font-semibold">{EMAIL_TYPE_LABELS[emailType]}</h2>

            {variants.map((variant) => (
              <Card key={variant.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    Variant {variant.variant_number}: {variant.subject_line}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Email body */}
                  <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {variant.email_body}
                  </div>

                  {/* Feedback section */}
                  {variant.feedback_responses && variant.feedback_responses.length > 0 ? (
                    <div className="space-y-3 mt-4">
                      {variant.feedback_responses.map((feedback) => (
                        <div
                          key={feedback.id}
                          className="bg-green-50 border border-green-200 rounded-lg p-4"
                        >
                          <p className="text-sm">{feedback.feedback_text}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(feedback.submitted_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                      <p className="text-sm text-muted-foreground italic">
                        Nog geen feedback ontvangen
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}
