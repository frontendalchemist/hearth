import { requireSession } from '@/lib/auth'
import { Shell } from '@/components/shared'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSession()

  return <Shell>{children}</Shell>
}
