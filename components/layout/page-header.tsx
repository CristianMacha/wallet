import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  backHref?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, backHref, action }: PageHeaderProps) {
  return (
    <header className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
      {backHref && (
        <Link
          href={backHref}
          className="text-muted-foreground hover:text-foreground transition-colors -ml-1 p-1"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      )}
      <h1 className="text-base font-semibold flex-1">{title}</h1>
      {action && <div className="ml-auto">{action}</div>}
    </header>
  );
}
