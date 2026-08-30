import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "cream";

const variants: Record<Variant, string> = {
  primary:
    "bg-cream text-ink hover:bg-cream-dim disabled:bg-line disabled:text-sage",
  secondary:
    "bg-wash text-cream border border-line hover:border-sage disabled:opacity-50",
  ghost: "bg-transparent text-cream hover:bg-wash disabled:opacity-40",
  cream: "bg-cream/10 text-cream border border-cream/20 hover:bg-cream/16",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(function Button({ className, variant = "primary", type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-medium tracking-wide",
        "transition-colors duration-150 ease-out-soft select-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream",
        "active:scale-[0.98] disabled:pointer-events-none disabled:active:scale-100",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
