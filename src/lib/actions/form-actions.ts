"use server";

import { createClient } from "@/lib/supabase/server";
import { formSchema, type FormSchemaType } from "@/lib/validations/form-schema";
import type { Form, EmailVariantInsert } from "@/types/database.types";
import { revalidatePath } from "next/cache";
import { redirect, isRedirectError } from "next/navigation";
import slugify from "slugify";

/**
 * Generate a unique slug from client name
 * Format: slugified-client-name-random6
 */
async function generateUniqueSlug(clientName: string): Promise<string> {
  const supabase = await createClient();

  // Base slug from client name
  const baseSlug = slugify(clientName, {
    lower: true,
    strict: true,
    locale: "nl",
  });

  // Try up to 3 times to generate unique slug
  for (let attempt = 0; attempt < 3; attempt++) {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomSuffix}`;

    // Check if slug already exists
    const { data: existing } = await supabase
      .from("forms")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!existing) {
      return slug;
    }
  }

  // If all 3 attempts fail, throw error
  throw new Error("Could not generate unique slug after 3 attempts");
}

/**
 * Create a new form with email variants
 */
export async function createFormAction(data: FormSchemaType) {
  // Server-side validation
  const validation = formSchema.safeParse(data);
  if (!validation.success) {
    return {
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  try {
    // Generate unique slug
    const slug = await generateUniqueSlug(data.klantnaam);

    // Insert form
    const { data: formData, error: formError } = await supabase
      .from("forms")
      .insert({
        client_name: data.klantnaam,
        slug,
        webhook_url: data.webhook_url || null,
        status: "active" as const,
      } as any)
      .select()
      .single();

    if (formError || !formData) {
      console.error("Form creation error:", formError);
      return { message: "Er ging iets mis bij het aanmaken" };
    }

    const form = formData as Form;

    // Build variants array for batch insert
    const variants: EmailVariantInsert[] = [];

    let sortOrder = 0;

    // Add eerste_mail variants
    data.eerste_mail_variants.forEach((variant, index) => {
      variants.push({
        form_id: form.id,
        email_type: "eerste_mail",
        variant_number: index + 1,
        subject_line: variant.subject,
        email_body: variant.body,
        sort_order: sortOrder++,
      });
    });

    // Add opvolgmail_1 variants if enabled
    if (data.opvolgmail_1_enabled && data.opvolgmail_1_variants) {
      data.opvolgmail_1_variants.forEach((variant, index) => {
        variants.push({
          form_id: form.id,
          email_type: "opvolgmail_1",
          variant_number: index + 1,
          subject_line: variant.subject,
          email_body: variant.body,
          sort_order: sortOrder++,
        });
      });
    }

    // Add opvolgmail_2 variants if enabled
    if (data.opvolgmail_2_enabled && data.opvolgmail_2_variants) {
      data.opvolgmail_2_variants.forEach((variant, index) => {
        variants.push({
          form_id: form.id,
          email_type: "opvolgmail_2",
          variant_number: index + 1,
          subject_line: variant.subject,
          email_body: variant.body,
          sort_order: sortOrder++,
        });
      });
    }

    // Batch insert all variants
    const { error: variantsError } = await supabase
      .from("email_variants")
      .insert(variants as any);

    if (variantsError) {
      console.error("Variants creation error:", variantsError);
      return { message: "Er ging iets mis bij het aanmaken" };
    }

    // Revalidate and redirect
    revalidatePath("/dashboard");
    redirect("/dashboard");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Form action error:", error);
    return { message: "Er ging iets mis bij het aanmaken" };
  }
}

/**
 * Delete a form by ID (CASCADE will handle variants and feedback)
 */
export async function deleteFormAction(formId: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("forms")
      .delete()
      .eq("id", formId);

    if (error) {
      console.error("Form deletion error:", error);
      return { message: "Er ging iets mis bij het verwijderen" };
    }

    // Revalidate and redirect
    revalidatePath("/dashboard");
    redirect("/dashboard");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Delete action error:", error);
    return { message: "Er ging iets mis bij het verwijderen" };
  }
}
