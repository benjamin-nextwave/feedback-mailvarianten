import React from "react";
import { FileQuestion } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileQuestion className="mb-4 h-12 w-12 text-muted-foreground/50" />
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-4 text-muted-foreground">{description}</p>
      {children && <div>{children}</div>}
    </div>
  );
}
