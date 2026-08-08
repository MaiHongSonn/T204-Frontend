"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronRight, LogOut, UserCog } from "lucide-react"
import { useAppState } from "@/lib/app-state"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const CRUMB_LABELS: Record<string, string> = {
  overview: "Tổng quan",
  target: "Cấu hình chatbot",
  requirements: "Requirement",
  contexts: "Context",
  suites: "Test suites",
  runs: "Lịch sử chạy",
  reports: "Report",
}

export function Topbar({ breadcrumb }: { breadcrumb: string[] }) {
  const { auth, setRole, logout, project } = useAppState()
  const router = useRouter()
  const params = useParams<{ projectId?: string }>()
  const projectId = (params?.projectId as string) ?? "project-001"

  function initials(name: string) {
    return name
      .split(" ")
      .map((p) => p[0])
      .slice(-2)
      .join("")
      .toUpperCase()
  }

  return (
    <header className="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 pl-64 pr-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 pl-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href={`/projects/${projectId}/overview`} className="font-medium text-foreground hover:underline">
            {project.name}
          </Link>
          {breadcrumb.map((crumb) => (
            <span key={crumb} className="flex items-center gap-1.5">
              <ChevronRight className="size-3.5" />
              <span className={crumb === breadcrumb[breadcrumb.length - 1] ? "text-foreground" : ""}>
                {CRUMB_LABELS[crumb] ?? crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/60" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          Đã kết nối
        </div>
        <Badge variant={auth.role === "QA" ? "default" : "secondary"} className="font-mono text-[11px] tracking-wide">
          {auth.role === "QA" ? "QA" : "DEV"}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-8">
              <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                {initials(auth.userName)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{auth.userName}</span>
              <span className="text-xs font-normal text-muted-foreground">Tài khoản demo</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
              <UserCog className="size-3.5" />
              Chuyển vai trò xem thử
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={auth.role} onValueChange={(v) => setRole(v as "QA" | "DEV")}>
              <DropdownMenuRadioItem value="QA">QA Engineer</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="DEV">Developer (chỉ xem)</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout()
                router.replace("/login")
              }}
              className="text-destructive"
            >
              <LogOut className="size-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
