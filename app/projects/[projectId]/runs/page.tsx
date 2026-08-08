"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { CheckCircle2, XCircle, AlertTriangle, Loader2, History, Eye, ChevronRight } from "lucide-react"
import { useAppState } from "@/lib/app-state"
import { AppShell } from "@/components/shell/app-shell"
import { PageHeader } from "@/components/shell/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import type { SuiteRun } from "@/lib/types"

function statusBadge(run: SuiteRun) {
  if (run.status !== "completed") {
    const label =
      run.status === "queued" ? "Đang xếp hàng" : run.status === "dispatching" ? "Đang dispatch" : "Đang chạy"
    return (
      <Badge className="w-fit gap-1.5 border-transparent bg-info/10 text-info">
        <Loader2 className="size-3 animate-spin" />
        {label}
      </Badge>
    )
  }
  const outcome = run.outcome
  return (
    <Badge
      className={cn(
        "w-fit gap-1.5 border-transparent",
        outcome === "passed" && "bg-success/10 text-success",
        outcome === "failed" && "bg-destructive/10 text-destructive",
        outcome === "error" && "bg-warning/10 text-warning",
      )}
    >
      {outcome === "passed" && <CheckCircle2 className="size-3" />}
      {outcome === "failed" && <XCircle className="size-3" />}
      {outcome === "error" && <AlertTriangle className="size-3" />}
      {outcome === "passed" ? "Passed" : outcome === "failed" ? "Failed" : "Error"}
    </Badge>
  )
}

export default function ProjectRunsPage() {
  const params = useParams<{ projectId: string }>()
  const { project, activeRun, auth } = useAppState()
  const readOnly = auth.role !== "QA"

  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 400)
    return () => window.clearTimeout(t)
  }, [])

  const includeActive = activeRun && !project.runs.some((r) => r.id === activeRun.id)
  const allRuns: SuiteRun[] = includeActive ? [activeRun!, ...project.runs] : project.runs
  const sortedRuns = [...allRuns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <AppShell breadcrumb={["runs"]}>
      <PageHeader
        title="Lịch sử chạy"
        description="Toàn bộ các lượt chạy suite và testcase của project này, từ đang thực thi đến đã hoàn tất."
        eyebrow={
          readOnly && (
            <Badge variant="secondary" className="w-fit gap-1.5">
              <Eye className="size-3" />
              Chỉ xem
            </Badge>
          )
        }
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 py-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="ml-auto h-6 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedRuns.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <History />
            </EmptyMedia>
            <EmptyTitle>Chưa có lượt chạy nào</EmptyTitle>
            <EmptyDescription>
              Chạy một suite hoặc testcase để xem lịch sử thực thi và report tại đây.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Suite</TableHead>
                <TableHead>Run</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Kết quả</TableHead>
                <TableHead>Passed / Failed / Error</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Requirement</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRuns.map((run) => {
                const suite = project.suites.find((s) => s.id === run.suiteId)
                const passed = run.cases.filter((c) => c.state === "passed").length
                const failed = run.cases.filter((c) => c.state === "failed").length
                const errored = run.cases.filter((c) => c.state === "error").length
                const isLive = run.id === activeRun?.id && run.status !== "completed"
                const href = isLive
                  ? `/projects/${params.projectId}/runs/latest`
                  : `/projects/${params.projectId}/reports/${run.id}`

                return (
                  <TableRow key={run.id} className="cursor-pointer" render={<Link href={href} />}>
                    <TableCell className="max-w-[220px]">
                      <span className="line-clamp-1 font-medium text-foreground">{suite?.name ?? "—"}</span>
                      {run.cases.length === 1 && (
                        <span className="text-xs text-muted-foreground">Run 1 testcase</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">{run.id}</span>
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {new Date(run.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </TableCell>
                    <TableCell>{statusBadge(run)}</TableCell>
                    <TableCell>
                      {run.status === "completed" ? (
                        <span className="text-sm text-muted-foreground">
                          {run.completedAt ? new Date(run.completedAt).toLocaleTimeString("vi-VN") : "—"}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Chưa hoàn tất</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm tabular-nums">
                      <span className="text-success">{passed}</span>
                      {" / "}
                      <span className="text-destructive">{failed}</span>
                      {" / "}
                      <span className="text-warning">{errored}</span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">v{run.targetConfigVersion}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm text-muted-foreground">v{run.requirementVersion}</span>
                        <Badge
                          className={cn(
                            "border-transparent text-[11px]",
                            run.requirementQuality === "ready" ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
                          )}
                        >
                          {run.requirementQuality === "ready" ? "Sẵn sàng" : "Thấp"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </AppShell>
  )
}
