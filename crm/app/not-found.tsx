import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md rounded-2xl border border-border bg-white p-8 text-center shadow-lg">
        <p className="text-4xl font-bold text-primary">404</p>
        <h1 className="mt-2 text-lg font-semibold text-foreground">Страница не найдена</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Проверьте адрес. Главная CRM — после входа; если не авторизованы, откройте страницу входа.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Вход в CRM
          </Link>
          <Link href="/" className="inline-flex justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium">
            На главную
          </Link>
        </div>
      </div>
    </div>
  )
}
