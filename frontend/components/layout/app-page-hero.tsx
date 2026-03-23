import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type AppPageHeroProps = {
  eyebrow: string
  title: string
  description?: string
  gradientTitle?: boolean
  /** Крупный заголовок как на лендинге */
  titleSize?: 'default' | 'hero'
  leading?: ReactNode
  actions?: ReactNode
  maxWidthClass?: string
  centered?: boolean
  /** Подсветка за контентом */
  spotlight?: boolean
  className?: string
}

export function AppPageHero({
  eyebrow,
  title,
  description,
  gradientTitle = true,
  titleSize = 'hero',
  leading,
  actions,
  maxWidthClass = 'max-w-7xl',
  centered = false,
  spotlight = true,
  className,
}: AppPageHeroProps) {
  const titleClass = cn(
    'mt-3 text-balance font-semibold tracking-tight',
    titleSize === 'hero' && 'text-display-xl',
    titleSize === 'default' && 'text-3xl md:text-4xl',
    gradientTitle && titleSize === 'hero' && 'text-gradient-hero',
    gradientTitle && titleSize === 'default' && 'text-gradient-headline',
    !gradientTitle && 'text-foreground'
  )

  return (
    <div className={cn('relative overflow-hidden border-b border-border/40 bg-hero-mesh', className)}>
      {spotlight ? <div className="hero-spotlight pointer-events-none absolute inset-0" aria-hidden /> : null}
      <div
        className="tech-orb -left-28 top-4 h-[18rem] w-[18rem] animate-float-soft bg-primary/22"
        style={{ animationDelay: '-3s' }}
        aria-hidden
      />
      <div
        className="tech-orb -right-10 top-10 h-[20rem] w-[20rem] animate-float-soft bg-sky-400/18"
        style={{ animationDelay: '-8s' }}
        aria-hidden
      />
      <div
        className="tech-orb bottom-0 left-1/3 h-48 w-48 bg-cyan-500/12 opacity-50 blur-[70px]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />

      <div className={cn('container relative mx-auto px-4 py-12 md:py-16', maxWidthClass, centered && 'text-center')}>
        {centered ? (
          <>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
            <h1 className={titleClass}>{title}</h1>
            {description ? (
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">{description}</p>
            ) : null}
            {actions ? <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div> : null}
          </>
        ) : (
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
              {leading ? <div className="shrink-0">{leading}</div> : null}
              <div className="min-w-0">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
                <h1 className={titleClass}>{title}</h1>
                {description ? (
                  <p className="mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">{description}</p>
                ) : null}
              </div>
            </div>
            {actions ? <div className="shrink-0 md:pb-0.5">{actions}</div> : null}
          </div>
        )}
      </div>
    </div>
  )
}
