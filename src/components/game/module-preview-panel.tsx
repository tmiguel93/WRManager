import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ModulePreviewPanelProps {
  title: string;
  description: string;
  status: string;
}

export function ModulePreviewPanel({ title, description, status }: ModulePreviewPanelProps) {
  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle className="font-heading text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="inline-flex rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1 text-xs font-medium tracking-wide text-cyan-100">
          {status}
        </div>
      </CardContent>
    </Card>
  );
}
