import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, containerClassName, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div className={cn("w-full space-y-1.5", containerClassName)}>
        {label ? (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {label}
          </label>
        ) : null}

        <input
          id={inputId}
          ref={ref}
          className={cn(
            "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900",
            "placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
            "disabled:cursor-not-allowed disabled:opacity-60",
            error ? "border-red-500 focus-visible:ring-red-200" : "",
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />

        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-red-600">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-xs text-zinc-500">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
