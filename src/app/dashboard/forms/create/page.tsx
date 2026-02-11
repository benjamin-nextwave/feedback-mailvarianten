import { CreateFormClient } from './CreateFormClient';
import { PageHeader } from '@/components/page-header';

export default function CreateFormPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nieuw formulier"
        description="Maak een nieuw feedback formulier aan voor een klant"
      />
      <CreateFormClient />
    </div>
  );
}
