import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/src/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-bold transition-all duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-[3px] border-[var(--text-main)] shadow-[4px_4px_0_0_var(--text-main)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_var(--text-main)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--color-on-primary)]",
        destructive:
          "bg-[var(--color-destructive)] text-white",
        outline:
          "bg-[var(--fabric-cream)] text-[var(--text-main)]",
        secondary:
          "bg-[var(--color-secondary)] text-[var(--text-main)]",
        ghost: "border-none shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-black/5 active:scale-95",
        link: "border-none shadow-none hover:translate-x-0 hover:translate-y-0 text-[var(--primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 px-3 py-1 text-xs border-[2.5px] shadow-[3px_3px_0_0_var(--text-main)] hover:shadow-[4px_4px_0_0_var(--text-main)]",
        lg: "h-12 px-8 py-3 text-base border-[3.5px] shadow-[5px_5px_0_0_var(--text-main)] hover:shadow-[7px_7px_0_0_var(--text-main)]",
        icon: "h-10 w-10 p-0 flex items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
