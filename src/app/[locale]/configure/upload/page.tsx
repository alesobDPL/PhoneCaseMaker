"use client"

import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { getUploadErrorMessage, UPLOAD_ERROR_MESSAGES } from '@/lib/upload-errors'
import { useUploadThing } from '@/lib/uploadthing'
import { cn } from '@/lib/utils'
import { Image, Loader2, MousePointerSquareDashed } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import React, { useState, useTransition } from 'react'
import Dropzone from 'react-dropzone'

const Page = () => {

    const { toast } = useToast()
    const [isDragOver, setIsDragOver] = useState<boolean>(false)
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const router = useRouter()

    const { startUpload, isUploading } = useUploadThing('imageUploader', {
        onClientUploadComplete: ([data]) => {
           
          const configId = data.serverData.configId
          startTransition(() => {
            router.push(`/configure/design?id=${configId}`)
          })
        },
        onUploadError: handleUploadError,
        onUploadProgress(p) {
          setUploadProgress(p)
        },
      })

    function handleUploadError(error: unknown) {
        setIsDragOver(false)
        setUploadProgress(0)
        toast({ ...getUploadErrorMessage(error), variant: 'destructive' })
    }

    const onDropRejected = () => {
        setIsDragOver(false)
        toast({ ...UPLOAD_ERROR_MESSAGES.unsupportedType, variant: 'destructive' })
    }
    const onDropAccepted = (acceptedFiles: File[]) => {
        void startUpload(acceptedFiles, { configId: undefined }).catch(handleUploadError)

        setIsDragOver(false)
    }
;
    const [isPending, startTransition] = useTransition();
    


  return(
    <div 
        className={cn( 
            "relative h-full flex-1 my-16 w-full rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:rounded-2xl flex justify-center flex-col items-center", 
            {
            'ring-blue-900/25 bg-blue-900/10': isDragOver},
        
        
            )}>
                <div className='relative flex flex-1 flex-
                items-center justify-center w-full'>
                    <Dropzone 
                        onDropRejected={onDropRejected} 
                        onDropAccepted={onDropAccepted}
                        accept={{
                            "image/png":[".png"],
                            "image/jpeg":[".jpeg"],
                             "image/jpg":[".jpg"],
                        }}
                        onDragEnter={()=> setIsDragOver(true)}
                        onDragLeave={()=> setIsDragOver(false)}
                    >
                        {({getRootProps,getInputProps})=>(
                            <div className='h-full w-full flex-1 flex flex-col items-center
                            justify-center' {...getRootProps()}>
                
                                <input {...getInputProps()}/>
                            
                                {isDragOver? (
                                    <MousePointerSquareDashed className='h-6 w-6 text-zinc-500 mb-2'/>
                                ): isUploading || isPending ?  (
                                <Loader2 className='animate-spin h-6 w-6 text-zinc-500 mb-2'/>
                                ) : (
                                    <Image className='h-6 w-6 text-zinc-500 mb-2'/>
                            )}

                            <div className='flex flex-col justify-center mb-2 text-sm
                            text-zinc-700'>
                                {isUploading ?( 
                                    <div className='flex flex-col items-center'>
                                        <p>Uploading...</p>
                                        <Progress
                                        value={uploadProgress}
                                        className='mt-2 w-40 h-2 bg-gray-300'/>
                                    </div> 
                                ): isPending ? ( 
                                    <div className='flex flex-col items-center'>
                                        <p>redirecting, please wait...</p>
                                    </div>
                                ) : isDragOver ? (
                                    <p>
                                    <span className='font-semibold'>Drop file</span>{" "}
                                    To upload
                                    </p>
                                ) :(  
                                <p>
                                    <span className='font-semibold'>Click to upload</span>{" "}
                                    or drag and drop
                                </p>
                                    )}
                            </div>

                            {isPending ? null : <p className='text-xs text-zinc-500'>PNG, JPG, JPEG</p>}
                            </div>
                        )}
                    </Dropzone>
                </div>
            </div>
        )
}

export default Page
