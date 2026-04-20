import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { auth0 } from '@/lib/auth0'
import { SidebarNav } from '@/components/layout/sidebar-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth0.getSession()

  if (!session) {
    redirect('/auth/login' as Route)
  }

  return (
    <div className="flex min-h-screen bg-cream-50">
      <SidebarNav />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
