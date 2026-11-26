export const NAMESPACES = ['common', 'home', 'configure', 'orders', 'thank-you', 'dashboard'] as const

export function namespaceKey(file: (typeof NAMESPACES)[number]): string {
  return file === 'thank-you' ? 'thankYou' : file
}
