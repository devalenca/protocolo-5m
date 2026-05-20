import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-sans text-sm font-medium tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand rounded-[var(--radius)]",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-primary-foreground hover:bg-brand-bright shadow-[var(--shadow-sm)]",
        ghost: "text-text-dim hover:bg-bg-elev hover:text-text",
        outline:
          "border border-line bg-bg-card text-text hover:bg-bg-elev hover:border-line-strong",
        danger:
          "bg-danger text-white hover:bg-danger/90 shadow-[var(--shadow-sm)]",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      block: false,
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  block,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
