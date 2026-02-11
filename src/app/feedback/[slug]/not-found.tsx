import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FeedbackFormNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Formulier niet gevonden
        </h1>
        <p className="text-muted-foreground">
          Dit feedbackformulier bestaat niet of is verwijderd.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Terug naar homepage</Link>
      </Button>
    </div>
  );
}
