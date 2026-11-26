export function getUploadErrorKey(error: unknown): 'tooLarge' | 'invalidFile' | 'generic' {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? error.code
    : undefined

  switch (code) {
    case 'TOO_LARGE':
    case 'FILE_LIMIT_EXCEEDED':
      return 'tooLarge'
    case 'BAD_REQUEST':
    case 'TOO_SMALL':
    case 'TOO_MANY_FILES':
      return 'invalidFile'
    default:
      return 'generic'
  }
}
