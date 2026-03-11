import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'О нас',
  description: 'История и миссия QLIN. Как мы создаём клининг нового формата — простой, прозрачный и удобный.',
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
