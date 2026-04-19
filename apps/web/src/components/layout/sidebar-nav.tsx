'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FolderOpen,
  Heart,
  MessageSquare,
  Map,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/vault', label: 'Family Vault', icon: FolderOpen },
  { href: '/health-hub', label: 'Health Hub', icon: Heart },
  { href: '/ai-assistant', label: 'AI Assistant', icon: MessageSquare },
  { href: '/stage-navigator', label: 'Stage Navigator', icon: Map },
  { href: '/workspace', label: 'Family Workspace', icon: Users },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-border flex flex-col py-6 px-4 shrink-0">
      <div className="mb-8 px-2">
        <h1 className="font-serif text-xl text-sage-700">Hearth</h1>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-sage-50 text-sage-700'
                : 'text-muted-foreground hover:bg-sage-50 hover:text-sage-700'
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-border pt-4 mt-4">
        <Link
          href="/api/auth/logout"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sage-50 hover:text-sage-700 transition-colors"
        >
          Sign out
        </Link>
      </div>
    </aside>
  )
}
