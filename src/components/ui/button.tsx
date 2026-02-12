// src/components/ui/button.tsx

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-[#C72C48] text-white hover:bg-[#A61F38] shadow-lg shadow-[#C72C48]/20 border-transparent",
    secondary: "bg-zinc-900 text-white hover:bg-zinc-800 border-transparent",
    outline:
      "bg-transparent border border-zinc-200 text-zinc-900 hover:bg-zinc-50",
  };

  const sizes = {
    sm: "h-8 px-4 text-xs rounded-lg",
    md: "h-11 px-6 text-sm rounded-xl",
    lg: "h-12 px-8 text-base rounded-xl",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
