import React, { Dispatch, SetStateAction } from 'react'
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogContent } from './ui/dialog'
import Image from 'next/image'
import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs'
import { useTranslations } from 'next-intl'
import { buttonVariants } from './ui/button'

const LoginModal = ({isOpen, setIsOpen} : {
    isOpen: boolean,
    setIsOpen: Dispatch<SetStateAction<boolean>>
}) => {
  const t = useTranslations('common.loginModal')

  return <Dialog onOpenChange={setIsOpen} open={isOpen}>
    <DialogContent className='absolute z-[9999999]'>
        <DialogHeader>
            <div className='relative mx-auto w-24 h-24 mb-2'>
                <Image src="/snake-1.png" 
                alt={t('imageAlt')}
                className='object-contain'
                fill />
            </div>
          <DialogTitle className='text-3xl text-center font-bold tracking-tight text-gray-900'>
            {t('title')}
          </DialogTitle>
          <DialogDescription className='text-base text-center py-2'>
            {t.rich('description', {
              saved: (chunks) => <span className='font-medium text-zinc-900'>{chunks}</span>,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-2 gap-6 divide-x divide-gray-200'>
          <LoginLink className={buttonVariants({variant: "outline"})}>
            {t('login')}
          </LoginLink>
          <RegisterLink className={buttonVariants({variant:"default"})}>
            {t('register')}
          </RegisterLink>
        </div>
    </DialogContent>
  </Dialog>
}

export default LoginModal
