import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { FeedbackForm } from "./_components/FeedbackForm";
import { ReadOnlyView } from "./_components/ReadOnlyView";

export const metadata = {
  title: "Feedback formulier",
};

type EmailType = "eerste_mail" | "opvolgmail_1" | "opvolgmail_2";

type EmailVariantData = {
  id: string;
  email_type: EmailType;
  variant_number: number;
  subject_line: string;
  email_body: string;
  sort_order: number;
};

type FormWithVariants = {
  id: string;
  client_name: string;
  slug: string;
  status: "active" | "completed";
  webhook_url: string | null;
  email_variants: EmailVariantData[];
};

type FeedbackResponseData = {
  id: string;
  variant_id: string;
  feedback_text: string;
  submitted_at: string;
};

export default async function PublicFeedbackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch form data with nested variants
  const { data: form, error } = await supabase
    .from("forms")
    .select(
      `
      id, client_name, slug, status, webhook_url,
      email_variants (
        id, email_type, variant_number, subject_line, email_body, sort_order
      )
    `
    )
    .eq("slug", slug)
    .order("sort_order", { referencedTable: "email_variants", ascending: true })
    .single();

  if (error || !form) {
    notFound();
  }

  // Type assertion after successful fetch
  const formData = form as unknown as FormWithVariants;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header with branding and title */}
        <div className="mb-8 space-y-2">
          <p className="text-sm text-muted-foreground">NextWave Solutions</p>
          <h1 className="text-3xl font-bold tracking-tight">
            Invulformulier voor {formData.client_name}
          </h1>
          {formData.status === "active" && (
            <p className="text-muted-foreground">
              Hieronder vind je de e-mailvarianten die wij voor je hebben
              opgesteld. Laat per variant je feedback achter.
            </p>
          )}
        </div>

        {/* Route based on form status */}
        {formData.status === "completed" ? (
          <CompletedFormView formId={formData.id} formData={formData} />
        ) : (
          <FeedbackForm form={formData} />
        )}
      </div>
    </div>
  );
}

/**
 * Server Component that fetches feedback responses and renders read-only view
 */
async function CompletedFormView({
  formId,
  formData,
}: {
  formId: string;
  formData: FormWithVariants;
}) {
  const supabase = await createClient();

  // Fetch feedback responses for completed form
  const { data: responses } = await supabase
    .from("feedback_responses")
    .select("id, variant_id, feedback_text, submitted_at")
    .eq("form_id", formId);

  const feedbackResponses = (responses || []) as FeedbackResponseData[];

  return <ReadOnlyView form={formData} feedbackResponses={feedbackResponses} />;
}
