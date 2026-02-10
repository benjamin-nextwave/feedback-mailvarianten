import Link from "next/link";
import { Eye } from "lucide-react";
import { Form } from "@/types/database.types";
import { formatDate, generatePublicUrl } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CopyLinkButton } from "./copy-link-button";

interface FormsTableProps {
  forms: Form[];
}

export function FormsTable({ forms }: FormsTableProps) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Klantnaam</TableHead>
            <TableHead>Aangemaakt op</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Deelbare link</TableHead>
            <TableHead>Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {forms.map((form) => (
            <TableRow key={form.id}>
              <TableCell className="font-medium">{form.client_name}</TableCell>
              <TableCell>{formatDate(form.created_at)}</TableCell>
              <TableCell>
                <StatusBadge status={form.status} />
              </TableCell>
              <TableCell>
                <CopyLinkButton url={generatePublicUrl(form.slug)} />
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/${form.id}`}>
                    <Eye className="h-4 w-4" />
                    Bekijken
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
