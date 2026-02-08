import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 text-center border-2 border-dashed rounded-lg border-muted">
      <div className="p-2 bg-muted/20 rounded-full mb-2">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium tracking-tight mb-0.5">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-xs mb-3">{description}</p>
      {action}
    </div>
  );
}
