"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyLinkButtonProps {
  url: string;
}

export function CopyLinkButton({ url }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2"
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          <span className="text-success">Gekopieerd!</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Kopieer link
        </>
      )}
    </Button>
  );
}
