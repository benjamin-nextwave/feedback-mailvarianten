import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FormNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Formulier niet gevonden
        </h1>
        <p className="text-muted-foreground">
          Het formulier dat je zoekt bestaat niet of is verwijderd.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Terug naar overzicht</Link>
      </Button>
    </div>
  );
}
