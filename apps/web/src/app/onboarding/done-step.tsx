'use client'

import { Button } from '@/components/ui/button'

export function DoneStep({
  recipientName,
  onAddAnother,
  onFinish,
}: {
  recipientName: string
  onAddAnother: () => void
  onFinish: () => void
}) {
  return (
    <div className="space-y-6 text-center">
      <h1 className="font-serif text-3xl">
        {recipientName ? `${recipientName} has been added` : 'Care recipient added'}
      </h1>
      <p className="text-muted-foreground">
        Would you like to add another care recipient?
      </p>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
        <Button type="button" variant="outline" onClick={onAddAnother}>
          Add another
        </Button>
        <Button type="button" onClick={onFinish}>
          Go to home
        </Button>
      </div>
    </div>
  )
}
