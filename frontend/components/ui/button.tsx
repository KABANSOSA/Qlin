import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-semibold tracking-tight ring-offset-background transition-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-elevated hover:bg-primary/92 hover:shadow-elevated-lg',
        /** Продающий градиент + сильная тень — главные CTA */
        cta:
          'btn-cta-shine border border-white/15 bg-gradient-to-br from-primary via-[hsl(210,62%,42%)] to-[hsl(199,72%,36%)] text-primary-foreground shadow-[0_16px_48px_-6px_hsl(221_62%_45%/0.55)] hover:shadow-[0_22px_56px_-6px_hsl(221_62%_45%/0.62)] hover:brightness-[1.03]',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-elevated',
        outline:
          'border border-input bg-background hover:bg-accent/80 hover:border-border',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/85 shadow-sm',
        ghost: 'hover:bg-accent/80 hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline shadow-none active:scale-100',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
