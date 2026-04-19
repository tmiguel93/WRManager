import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: string;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, badge, className }: PageHeaderProps) {
  return (
    <header className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        {eyebrow ? (
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {eyebrow}
          </span>
        ) : null}
        {badge ? (
          <Badge className="rounded-full border border-cyan-300/40 bg-cyan-500/10 text-cyan-200">
            {badge}
          </Badge>
        ) : null}
      </div>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        {title}
      </h1>
      {description ? <p className="max-w-3xl text-sm text-muted-foreground md:text-base">{description}</p> : null}
    </header>
  );
}
