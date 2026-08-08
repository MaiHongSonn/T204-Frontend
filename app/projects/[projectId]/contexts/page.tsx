"use client"

import * as React from "react"
import { Library, Plus, Pencil, Archive, FileText, History } from "lucide-react"
import { useAppState } from "@/lib/app-state"
import { AppShell } from "@/components/shell/app-shell"
import { PageHeader } from "@/components/shell/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Field, FieldLabel, FieldDescription, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { toast } from "sonner"
import type { ReferenceContext } from "@/lib/types"

const MAX_ACTIVE_CONTEXTS = 10

export default function ContextsPage() {
  const { project, auth, addContext, editContext, archiveContext } = useAppState()
  const readOnly = auth.role !== "QA"
  const activeContexts = project.contexts.filter((c) => c.active)
  const archivedContexts = project.contexts.filter((c) => !c.active)
  const atLimit = activeContexts.length >= MAX_ACTIVE_CONTEXTS

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingContext, setEditingContext] = React.useState<ReferenceContext | null>(null)
  const [name, setName] = React.useState("")
  const [content, setContent] = React.useState("")
  const [archiveTarget, setArchiveTarget] = React.useState<ReferenceContext | null>(null)

  function openCreate() {
    setEditingContext(null)
    setName("")
    setContent("")
    setDialogOpen(true)
  }

  function openEdit(ctx: ReferenceContext) {
    setEditingContext(ctx)
    setName(ctx.name)
    setContent(ctx.content)
    setDialogOpen(true)
  }

  function handleSubmit() {
    if (!name.trim() || !content.trim()) return
    if (editingContext) {
      editContext(editingContext.id, name, content)
      toast.success("Context đã được cập nhật (phiên bản mới)")
    } else {
      addContext(name, content)
      toast.success("Context mới đã được thêm")
    }
    setDialogOpen(false)
  }

  return (
    <AppShell breadcrumb={["contexts"]}>
      <PageHeader
        title="Reference context"
        description="Quản lý nội dung tham chiếu (chính sách, FAQ, tài liệu) dùng để sinh testcase và đánh giá độ chính xác câu trả lời."
        eyebrow={
          <Badge variant="secondary" className="w-fit">
            {activeContexts.length}/{MAX_ACTIVE_CONTEXTS} active
          </Badge>
        }
        action={
          !readOnly && (
            <Button onClick={openCreate} disabled={atLimit}>
              <Plus data-icon="inline-start" />
              Thêm context
            </Button>
          )
        }
      />

      {atLimit && !readOnly && (
        <p className="mb-4 text-sm text-warning">
          Đã đạt giới hạn {MAX_ACTIVE_CONTEXTS} context active. Hãy archive một context để thêm mới.
        </p>
      )}

      {activeContexts.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Library />
            </EmptyMedia>
            <EmptyTitle>Chưa có context nào</EmptyTitle>
            <EmptyDescription>Thêm context để cung cấp kiến thức nền cho việc sinh và đánh giá testcase.</EmptyDescription>
          </EmptyHeader>
          {!readOnly && (
            <EmptyContent>
              <Button onClick={openCreate}>
                <Plus data-icon="inline-start" />
                Thêm context đầu tiên
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeContexts.map((ctx) => (
            <Card key={ctx.id}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{ctx.name}</span>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    v{ctx.currentVersion}
                  </Badge>
                </div>
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{ctx.content}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <History className="size-3" />
                    {ctx.charCount.toLocaleString("vi-VN")} ký tự
                  </span>
                  <span>{new Date(ctx.updatedAt).toLocaleDateString("vi-VN")}</span>
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-2 border-t border-border pt-3">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(ctx)}>
                      <Pencil data-icon="inline-start" className="size-3.5" />
                      Sửa
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setArchiveTarget(ctx)}>
                      <Archive data-icon="inline-start" className="size-3.5" />
                      Archive
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {archivedContexts.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Đã archive ({archivedContexts.length})</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {archivedContexts.map((ctx) => (
              <Card key={ctx.id} className="opacity-60">
                <CardContent className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-foreground">{ctx.name}</span>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{ctx.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingContext ? "Sửa context" : "Thêm context mới"}</DialogTitle>
            <DialogDescription>
              {editingContext
                ? "Lưu sẽ tạo một phiên bản mới cho context này."
                : "Nội dung này sẽ được dùng làm nguồn tham chiếu khi sinh và đánh giá testcase."}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="ctx-name">Tên context</FieldLabel>
              <Input id="ctx-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Chính sách đổi trả" />
            </Field>
            <Field>
              <FieldLabel htmlFor="ctx-content">Nội dung</FieldLabel>
              <Textarea
                id="ctx-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="Dán nội dung chính sách, FAQ hoặc tài liệu tham chiếu..."
              />
              <FieldDescription>{content.length.toLocaleString("vi-VN")} ký tự</FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || !content.trim()}>
              {editingContext ? "Lưu thay đổi" : "Thêm context"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive context này?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{archiveTarget?.name}&quot; sẽ không còn được dùng cho các lần sinh testcase mới, nhưng vẫn giữ trong
              lịch sử.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (archiveTarget) {
                  archiveContext(archiveTarget.id)
                  toast.success("Context đã được archive")
                }
                setArchiveTarget(null)
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}
