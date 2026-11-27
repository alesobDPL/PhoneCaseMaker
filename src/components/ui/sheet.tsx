'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as React from 'react'
import { cn } from '@/lib/utils'

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetTitle = DialogPrimitive.Title
const SheetClose = DialogPrimitive.Close

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: 'right' }
>(({ side = 'right', className, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-zinc-900/50 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0 duration-150" />
    <DialogPrimitive.Content
      ref={ref}
      data-side={side}
      className={cn(
        'fixed inset-y-0 right-0 z-50 w-[85%] max-w-xs overflow-y-auto border-l bg-background p-4 shadow-lg',
        'motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:slide-in-from-right motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:slide-out-to-right duration-150',
        className,
      )}
      {...props}
    />
  </DialogPrimitive.Portal>
))
SheetContent.displayName = DialogPrimitive.Content.displayName

function SheetHeader({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('flex items-center justify-between gap-2', className)} {...props} />
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose }
