"use client"

import { Eye } from "lucide-react"
import { useAppState } from "@/lib/app-state"
import { AppSidebar } from "@/components/shell/sidebar"
import { Topbar } from "@/components/shell/topbar"
import { AuthGuard } from "@/components/shell/auth-guard"

export function AppShell({ breadcrumb, children }: { breadcrumb: string[]; children: React.ReactNode }) {
  const { auth } = useAppState()

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <Topbar breadcrumb={breadcrumb} />
        <main className="pl-64 pt-16">
          {auth.role === "DEV" && (
            <div className="flex items-center gap-2 border-b border-warning/30 bg-warning/10 px-8 py-2 text-sm">
              <Eye className="size-4 text-warning" />
              <span className="font-medium text-foreground">Chế độ chỉ xem</span>
              <span className="text-muted-foreground">
                — Bạn đang xem với vai trò Developer. Mọi hành động tạo, chỉnh sửa, chạy đều bị ẩn hoặc khoá.
              </span>
            </div>
          )}
          <div className="mx-auto w-full max-w-[1440px] px-8 py-6">{children}</div>
        </main>
      </div>
    </AuthGuard>
  )
}
