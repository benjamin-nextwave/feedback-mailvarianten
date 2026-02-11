// Placeholder component for Plan 05-02
// This will be properly implemented in the next plan
export function ReadOnlyView({ form, feedbackResponses }: any) {
  return (
    <div className="rounded-lg border bg-white p-6">
      <p className="text-muted-foreground">
        Read-only view will be implemented in Plan 05-02...
      </p>
      <pre className="mt-4 text-xs text-muted-foreground">
        {JSON.stringify({ form, feedbackResponses }, null, 2)}
      </pre>
    </div>
  );
}
