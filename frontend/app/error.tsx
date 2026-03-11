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
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Что-то пошло не так
        </h1>
        <p className="text-gray-600 mb-8">
          Произошла ошибка. Попробуйте обновить страницу или вернуться позже.
        </p>
        <Button
          size="lg"
          onClick={reset}
          className="gap-2 gradient-primary text-white"
        >
          <RefreshCw className="h-5 w-5" />
          Попробовать снова
        </Button>
      </div>
    </div>
  )
}
