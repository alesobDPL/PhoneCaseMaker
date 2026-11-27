import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Steps from '@/components/Steps'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import type { ReactNode } from 'react'

const layout = async ({ children }: { children: ReactNode }) => {
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={{ common: messages.common, configure: messages.configure }}>
      <MaxWidthWrapper className='flex flex-1 flex-col'>
        <Steps />
        {children}
      </MaxWidthWrapper>
    </NextIntlClientProvider>
  )
}

export default layout
