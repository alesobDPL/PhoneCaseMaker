export function parseOrderIdParam(value: string | string[] | undefined): string | null {
  return typeof value === 'string' && value ? value : null
}
