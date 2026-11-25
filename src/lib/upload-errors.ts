export const UPLOAD_ERROR_MESSAGES = {
  tooLarge: {
    title: 'File is too large.',
    description: 'Please choose an image of up to 4 MB.',
  },
  invalidFile: {
    title: 'Invalid image file.',
    description: 'Please choose a PNG, JPG, or JPEG image of up to 4 MB.',
  },
  generic: {
    title: 'Upload failed.',
    description: 'Please try again.',
  },
  unsupportedType: {
    title: 'This file type is not supported.',
    description: 'Please choose a PNG, JPG, JPEG image instead.',
  },
}

export function getUploadErrorMessage(error: unknown): { title: string; description: string } {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? error.code
    : undefined

  switch (code) {
    case 'TOO_LARGE':
    case 'FILE_LIMIT_EXCEEDED':
      return UPLOAD_ERROR_MESSAGES.tooLarge
    case 'BAD_REQUEST':
    case 'TOO_SMALL':
    case 'TOO_MANY_FILES':
      return UPLOAD_ERROR_MESSAGES.invalidFile
    default:
      return UPLOAD_ERROR_MESSAGES.generic
  }
}
