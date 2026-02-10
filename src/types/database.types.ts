export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      forms: {
        Row: {
          id: string
          client_name: string
          slug: string
          status: 'active' | 'completed'
          webhook_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_name: string
          slug: string
          status?: 'active' | 'completed'
          webhook_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_name?: string
          slug?: string
          status?: 'active' | 'completed'
          webhook_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      email_variants: {
        Row: {
          id: string
          form_id: string
          email_type: 'eerste_mail' | 'opvolgmail_1' | 'opvolgmail_2'
          variant_number: number
          subject_line: string
          email_body: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          form_id: string
          email_type: 'eerste_mail' | 'opvolgmail_1' | 'opvolgmail_2'
          variant_number: number
          subject_line: string
          email_body: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          email_type?: 'eerste_mail' | 'opvolgmail_1' | 'opvolgmail_2'
          variant_number?: number
          subject_line?: string
          email_body?: string
          sort_order?: number
          created_at?: string
        }
      }
      feedback_responses: {
        Row: {
          id: string
          form_id: string
          variant_id: string
          feedback_text: string
          submitted_at: string
        }
        Insert: {
          id?: string
          form_id: string
          variant_id: string
          feedback_text: string
          submitted_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          variant_id?: string
          feedback_text?: string
          submitted_at?: string
        }
      }
    }
  }
}

// Convenience type aliases
export type Form = Database['public']['Tables']['forms']['Row']
export type FormInsert = Database['public']['Tables']['forms']['Insert']
export type FormUpdate = Database['public']['Tables']['forms']['Update']

export type EmailVariant = Database['public']['Tables']['email_variants']['Row']
export type EmailVariantInsert = Database['public']['Tables']['email_variants']['Insert']
export type EmailVariantUpdate = Database['public']['Tables']['email_variants']['Update']

export type FeedbackResponse = Database['public']['Tables']['feedback_responses']['Row']
export type FeedbackResponseInsert = Database['public']['Tables']['feedback_responses']['Insert']
export type FeedbackResponseUpdate = Database['public']['Tables']['feedback_responses']['Update']
