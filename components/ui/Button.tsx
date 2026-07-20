import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "outline" | "ghost" | "link" | "whatsapp"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Basic variant/size styles without class-variance-authority for simplicity
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    const variants = {
      default: "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/30",
      outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      whatsapp: "bg-[#25D366] text-white hover:bg-[#20b958] shadow-lg shadow-[#25D366]/30",
    }
    
    const sizes = {
      default: "h-12 px-6 py-2",
      sm: "h-9 px-3",
      lg: "h-14 px-8 text-base",
      icon: "h-10 w-10",
    }

    return (
      <Comp
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
