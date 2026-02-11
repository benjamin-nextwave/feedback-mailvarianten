import { z } from "zod";

// Reusable variant schema for email subject and body
export const variantSchema = z.object({
  subject: z.string().min(1, "Onderwerp is verplicht"),
  body: z.string().min(1, "Inhoud is verplicht"),
});

// Main form creation schema
export const formSchema = z
  .object({
    // Required client name
    klantnaam: z.string().min(1, "Klantnaam is verplicht"),

    // Eerste mail variants: required, 1-5 items
    eerste_mail_variants: z
      .array(variantSchema)
      .min(1, "Minimaal 1 variant vereist")
      .max(5, "Maximaal 5 varianten toegestaan"),

    // Opvolgmail 1 toggle and variants
    opvolgmail_1_enabled: z.boolean().default(false),
    opvolgmail_1_variants: z.array(variantSchema).optional(),

    // Opvolgmail 2 toggle and variants
    opvolgmail_2_enabled: z.boolean().default(false),
    opvolgmail_2_variants: z.array(variantSchema).optional(),
  })
  .superRefine((data, ctx) => {
    // If opvolgmail_1 is enabled, variants must be provided (1-5 items)
    if (data.opvolgmail_1_enabled) {
      if (!data.opvolgmail_1_variants || data.opvolgmail_1_variants.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Minimaal 1 variant vereist voor opvolgmail 1",
          path: ["opvolgmail_1_variants"],
        });
      } else if (data.opvolgmail_1_variants.length > 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Maximaal 5 varianten toegestaan voor opvolgmail 1",
          path: ["opvolgmail_1_variants"],
        });
      }
    }

    // If opvolgmail_2 is enabled, variants must be provided (1-5 items)
    if (data.opvolgmail_2_enabled) {
      if (!data.opvolgmail_2_variants || data.opvolgmail_2_variants.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Minimaal 1 variant vereist voor opvolgmail 2",
          path: ["opvolgmail_2_variants"],
        });
      } else if (data.opvolgmail_2_variants.length > 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Maximaal 5 varianten toegestaan voor opvolgmail 2",
          path: ["opvolgmail_2_variants"],
        });
      }

      // Opvolgmail 2 can only be enabled if opvolgmail 1 is also enabled
      if (!data.opvolgmail_1_enabled) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Opvolgmail 2 kan alleen worden ingeschakeld als opvolgmail 1 actief is",
          path: ["opvolgmail_2_enabled"],
        });
      }
    }
  });

// Export TypeScript type
export type FormSchemaType = z.infer<typeof formSchema>;
