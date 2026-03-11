'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, KeyRound, Phone, MessageCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

      <div className="relative w-full max-w-md animate-fade-in">
        <Card className="border-2 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg p-6">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm mb-2">
              <KeyRound className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Восстановление пароля</CardTitle>
            <CardDescription className="text-white/90 mt-2">
              Свяжитесь с нами — мы поможем восстановить доступ
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <p className="text-gray-600">
              Напишите или позвоните нам, и мы восстановим доступ к аккаунту в кратчайшие сроки.
            </p>
            <div className="space-y-3">
              <a
                href="tel:+79621129483"
                className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                <Phone className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-gray-900">8 (962) 112-94-83</span>
              </a>
              <a
                href="https://t.me/CleaningRu_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors"
              >
                <MessageCircle className="h-5 w-5 text-indigo-600" />
                <span className="font-semibold text-gray-900">Telegram: @CleaningRu_bot</span>
              </a>
            </div>
            <Link href="/auth/login" className="block">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Вернуться ко входу
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
