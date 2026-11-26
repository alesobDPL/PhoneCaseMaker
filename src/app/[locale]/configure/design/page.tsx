import { db } from '@/db'
import { getCurrencyPreference } from '@/lib/currency-preference'
import { notFound } from 'next/navigation'
import DesignConfigurator from './DesignConfigurator'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const Page = async ({ searchParams }: PageProps) => {

  const { id } = await searchParams;

  if (!id || typeof id !== 'string') {
    return notFound();
  }

  const configuration = await db.configuration.findUnique({
    where: { id },
  });

  if (!configuration) {
    return notFound();
  }

  const { imageUrl, width, height } = configuration;
  const currency = await getCurrencyPreference()

  return (
    <DesignConfigurator
      configId={configuration.id}
      currency={currency}
      imageDimensions={{ width, height }}
      imageUrl={imageUrl}
    />
  );
}

export default Page;
