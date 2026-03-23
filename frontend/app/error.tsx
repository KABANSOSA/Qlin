'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="relative flex min-h-[75vh] flex-col items-center justify-center overflow-hidden bg-hero-mesh px-4 py-16">
      <div className="hero-spotlight pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-[1] max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
          <AlertCircle className="h-10 w-10 text-destructive" aria-hidden />
        </div>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">Ошибка</p>
        <h1 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Что-то пошло не так
        </h1>
        <p className="mt-4 text-muted-foreground">
          Попробуйте обновить страницу или вернитесь чуть позже. Если сбой повторяется — напишите в поддержку.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" variant="cta" onClick={reset} className="gap-2">
            <RefreshCw className="h-5 w-5" aria-hidden />
            Попробовать снова
          </Button>
          <Link href="/">
            <Button size="lg" variant="outline" className="w-full gap-2 border-border/80 bg-background/80 backdrop-blur-sm sm:w-auto">
              <Home className="h-5 w-5" aria-hidden />
              На главную
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
