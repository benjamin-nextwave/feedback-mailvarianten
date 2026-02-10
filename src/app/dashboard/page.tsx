import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FormsTable } from "./_components/forms-table";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: forms, error } = await supabase
    .from("forms")
    .select("id, client_name, slug, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Formulieren konden niet worden geladen");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Formulieren"
        description="Beheer je feedback formulieren"
      />

      {!forms || forms.length === 0 ? (
        <EmptyState
          title="Geen formulieren"
          description="Er zijn nog geen feedback formulieren aangemaakt."
        />
      ) : (
        <FormsTable forms={forms} />
      )}
    </div>
  );
}
