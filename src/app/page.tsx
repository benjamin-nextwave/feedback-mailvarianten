import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <PageHeader
          title="NextWave Solutions"
          description="Feedback Platform"
        />

        <div className="mt-12 space-y-12">
          {/* Buttons Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Knoppen</h2>
            <div className="flex flex-wrap gap-3">
              <Button>Primaire actie</Button>
              <Button variant="secondary">Secundaire actie</Button>
              <Button variant="outline">Omlijnd</Button>
              <Button variant="destructive">Verwijderen</Button>
            </div>
          </section>

          {/* Cards Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Kaarten</h2>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Voorbeeldkaart</CardTitle>
                <CardDescription>
                  Een beschrijving van de kaartinhoud
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Dit is een voorbeeldkaart met content. Kaarten worden gebruikt
                  om gerelateerde informatie te groeperen en een duidelijke
                  visuele hiërarchie te creëren.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Status Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Status</h2>
            <div className="flex flex-wrap gap-3">
              <StatusBadge status="active" />
              <StatusBadge status="completed" />
            </div>
          </section>

          {/* Form Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Formulier</h2>
            <Card className="bg-muted/50 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-name">Klantnaam</Label>
                    <Input
                      id="client-name"
                      placeholder="Voer klantnaam in"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feedback">Jouw feedback</Label>
                    <Textarea
                      id="feedback"
                      placeholder="Deel hier je feedback..."
                      rows={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Empty State Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Lege staat</h2>
            <Card className="bg-muted/30 shadow-sm">
              <CardContent className="p-6">
                <EmptyState
                  title="Geen formulieren"
                  description="Er zijn nog geen formulieren aangemaakt."
                >
                  <Button>Maak je eerste formulier</Button>
                </EmptyState>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
