import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "active" | "completed";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "completed") {
    return <Badge variant="success">Ingeleverd</Badge>;
  }

  return <Badge variant="pending">Openstaand</Badge>;
}
