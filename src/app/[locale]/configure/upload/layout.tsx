import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { localeAlternates } from '@/lib/seo'

export const metadata: Metadata = { alternates: localeAlternates('/configure/upload') }

export default function UploadLayout({ children }: { children: ReactNode }) {
  return children
}
