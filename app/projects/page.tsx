"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  MoreHorizontal,
  FolderKanban,
  ArrowRight,
  Archive,
  Pencil,
} from "lucide-react"
import { useAppState } from "@/lib/app-state"
import { projectListSeed, CURRENT_PROJECT_ID } from "@/lib/mock-data"
import { AuthGuard } from "@/components/shell/auth-guard"
import { Logo } from "@/components/shell/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { toast } from "sonner"

type FilterValue = "all" | "active" | "archived"

export default function ProjectsPage() {
  const { auth } = useAppState()
  const router = useRouter()
  const [projects, setProjects] = React.useState(projectListSeed)
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<FilterValue>("all")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [archiveTarget, setArchiveTarget] = React.useState<string | null>(null)
  const [newName, setNewName] = React.useState("")
  const [newDescription, setNewDescription] = React.useState("")

  const filtered = projects.filter((p) => {
    if (filter === "active" && p.status !== "active") return false
    if (filter === "archived" && p.status !== "archived") return false
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  function handleCreate() {
    if (!newName.trim()) return
    const id = `project-${Date.now()}`
    setProjects((prev) => [
      {
        id,
        name: newName.trim(),
        description: newDescription.trim() || "Chưa có mô tả.",
        status: "active",
        targetConfigured: false,
        requirementQuality: "low",
        updatedAt: new Date().toISOString(),
      },
      ...prev,
    ])
    setCreateOpen(false)
    setNewName("")
    setNewDescription("")
    toast.success("Đã tạo project mới.")
  }

  function handleArchive() {
    if (!archiveTarget) return
    setProjects((prev) => prev.map((p) => (p.id === archiveTarget ? { ...p, status: "archived" } : p)))
    setArchiveTarget(null)
    toast.success("Đã archive project.")
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <header className="flex h-16 items-center justify-between border-b border-border px-8">
          <Logo />
          <div className="flex items-center gap-3">
            <Badge variant={auth.role === "QA" ? "default" : "secondary"} className="font-mono text-[11px]">
              {auth.role === "QA" ? "QA" : "DEV"}
            </Badge>
            <Avatar className="size-8">
              <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                {auth.userName
                  .split(" ")
                  .slice(-2)
                  .map((p) => p[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1440px] px-8 py-8">
          <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dự án kiểm thử</h1>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                Quản lý các dự án QA cho chatbot RAG. Mỗi dự án có target riêng, requirement riêng và test suite riêng.
              </p>
            </div>
            {auth.role === "QA" && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus data-icon="inline-start" />
                Tạo project
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm project theo tên..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-1 rounded-md border border-border bg-secondary/40 p-0.5">
              {(
                [
                  { value: "all", label: "Tất cả" },
                  { value: "active", label: "Đang hoạt động" },
                  { value: "archived", label: "Đã archive" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={
                    filter === opt.value
                      ? "rounded-[6px] bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"
                      : "rounded-[6px] px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <Empty className="border border-dashed border-border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderKanban />
                </EmptyMedia>
                <EmptyTitle>Chưa có project phù hợp</EmptyTitle>
                <EmptyDescription>Tạo project mới để bắt đầu cấu hình chatbot và sinh testcase.</EmptyDescription>
              </EmptyHeader>
              {auth.role === "QA" && (
                <EmptyContent>
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus data-icon="inline-start" />
                    Tạo project
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên project</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Target config</TableHead>
                    <TableHead>Requirement quality</TableHead>
                    <TableHead>Cập nhật lúc</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const isCurrent = p.id === CURRENT_PROJECT_ID
                    return (
                      <TableRow
                        key={p.id}
                        className={isCurrent ? "bg-accent/30 hover:bg-accent/40" : undefined}
                        onClick={() => {
                          if (isCurrent) router.push(`/projects/${p.id}/overview`)
                          else toast.info("Dữ liệu chi tiết chỉ khả dụng cho project demo Chatbot Chính sách Đổi trả.")
                        }}
                      >
                        <TableCell className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{p.name}</span>
                            {isCurrent && (
                              <Badge variant="outline" className="border-primary/30 text-primary">
                                Đang mở
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs cursor-pointer truncate text-muted-foreground">
                          {p.description}
                        </TableCell>
                        <TableCell className="cursor-pointer">
                          <Badge variant={p.targetConfigured ? "secondary" : "outline"}>
                            {p.targetConfigured ? "Đã cấu hình" : "Chưa cấu hình"}
                          </Badge>
                        </TableCell>
                        <TableCell className="cursor-pointer">
                          <Badge
                            className={
                              p.requirementQuality === "ready"
                                ? "border-transparent bg-success/10 text-success"
                                : "border-transparent bg-warning/10 text-warning"
                            }
                          >
                            {p.requirementQuality === "ready" ? "Sẵn sàng" : "Chất lượng thấp"}
                          </Badge>
                        </TableCell>
                        <TableCell className="cursor-pointer font-mono text-xs tabular-nums text-muted-foreground">
                          {new Date(p.updatedAt).toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={<Button variant="ghost" size="icon-sm" />}
                            >
                              <MoreHorizontal />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  isCurrent
                                    ? router.push(`/projects/${p.id}/overview`)
                                    : toast.info("Chỉ project demo có đầy đủ dữ liệu chi tiết.")
                                }
                              >
                                <ArrowRight className="size-4" />
                                Mở project
                              </DropdownMenuItem>
                              {auth.role === "QA" && (
                                <>
                                  <DropdownMenuItem onClick={() => toast.info("Chỉnh sửa thông tin project (demo).")}>
                                    <Pencil className="size-4" />
                                    Sửa thông tin
                                  </DropdownMenuItem>
                                  {p.status === "active" && (
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() => setArchiveTarget(p.id)}
                                    >
                                      <Archive className="size-4" />
                                      Archive
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo project mới</DialogTitle>
            <DialogDescription>Đặt tên và mô tả ngắn cho project kiểm thử chatbot mới.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="project-name">Tên dự án</FieldLabel>
              <Input
                id="project-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="vd: Chatbot Chăm sóc khách hàng"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="project-desc">Mô tả (không bắt buộc)</FieldLabel>
              <Input
                id="project-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Mô tả ngắn về mục tiêu kiểm thử"
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>
              Tạo project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive project này?</AlertDialogTitle>
            <AlertDialogDescription>
              Project sẽ được chuyển sang trạng thái đã archive. Dữ liệu report và lịch sử chạy vẫn được giữ nguyên.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthGuard>
  )
}
