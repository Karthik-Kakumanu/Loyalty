import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type HeaderProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
};

export function Header({ title, subtitle, action, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "flex min-h-[74px] items-center justify-between gap-3 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-xl sm:px-5",
        className,
      )}
    >
      <div className="min-w-0">
        {title ? (
          <h1 className="truncate text-xl font-bold tracking-tight text-zinc-900">{title}</h1>
        ) : (
          <Image
            src="/logo.jpg"
            alt="Revistra"
            width={4320}
            height={1728}
            priority
            sizes="(max-width: 640px) 54vw, 300px"
            className="h-10 w-auto max-w-[58vw] object-contain"
          />
        )}
        {subtitle ? <p className="mt-0.5 truncate text-xs text-zinc-500">{subtitle}</p> : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
