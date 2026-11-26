import { db } from '@/db'
import { getCurrencyPreference } from '@/lib/currency-preference'
import { notFound } from 'next/navigation'
import DesignPreview from './DesignPreview'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const Page = async ({ searchParams }: PageProps) => {
  
  const { id } = await searchParams;

  if (!id || typeof id !== 'string') {
    return notFound()
  }

  const configuration = await db.configuration.findUnique({
    where: { id },
  })

  if(!configuration) {
    return notFound()
  }

  const currency = await getCurrencyPreference()
  return <DesignPreview configuration={configuration} currency={currency} />
}

export default Page
