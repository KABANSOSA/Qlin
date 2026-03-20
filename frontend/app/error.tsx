'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

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
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Что-то пошло не так
        </h1>
        <p className="mb-8 text-muted-foreground">
          Произошла ошибка. Попробуйте обновить страницу или вернуться позже.
        </p>
        <Button
          size="lg"
          onClick={reset}
          className="gap-2"
        >
          <RefreshCw className="h-5 w-5" />
          Попробовать снова
        </Button>
      </div>
    </div>
  )
}
