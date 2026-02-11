import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-[#C72C48] text-white hover:bg-[#A61F38] shadow-lg shadow-[#C72C48]/20 border-transparent",
    secondary: "bg-zinc-900 text-white hover:bg-zinc-800 border-transparent",
    outline: "bg-transparent border border-zinc-200 text-zinc-900 hover:bg-zinc-50",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center h-11 px-6 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}