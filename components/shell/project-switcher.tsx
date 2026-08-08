"use client"

import { ChevronsUpDown, Check, FolderKanban, Layers } from "lucide-react"
import Link from "next/link"
import { useAppState } from "@/lib/app-state"
import { projectListSeed } from "@/lib/mock-data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ProjectSwitcher() {
  const { project } = useAppState()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-secondary/60 px-3 py-2 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <FolderKanban className="size-4" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-foreground">{project.name}</span>
          <span className="truncate text-xs text-muted-foreground">Dự án hiện tại</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Chuyển dự án</DropdownMenuLabel>
        <DropdownMenuGroup>
          {projectListSeed.map((p) => (
            <DropdownMenuItem key={p.id} disabled={p.id !== project.id} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{p.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {p.id === project.id ? "Đang mở" : "Xem trong danh sách dự án"}
                </span>
              </span>
              {p.id === project.id && <Check className="size-4 shrink-0 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/projects" />} className="flex items-center gap-2">
          <Layers className="size-4" />
          Xem tất cả dự án
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
