import { requireSession } from '@/lib/auth'
import { SidebarNav } from '@/components/layout/sidebar-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSession()

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
