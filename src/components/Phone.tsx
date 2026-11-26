import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { HTMLAttributes } from "react";

interface PhoneProps extends HTMLAttributes<HTMLDivElement>{
    imgSrc: string
    dark?: boolean
}


const Phone = ({imgSrc, className, dark = false, ...props}: PhoneProps) => {
    const t = useTranslations('common.phone');

    return(
        <div
            className={cn(
                'relative pointer-events-none z-50 overflow-hidden',
                className
            )}
            {...props}>
            <img
                src={
                    dark 
                    ? "/phone-template-dark-edges.png"
                    : "/phone-template-white-edges.png"
                }
                className="pointer-events-none z-50 select-none"
                alt={t('templateAlt')}
                />

            <div className="absolute -z-10 inset-0">
                <img 
                    className="object-cover min-w-full  min-h-full" 
                    src={imgSrc} 
                    alt={t('overlayAlt')}
                />
            </div>
        </div>
    )
}

export default Phone;
