'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
}

export class DashboardErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Dashboard error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ошибка загрузки дашборда</h2>
            <p className="text-gray-600 mb-6">
              Обновите страницу или перейдите в Заказы или Профиль. Если ошибка повторяется — откройте консоль (F12) и сообщите об ошибке.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => this.setState({ hasError: false })}
                className="gap-2"
                size="lg"
              >
                <RefreshCw className="h-5 w-5" />
                Попробовать снова
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.location.href = '/orders'}
              >
                Перейти к заказам
              </Button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
