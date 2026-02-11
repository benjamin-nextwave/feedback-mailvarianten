'use client';

import { useFieldArray, Control } from 'react-hook-form';
import { FormSchemaType } from '@/lib/validations/form-schema';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface VariantFieldArrayProps {
  control: Control<FormSchemaType>;
  name: 'eerste_mail_variants' | 'opvolgmail_1_variants' | 'opvolgmail_2_variants';
  label: string;
  minItems?: number;
  maxItems?: number;
}

export function VariantFieldArray({
  control,
  name,
  label,
  minItems = 1,
  maxItems = 5,
}: VariantFieldArrayProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{label}</h3>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <Card key={field.id} className="border p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <h4 className="text-sm font-medium">Variant {index + 1}</h4>
              {fields.length > minItems && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <FormField
                control={control}
                name={`${name}.${index}.subject`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Onderwerp</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Onderwerp van de email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`${name}.${index}.body`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inhoud</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} placeholder="Inhoud van de email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => append({ subject: '', body: '' })}
        disabled={fields.length >= maxItems}
        className="w-full border-dashed"
      >
        <Plus className="mr-2 h-4 w-4" />
        Variant toevoegen
      </Button>
    </div>
  );
}
