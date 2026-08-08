"use client"

import * as React from "react"
import Link from "next/link"
import { FlaskConical, Plus, Pencil, Archive } from "lucide-react"
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
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { toast } from "sonner"
import type { TestSuite } from "@/lib/types"

export default function SuitesPage() {
  const { project, testCases, auth, createSuite, editSuite, archiveSuite } = useAppState()
  const readOnly = auth.role !== "QA"
  const activeSuites = project.suites.filter((s) => s.active)
  const archivedSuites = project.suites.filter((s) => !s.active)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingSuite, setEditingSuite] = React.useState<TestSuite | null>(null)
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [archiveTarget, setArchiveTarget] = React.useState<TestSuite | null>(null)

  function openCreate() {
    setEditingSuite(null)
    setName("")
    setDescription("")
    setDialogOpen(true)
  }

  function openEdit(suite: TestSuite) {
    setEditingSuite(suite)
    setName(suite.name)
    setDescription(suite.description)
    setDialogOpen(true)
  }

  function handleSubmit() {
    if (!name.trim()) return
    if (editingSuite) {
      editSuite(editingSuite.id, name, description)
      toast.success("Suite đã được cập nhật")
    } else {
      createSuite(name, description)
      toast.success("Suite mới đã được tạo")
    }
    setDialogOpen(false)
  }

  function caseCounts(suiteId: string) {
    const cases = testCases.filter((c) => c.suiteId === suiteId && !c.archived)
    return {
      total: cases.length,
      happy: cases.filter((c) => c.category === "happy_path").length,
      edge: cases.filter((c) => c.category === "edge_case").length,
      safety: cases.filter((c) => c.category === "safety").length,
      hallucination: cases.filter((c) => c.category === "hallucination").length,
    }
  }

  return (
    <AppShell breadcrumb={["suites"]}>
      <PageHeader
        title="Test suite"
        description="Nhóm các testcase theo mục tiêu kiểm thử, ví dụ regression, safety hoặc theo tính năng."
        action={
          !readOnly && (
            <Button onClick={openCreate}>
              <Plus data-icon="inline-start" />
              Tạo suite
            </Button>
          )
        }
      />

      {activeSuites.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FlaskConical />
            </EmptyMedia>
            <EmptyTitle>Chưa có suite nào</EmptyTitle>
            <EmptyDescription>Tạo suite đầu tiên để bắt đầu tổ chức testcase.</EmptyDescription>
          </EmptyHeader>
          {!readOnly && (
            <EmptyContent>
              <Button onClick={openCreate}>
                <Plus data-icon="inline-start" />
                Tạo suite
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeSuites.map((suite) => {
            const counts = caseCounts(suite.id)
            return (
              <Card key={suite.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-3">
                  <Link href={`/projects/${project.id}/suites/${suite.id}`} className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-foreground hover:underline">{suite.name}</span>
                    <span className="line-clamp-2 text-sm text-muted-foreground">{suite.description}</span>
                  </Link>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="text-xs">
                      {counts.total} testcase
                    </Badge>
                    {counts.safety > 0 && (
                      <Badge className="border-transparent bg-destructive/10 text-xs text-destructive">
                        {counts.safety} safety
                      </Badge>
                    )}
                    {counts.hallucination > 0 && (
                      <Badge className="border-transparent bg-warning/10 text-xs text-warning">
                        {counts.hallucination} hallucination
                      </Badge>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">
                      Cập nhật {new Date(suite.updatedAt).toLocaleDateString("vi-VN")}
                    </span>
                    {!readOnly && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(suite)} aria-label="Sửa suite">
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setArchiveTarget(suite)}
                          aria-label="Archive suite"
                        >
                          <Archive className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {archivedSuites.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Đã archive ({archivedSuites.length})</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {archivedSuites.map((suite) => (
              <Card key={suite.id} className="opacity-60">
                <CardContent className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-foreground">{suite.name}</span>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{suite.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSuite ? "Sửa suite" : "Tạo suite mới"}</DialogTitle>
            <DialogDescription>Đặt tên và mô tả mục tiêu kiểm thử cho suite này.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="suite-name">Tên suite</FieldLabel>
              <Input id="suite-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Regression suite" />
            </Field>
            <Field>
              <FieldLabel htmlFor="suite-desc">Mô tả</FieldLabel>
              <Textarea
                id="suite-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Mục tiêu và phạm vi kiểm thử của suite..."
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim()}>
              {editingSuite ? "Lưu thay đổi" : "Tạo suite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive suite này?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{archiveTarget?.name}&quot; sẽ được ẩn khỏi danh sách chính nhưng vẫn giữ lịch sử run.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (archiveTarget) {
                  archiveSuite(archiveTarget.id)
                  toast.success("Suite đã được archive")
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
