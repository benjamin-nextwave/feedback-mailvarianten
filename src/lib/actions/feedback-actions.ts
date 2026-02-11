"use server";

import { createClient } from "@/lib/supabase/server";
import type { FormUpdate } from "@/types/database.types";
import { revalidatePath } from "next/cache";

type FeedbackEntry = {
  variant_id: string;
  feedback_text: string;
};

type ActionResult = {
  success: boolean;
  error?: string;
};

const WEBHOOK_URL = "https://hook.eu2.make.com/39qm7lyzms7omhdvuu7dlb211gyg3jir";

/**
 * Submit feedback for a form
 * Validates entries, batch inserts feedback, updates form status, fires webhook
 */
export async function submitFeedbackAction(
  formId: string,
  slug: string,
  feedbackEntries: FeedbackEntry[]
): Promise<ActionResult> {
  const supabase = await createClient();

  // Server-side validation: ensure feedbackEntries is non-empty
  if (!Array.isArray(feedbackEntries) || feedbackEntries.length === 0) {
    return { success: false, error: "Geen feedback om te versturen" };
  }

  // Filter out entries where feedback_text is empty or whitespace-only
  const validEntries = feedbackEntries.filter(
    (entry) => entry.feedback_text && entry.feedback_text.trim().length > 0
  );

  if (validEntries.length === 0) {
    return { success: false, error: "Geen feedback om te versturen" };
  }

  try {
    // Fetch form data for webhook (before status update)
    const { data: formData } = await supabase
      .from("forms")
      .select("client_name")
      .eq("id", formId)
      .single();

    const clientName = (formData as any)?.client_name || "Unknown Client";

    // Batch INSERT all feedback entries into feedback_responses table
    const submittedAt = new Date().toISOString();
    const feedbackInserts = validEntries.map((entry) => ({
      form_id: formId,
      variant_id: entry.variant_id,
      feedback_text: entry.feedback_text,
      submitted_at: submittedAt,
    }));

    const { error: insertError } = await supabase
      .from("feedback_responses")
      .insert(feedbackInserts as any);

    if (insertError) {
      console.error("Feedback insert error:", insertError);
      return {
        success: false,
        error: "Er ging iets mis bij het opslaan van je feedback",
      };
    }

    // UPDATE forms table: set status to 'completed'
    const updateData: FormUpdate = { status: "completed" };
    const { error: updateError } = (await (supabase as any)
      .from("forms")
      .update(updateData)
      .eq("id", formId)) as { error: any };

    if (updateError) {
      // Log but continue — feedback is already saved, status update is secondary
      console.error("Form status update error:", updateError);
    }

    // Fire-and-forget webhook
    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_name: clientName }),
      keepalive: true,
    }).catch((err) => console.error("Webhook failed:", err));

    // Revalidate the public feedback page to show read-only view
    revalidatePath("/feedback/" + slug);

    return { success: true };
  } catch (error) {
    console.error("Submit feedback error:", error);
    return {
      success: false,
      error: "Er ging iets mis bij het opslaan van je feedback",
    };
  }
}
