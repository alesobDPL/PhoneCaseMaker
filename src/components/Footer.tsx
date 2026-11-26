import React from 'react'
import MaxWidthWrapper from './MaxWidthWrapper'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

const Footer = () => {
  const t = useTranslations('common.footer')

  return (
    <footer className='bg-white h-20 relative'>
        <MaxWidthWrapper>
            <div className='border-t border-gray-200'/>

            <div className='h-full flex flex-col md:flex-row
            md:justify-between justify-center items-center'>
                <div className='text-center md:tex-left pb-2 md:pb-0'>
                    <p className='text-sm text-muted-foreground'>
                        {t('copyright', { year: new Date().getFullYear() })}
                    </p>
                </div>

                <div className='flex items-center justifiy-center'>
                    <div className='flex space-x-8'>
                        <Link 
                        href={"#"} 
                        className='text-sm text-muted-foreground
                        hover:text-gray-600'>
                        {t('terms')}
                        </Link>
                        <Link 
                        href={"#"} 
                        className='text-sm text-muted-foreground
                        hover:text-gray-600'>
                        {t('privacy')}
                        </Link>
                        <Link 
                        href={"#"} 
                        className='text-sm text-muted-foreground
                        hover:text-gray-600'>
                        {t('cookies')}
                        </Link>
                    </div>
                </div>
            </div>
        </MaxWidthWrapper>
    </footer>
  )
}

export default Footer
