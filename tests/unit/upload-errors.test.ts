import { describe, expect, it } from 'vitest'
import { getUploadErrorMessage, UPLOAD_ERROR_MESSAGES } from '@/lib/upload-errors'

describe('getUploadErrorMessage', () => {
  it.each(['TOO_LARGE', 'FILE_LIMIT_EXCEEDED'])('returns tooLarge for %s', (code) => {
    expect(getUploadErrorMessage({ code })).toBe(UPLOAD_ERROR_MESSAGES.tooLarge)
  })

  it.each(['BAD_REQUEST', 'TOO_SMALL', 'TOO_MANY_FILES'])('returns invalidFile for %s', (code) => {
    expect(getUploadErrorMessage({ code })).toBe(UPLOAD_ERROR_MESSAGES.invalidFile)
  })

  it.each([
    ['MISSING_ENV', { code: 'MISSING_ENV', message: 'Internal configuration details' }],
    ['an unknown code', { code: 'UNKNOWN' }],
    ['an object without code', { message: 'Internal details' }],
    ['a non-string code', { code: 413 }],
    ['a native Error', new Error('Internal details')],
    ['a string', 'TOO_LARGE'],
    ['null', null],
    ['undefined', undefined],
  ])('returns generic for %s', (_, error) => {
    expect(getUploadErrorMessage(error)).toBe(UPLOAD_ERROR_MESSAGES.generic)
  })
})
