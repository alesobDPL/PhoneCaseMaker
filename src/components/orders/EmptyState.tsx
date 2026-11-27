import { Package } from 'lucide-react'
import type { ReactElement } from 'react'

type EmptyStateProps = {
  title: string
  description: string
  action: ReactElement
  'data-testid': string
}

export function EmptyState({ title, description, action, 'data-testid': testId }: EmptyStateProps) {
  return (
    <div data-testid={testId} className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card px-4 py-12 text-center text-card-foreground">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Package aria-hidden="true" className="size-6" />
      </span>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}
