"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import {
  LayoutDashboard,
  Plug,
  ListChecks,
  Library,
  FlaskConical,
  History,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/shell/logo"
import { ProjectSwitcher } from "@/components/shell/project-switcher"

const NAV_ITEMS = [
  { href: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { href: "target", label: "Cấu hình chatbot", icon: Plug },
  { href: "requirements", label: "Requirement", icon: ListChecks },
  { href: "contexts", label: "Context", icon: Library },
  { href: "suites", label: "Test suites", icon: FlaskConical },
  { href: "runs", label: "Lịch sử chạy", icon: History },
]

export function AppSidebar() {
  const pathname = usePathname()
  const params = useParams<{ projectId?: string }>()
  const projectId = (params?.projectId as string) ?? "project-001"

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4">
        <Logo />
      </div>
      <div className="p-3">
        <ProjectSwitcher />
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const href = `/projects/${projectId}/${item.href}`
          const isActive = pathname.startsWith(href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <p className="px-1 text-xs leading-relaxed text-muted-foreground">
          RAG Test Studio v1.0
          <br />
          QA workspace nội bộ
        </p>
      </div>
    </aside>
  )
}
