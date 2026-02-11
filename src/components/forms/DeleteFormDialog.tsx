"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteFormAction } from "@/lib/actions/form-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteFormDialogProps {
  formId: string;
  formName: string;
  trigger?: React.ReactNode;
}

export function DeleteFormDialog({
  formId,
  formName,
  trigger,
}: DeleteFormDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteFormAction(formId);
    // Note: deleteFormAction redirects to dashboard, so no need to reset isDeleting
    // The component will unmount during redirect
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Verwijderen
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Weet je zeker dat je dit formulier wilt verwijderen?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Het formulier voor "{formName}" wordt permanent verwijderd,
            inclusief alle varianten en feedback. Deze actie kan niet ongedaan
            worden gemaakt.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Annuleren
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Verwijderen..." : "Verwijderen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
