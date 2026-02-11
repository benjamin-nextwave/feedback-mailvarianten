'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { formSchema, FormSchemaType } from '@/lib/validations/form-schema';
import { createFormAction } from '@/lib/actions/form-actions';
import {
  Form,
  FormControl,

  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { VariantFieldArray } from '@/components/forms/VariantFieldArray';

export function CreateFormClient() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      klantnaam: '',
      eerste_mail_variants: [{ subject: '', body: '' }],
      opvolgmail_1_enabled: false,
      opvolgmail_1_variants: [{ subject: '', body: '' }],
      opvolgmail_2_enabled: false,
      opvolgmail_2_variants: [{ subject: '', body: '' }],
    },
  });

  const opvolgmail1Enabled = form.watch('opvolgmail_1_enabled');
  const opvolgmail2Enabled = form.watch('opvolgmail_2_enabled');

  async function onSubmit(data: FormSchemaType) {
    setIsSubmitting(true);
    setGeneralError(null);

    try {
      const result = await createFormAction(data);

      if (result?.errors) {
        // Set field-specific errors
        Object.entries(result.errors).forEach(([field, messages]) => {
          form.setError(field as any, {
            type: 'manual',
            message: Array.isArray(messages) ? messages.join(', ') : messages,
          });
        });
      } else if (result?.message) {
        // Set general error message
        setGeneralError(result.message);
      }
      // If successful, createFormAction will redirect, so no need to handle success here
    } catch (error) {
      setGeneralError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Basisgegevens */}
        <Card>
          <CardHeader>
            <CardTitle>Basisgegevens</CardTitle>
            <CardDescription>Algemene informatie over het formulier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="klantnaam"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Klantnaam *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Bijv. Acme Corporation" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </CardContent>
        </Card>

        {/* Section 2: Eerste mail */}
        <Card>
          <CardContent className="pt-6">
            <VariantFieldArray
              control={form.control}
              name="eerste_mail_variants"
              label="Eerste mail"
              minItems={1}
              maxItems={5}
            />
          </CardContent>
        </Card>

        {/* Section 3: Opvolgmail 1 */}
        <Card>
          <CardHeader>
            <div className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle>Opvolgmail 1</CardTitle>
                <CardDescription>Voeg een eerste opvolgmail toe</CardDescription>
              </div>
              <FormField
                control={form.control}
                name="opvolgmail_1_enabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (!checked) {
                            // When disabling opvolgmail 1, also disable opvolgmail 2 and reset variants
                            form.setValue('opvolgmail_2_enabled', false);
                            form.setValue('opvolgmail_1_variants', [{ subject: '', body: '' }]);
                            form.setValue('opvolgmail_2_variants', [{ subject: '', body: '' }]);
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardHeader>
          {opvolgmail1Enabled && (
            <CardContent>
              <VariantFieldArray
                control={form.control}
                name="opvolgmail_1_variants"
                label="Opvolgmail 1 varianten"
                minItems={1}
                maxItems={5}
              />
            </CardContent>
          )}
        </Card>

        {/* Section 4: Opvolgmail 2 (only visible when opvolgmail 1 is enabled) */}
        {opvolgmail1Enabled && (
          <Card>
            <CardHeader>
              <div className="flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle>Opvolgmail 2</CardTitle>
                  <CardDescription>Voeg een tweede opvolgmail toe</CardDescription>
                </div>
                <FormField
                  control={form.control}
                  name="opvolgmail_2_enabled"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (!checked) {
                              form.setValue('opvolgmail_2_variants', [{ subject: '', body: '' }]);
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardHeader>
            {opvolgmail2Enabled && (
              <CardContent>
                <VariantFieldArray
                  control={form.control}
                  name="opvolgmail_2_variants"
                  label="Opvolgmail 2 varianten"
                  minItems={1}
                  maxItems={5}
                />
              </CardContent>
            )}
          </Card>
        )}

        {/* Submit area */}
        <div className="space-y-4">
          {generalError && (
            <div className="text-sm text-destructive">{generalError}</div>
          )}
          <div className="flex justify-end gap-4">
            <Link href="/dashboard">
              <Button type="button" variant="outline">
                Annuleren
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Aanmaken...' : 'Formulier aanmaken'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
