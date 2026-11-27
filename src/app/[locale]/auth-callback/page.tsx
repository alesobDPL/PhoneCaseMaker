"use client"

import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { getAuthStatus } from "./Actions"
import { useRouter } from "@/i18n/navigation"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const Page = () => {
  const t = useTranslations('common.authCallback')
  const [configId, setConfigId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Fetch configuration ID from localStorage
    const configurationId = localStorage.getItem("configurationId")
    if (configurationId) setConfigId(configurationId)
  }, [])

  const { data, isError } = useQuery({
    queryKey: ["auth.callback"],
    queryFn: async () => await getAuthStatus(),
    retry: 3,
    retryDelay: 500,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  useEffect(() => {
    if (!isError && data?.success) {
      if (configId) {
        localStorage.removeItem("configurationId")
        router.push(`/configure/preview?id=${configId}`)
      } else {
        router.push("/")
      }
    }
  }, [data, isError, configId, router])

  if (isError) {
    return (
      <div className="w-full mt-24 flex justify-center px-4">
        <div role="alert" className="flex flex-col items-center gap-2 text-center">
          <h3 className="font-semibold text-xl">{t('errorTitle')}</h3>
          <p>{t('errorDescription')}</p>
          <LoginLink className={cn(buttonVariants(), 'min-h-touch min-w-touch duration-150 focus-visible:ring-2')}>
            {t('retry')}
          </LoginLink>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mt-24 flex justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 aria-hidden="true" className="h-8 w-8 animate-spin text-zinc-500"/>
        <h3 className="font-semibold text-xl">{t('title')}</h3>
        <p>{t('description')}</p>
      </div>
    </div>
  )
}

export default Page
