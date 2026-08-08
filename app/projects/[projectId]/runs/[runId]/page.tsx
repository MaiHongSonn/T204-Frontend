"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Circle,
  Clock,
  FileText,
} from "lucide-react"
import { useAppState } from "@/lib/app-state"
import { AppShell } from "@/components/shell/app-shell"
import { PageHeader } from "@/components/shell/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CATEGORY_LABELS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import type { CaseRunState, SuiteRun } from "@/lib/types"

const stateMeta: Record<CaseRunState, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  queued: { label: "Đang chờ", icon: Circle, tone: "text-muted-foreground" },
  executing: { label: "Đang gọi target", icon: Loader2, tone: "text-info" },
  evaluating: { label: "Đang chấm điểm", icon: Loader2, tone: "text-info" },
  passed: { label: "Passed", icon: CheckCircle2, tone: "text-success" },
  failed: { label: "Failed", icon: XCircle, tone: "text-destructive" },
  error: { label: "Error", icon: AlertTriangle, tone: "text-warning" },
}

export default function RunProgressPage() {
  const params = useParams<{ projectId: string; runId: string }>()
  const router = useRouter()
  const { project, activeRun } = useAppState()

  const isLive = params.runId === "latest" || activeRun?.id === params.runId
  const run: SuiteRun | undefined = isLive ? activeRun : project.runs.find((r) => r.id === params.runId)

  if (!run) {
    return (
      <AppShell breadcrumb={["runs"]}>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Không tìm thấy run này.</CardContent>
        </Card>
      </AppShell>
    )
  }

  const suite = project.suites.find((s) => s.id === run.suiteId)
  const doneCount = run.cases.filter((c) => c.state !== "queued" && c.state !== "executing" && c.state !== "evaluating").length
  const progress = run.cases.length ? Math.round((doneCount / run.cases.length) * 100) : 0
  const isCompleted = run.status === "completed"

  React.useEffect(() => {
    if (isCompleted && isLive) {
      // keep user on page; they can navigate to report manually
    }
  }, [isCompleted, isLive])

  return (
    <AppShell breadcrumb={["suites", suite?.name ?? "run"]}>
      <PageHeader
        title={`Run suite: ${suite?.name ?? ""}`}
        description={`Bắt đầu lúc ${new Date(run.createdAt).toLocaleString("vi-VN")}`}
        eyebrow={
          <Badge
            className={cn(
              "w-fit border-transparent",
              run.status === "completed"
                ? run.outcome === "passed"
                  ? "bg-success/10 text-success"
                  : run.outcome === "failed"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-warning/10 text-warning"
                : "bg-info/10 text-info",
            )}
          >
            {run.status === "queued" && "Đang xếp hàng"}
            {run.status === "dispatching" && "Đang dispatch"}
            {run.status === "running" && "Đang chạy"}
            {run.status === "completed" &&
              (run.outcome === "passed" ? "Hoàn tất · Passed" : run.outcome === "failed" ? "Hoàn tất · Failed" : "Hoàn tất · Error")}
          </Badge>
        }
        action={
          isCompleted && (
            <Button render={<Link href={`/projects/${params.projectId}/reports/${run.id}`} />}>
              <FileText data-icon="inline-start" />
              Xem report đầy đủ
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tiến độ thực thi</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {doneCount}/{run.cases.length} test case đã xử lý
                </span>
                <span className="font-mono tabular-nums text-foreground">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </CardContent>
          </Card>

          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test case</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Độ trễ</TableHead>
                  <TableHead>Điểm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {run.cases.map((c) => {
                  const meta = stateMeta[c.state]
                  const Icon = meta.icon
                  const spinning = c.state === "executing" || c.state === "evaluating"
                  return (
                    <TableRow
                      key={c.caseId}
                      className={isCompleted ? "cursor-pointer" : ""}
                      onClick={() => isCompleted && router.push(`/projects/${params.projectId}/reports/${run.id}/cases/${c.caseId}`)}
                    >
                      <TableCell className="max-w-[240px]">
                        <span className="line-clamp-1 font-medium text-foreground">{c.caseTitle}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORY_LABELS[c.category]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={cn("flex items-center gap-1.5 text-sm", meta.tone)}>
                          <Icon className={cn("size-3.5", spinning && "animate-spin")} />
                          {meta.label}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm tabular-nums text-muted-foreground">
                        {c.latencyMs ? `${c.latencyMs} ms` : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm tabular-nums text-muted-foreground">
                        {c.score !== undefined ? c.score.toFixed(2) : "—"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-3">
              {run.timeline.map((t, idx) => (
                <li key={idx} className="flex flex-col gap-0.5 border-l-2 border-primary/30 pl-3">
                  <span className="text-sm text-foreground">{t.label}</span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {new Date(t.timestamp).toLocaleTimeString("vi-VN")}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
