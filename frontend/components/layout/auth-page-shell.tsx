import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type AuthPageShellProps = {
  children: ReactNode
  className?: string
  align?: 'center' | 'start'
}

/**
 * Auth: тот же премиальный фон, что и на лендинге.
 */
export function AuthPageShell({ children, className, align = 'center' }: AuthPageShellProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-[calc(100vh-8rem)] justify-center overflow-hidden bg-hero-mesh px-4 py-12',
        align === 'center' ? 'items-center' : 'items-start',
        className
      )}
    >
      <div className="hero-spotlight pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="tech-orb -left-24 top-20 h-72 w-72 animate-float-soft bg-primary/20"
        style={{ animationDelay: '-4s' }}
        aria-hidden
      />
      <div
        className="tech-orb -right-20 bottom-16 h-80 w-80 animate-float-soft bg-sky-400/16"
        style={{ animationDelay: '-9s' }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="relative z-[1] w-full">{children}</div>
    </div>
  )
}
