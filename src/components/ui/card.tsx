import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "bg-white rounded-2xl border border-zinc-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden", 
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}