"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Plug,
  ListChecks,
  Clock,
} from "lucide-react"
import { useAppState } from "@/lib/app-state"
import { AppShell } from "@/components/shell/app-shell"
import { PageHeader } from "@/components/shell/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { CATEGORY_LABELS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export default function SuiteReportPage() {
  const params = useParams<{ projectId: string; runId: string }>()
  const router = useRouter()
  const { project } = useAppState()

  const run = project.runs.find((r) => r.id === params.runId)
  const suite = run ? project.suites.find((s) => s.id === run.suiteId) : undefined

  if (!run) {
    return (
      <AppShell breadcrumb={["reports"]}>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Không tìm thấy report</EmptyTitle>
            <EmptyDescription>Run này có thể chưa hoàn tất hoặc không tồn tại.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </AppShell>
    )
  }

  const passed = run.cases.filter((c) => c.state === "passed").length
  const failed = run.cases.filter((c) => c.state === "failed").length
  const errored = run.cases.filter((c) => c.state === "error").length
  const total = run.cases.length
  const passRate = total ? Math.round((passed / total) * 100) : 0

  const byCategory = (["happy_path", "edge_case", "safety", "hallucination"] as const).map((cat) => {
    const items = run.cases.filter((c) => c.category === cat)
    return {
      category: cat,
      total: items.length,
      passed: items.filter((c) => c.state === "passed").length,
    }
  })

  return (
    <AppShell breadcrumb={["reports", suite?.name ?? "report"]}>
      <PageHeader
        title={`Report: ${suite?.name ?? ""}`}
        description={`Run hoàn tất lúc ${run.completedAt ? new Date(run.completedAt).toLocaleString("vi-VN") : "—"}`}
        eyebrow={
          <Badge
            className={cn(
              "w-fit border-transparent",
              run.outcome === "passed" && "bg-success/10 text-success",
              run.outcome === "failed" && "bg-destructive/10 text-destructive",
              run.outcome === "error" && "bg-warning/10 text-warning",
            )}
          >
            {run.outcome === "passed" ? "Passed" : run.outcome === "failed" ? "Failed" : "Error"}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-4 pb-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tỉ lệ pass" value={`${passRate}%`} icon={CheckCircle2} tone="success" />
        <StatCard label="Passed" value={String(passed)} icon={CheckCircle2} tone="success" />
        <StatCard label="Failed" value={String(failed)} icon={XCircle} tone="destructive" />
        <StatCard label="Error" value={String(errored)} icon={AlertTriangle} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kết quả theo test case</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden rounded-b-lg border-t border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test case</TableHead>
                      <TableHead>Danh mục</TableHead>
                      <TableHead>Kết quả</TableHead>
                      <TableHead>Điểm</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {run.cases.map((c) => (
                      <TableRow
                        key={c.caseId}
                        className="cursor-pointer"
                        render={<Link href={`/projects/${params.projectId}/reports/${run.id}/cases/${c.caseId}`} />}
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
                          <span
                            className={cn(
                              "flex items-center gap-1.5 text-sm",
                              c.state === "passed" && "text-success",
                              c.state === "failed" && "text-destructive",
                              c.state === "error" && "text-warning",
                            )}
                          >
                            {c.state === "passed" && <CheckCircle2 className="size-3.5" />}
                            {c.state === "failed" && <XCircle className="size-3.5" />}
                            {c.state === "error" && <AlertTriangle className="size-3.5" />}
                            {c.state === "passed" ? "Passed" : c.state === "failed" ? "Failed" : c.state === "error" ? "Error" : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm tabular-nums text-muted-foreground">
                          {c.score !== undefined ? c.score.toFixed(2) : "—"}
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Theo danh mục</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {byCategory.map((c) => (
                <div key={c.category} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{CATEGORY_LABELS[c.category]}</span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {c.passed}/{c.total}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${c.total ? (c.passed / c.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plug className="size-4" />
                Ngữ cảnh khi chạy
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Target config</span>
                <span className="font-medium text-foreground">v{run.targetConfigVersion}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Requirement</span>
                <span className="font-medium text-foreground">v{run.requirementVersion}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Chất lượng requirement</span>
                <Badge
                  className={cn(
                    "border-transparent text-xs",
                    run.requirementQuality === "ready" ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
                  )}
                >
                  {run.requirementQuality === "ready" ? "Sẵn sàng" : "Thấp"}
                </Badge>
              </div>
            </CardContent>
          </Card>

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
      </div>
    </AppShell>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  tone: "success" | "destructive" | "warning"
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-md",
            tone === "success" && "bg-success/10 text-success",
            tone === "destructive" && "bg-destructive/10 text-destructive",
            tone === "warning" && "bg-warning/10 text-warning",
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="flex flex-col">
          <span className="font-mono text-lg font-semibold tabular-nums text-foreground">{value}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </CardContent>
    </Card>
  )
}
