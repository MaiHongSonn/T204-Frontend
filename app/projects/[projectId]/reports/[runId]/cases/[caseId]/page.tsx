"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Circle,
  ArrowLeft,
  Play,
  FileText,
  Layers,
  Info,
} from "lucide-react"
import { useAppState } from "@/lib/app-state"
import { AppShell } from "@/components/shell/app-shell"
import { PageHeader } from "@/components/shell/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { RunConfirmDialog } from "@/components/runs/run-confirm-dialog"
import { CATEGORY_LABELS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { CaseRunState } from "@/lib/types"

const stateMeta: Record<CaseRunState, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  queued: { label: "Đang chờ", icon: Circle, tone: "bg-secondary text-secondary-foreground" },
  executing: { label: "Đang gọi target", icon: Circle, tone: "bg-info/10 text-info" },
  evaluating: { label: "Đang chấm điểm", icon: Circle, tone: "bg-info/10 text-info" },
  passed: { label: "Passed", icon: CheckCircle2, tone: "bg-success/10 text-success" },
  failed: { label: "Failed", icon: XCircle, tone: "bg-destructive/10 text-destructive" },
  error: { label: "Error", icon: AlertTriangle, tone: "bg-warning/10 text-warning" },
}

const ruleStatusMeta: Record<string, { label: string; tone: string }> = {
  passed: { label: "Passed", tone: "bg-success/10 text-success" },
  failed: { label: "Failed", tone: "bg-destructive/10 text-destructive" },
  not_run: { label: "Không chạy", tone: "bg-secondary text-secondary-foreground" },
}

const metricStatusMeta: Record<string, { label: string; tone: string }> = {
  passed: { label: "Passed", tone: "bg-success/10 text-success" },
  failed: { label: "Failed", tone: "bg-destructive/10 text-destructive" },
  not_run: { label: "Không chạy", tone: "bg-secondary text-secondary-foreground" },
  reference: { label: "Tham khảo", tone: "bg-info/10 text-info" },
}

export default function CaseReportDetailPage() {
  const params = useParams<{ projectId: string; runId: string; caseId: string }>()
  const router = useRouter()
  const { project, testCases, activeRun, auth, startCaseRun } = useAppState()
  const readOnly = auth.role !== "QA"
  const [runOpen, setRunOpen] = React.useState(false)

  const isLive = params.runId === "latest" || activeRun?.id === params.runId
  const run = isLive ? activeRun : project.runs.find((r) => r.id === params.runId)
  const suite = run ? project.suites.find((s) => s.id === run.suiteId) : undefined
  const caseResult = run?.cases.find((c) => c.caseId === params.caseId)
  const testCase = testCases.find((c) => c.id === params.caseId)

  if (!run || !caseResult) {
    return (
      <AppShell breadcrumb={["reports"]}>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Không tìm thấy report cho testcase này</EmptyTitle>
            <EmptyDescription>Run hoặc testcase này có thể không tồn tại hoặc chưa có kết quả.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </AppShell>
    )
  }

  const meta = stateMeta[caseResult.state]
  const contextNames = (testCase?.contextVersionIds ?? [])
    .map((id) => project.contexts.find((c) => c.id === id))
    .filter(Boolean)

  function handleConfirmRun() {
    startCaseRun(run!.suiteId, caseResult!.caseId)
    toast.success("Run testcase đã được xếp hàng")
    router.push(`/projects/${params.projectId}/runs/latest`)
  }

  return (
    <AppShell breadcrumb={["reports", suite?.name ?? "report", caseResult.caseTitle]}>
      <PageHeader
        title={caseResult.caseTitle}
        description={`Run ${run.id} · Bắt đầu ${new Date(run.createdAt).toLocaleString("vi-VN")}${
          run.completedAt ? ` · Hoàn tất ${new Date(run.completedAt).toLocaleString("vi-VN")}` : ""
        }`}
        eyebrow={
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-xs">
              {CATEGORY_LABELS[caseResult.category]}
            </Badge>
            <Badge className={cn("w-fit gap-1.5 border-transparent", meta.tone)}>
              <meta.icon className="size-3" />
              {meta.label}
            </Badge>
          </div>
        }
        action={
          <div className="flex items-center gap-2">
            {!readOnly && (
              <Button variant="outline" onClick={() => setRunOpen(true)}>
                <Play data-icon="inline-start" />
                Chạy lại testcase
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.push(`/projects/${params.projectId}/reports/${run.id}`)}
            >
              <ArrowLeft data-icon="inline-start" />
              Quay lại report
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 pb-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="HTTP status" value={caseResult.httpStatus ? String(caseResult.httpStatus) : "—"} />
        <KpiCard label="Độ trễ" value={caseResult.latencyMs ? `${caseResult.latencyMs} ms` : "—"} />
        <KpiCard
          label="Chất lượng requirement"
          value={run.requirementQuality === "ready" ? "Sẵn sàng" : "Thấp"}
          tone={run.requirementQuality === "ready" ? "success" : "warning"}
        />
        <KpiCard label="Revision testcase" value={`r${caseResult.testCaseRevision}`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Câu trả lời được trích xuất</CardTitle>
              <CardDescription>Nội dung câu trả lời thực tế của target, không hiển thị JSON thô.</CardDescription>
            </CardHeader>
            <CardContent>
              {caseResult.extractedAnswer ? (
                <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
                  {caseResult.extractedAnswer}
                </p>
              ) : (
                <p className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                  Không có câu trả lời do lỗi kỹ thuật khi gọi target ({caseResult.httpStatus ?? "—"}).
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kết quả rule-based</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden rounded-b-lg border-t border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Giá trị quan sát</TableHead>
                      <TableHead>Lý do</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {caseResult.ruleResults.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                          Chưa có kết quả rule cho testcase này.
                        </TableCell>
                      </TableRow>
                    ) : (
                      caseResult.ruleResults.map((r, idx) => {
                        const rm = ruleStatusMeta[r.status]
                        return (
                          <TableRow key={idx}>
                            <TableCell className="max-w-[200px]">
                              <span className="line-clamp-2 text-sm text-foreground">{r.rule}</span>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("border-transparent text-xs", rm.tone)}>{rm.label}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">{r.observedValue ?? "—"}</TableCell>
                            <TableCell className="max-w-[260px]">
                              <span className="text-sm text-muted-foreground">{r.reason}</span>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kết quả metric (LLM-as-judge)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden rounded-b-lg border-t border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Điểm</TableHead>
                      <TableHead>Threshold</TableHead>
                      <TableHead>Gating</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Lý do</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {caseResult.metricResults.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                          Chưa có kết quả metric cho testcase này.
                        </TableCell>
                      </TableRow>
                    ) : (
                      caseResult.metricResults.map((m, idx) => {
                        const mm = metricStatusMeta[m.status]
                        return (
                          <TableRow key={idx}>
                            <TableCell className="max-w-[180px]">
                              <span className="line-clamp-2 text-sm text-foreground">{m.metric}</span>
                            </TableCell>
                            <TableCell className="font-mono text-sm tabular-nums text-muted-foreground">
                              {m.score !== undefined ? m.score.toFixed(2) : "—"}
                            </TableCell>
                            <TableCell className="font-mono text-sm tabular-nums text-muted-foreground">
                              {m.threshold === 0 ? "0 (tham khảo)" : m.threshold.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={m.gating ? "default" : "secondary"} className="text-xs">
                                {m.gating ? "Có" : "Không"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("border-transparent text-xs", mm.tone)}>{mm.label}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[220px]">
                              <span className="text-sm text-muted-foreground">{m.reason}</span>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-info/30 bg-info/5">
            <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 size-3.5 shrink-0 text-info" />
                <span>
                  <span className="font-medium text-foreground">Không chạy</span> là trạng thái hợp lệ khi một rule bắt buộc
                  đã fail trước đó — metric liên quan sẽ bị bỏ qua, không tính là lỗi.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 size-3.5 shrink-0 text-info" />
                <span>
                  <span className="font-medium text-foreground">Threshold = 0</span> nghĩa là metric chỉ mang tính{" "}
                  <span className="font-medium text-foreground">tham khảo</span>, không ảnh hưởng đến kết quả pass/fail.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 size-3.5 shrink-0 text-info" />
                <span>
                  <span className="font-medium text-foreground">Failed</span> là một kết quả kiểm thử hợp lệ, khác với{" "}
                  <span className="font-medium text-foreground">Error</span> — vốn là lỗi kỹ thuật khi gọi target hoặc chấm
                  điểm, không phản ánh chất lượng câu trả lời.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="size-4" />
                Snapshot ngữ cảnh khi chạy
              </CardTitle>
              <CardDescription>Không hiển thị token hoặc thông tin xác thực.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Revision testcase</span>
                <span className="font-mono font-medium text-foreground">r{caseResult.testCaseRevision}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Requirement</span>
                <span className="font-mono font-medium text-foreground">v{run.requirementVersion}</span>
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
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Target config</span>
                <span className="font-mono font-medium text-foreground">v{run.targetConfigVersion}</span>
              </div>
              <div className="flex flex-col gap-1.5 border-t border-border pt-2">
                <span className="text-muted-foreground">Context được sử dụng</span>
                {contextNames.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Không có context nào được chọn.</span>
                ) : (
                  contextNames.map((ctx) => (
                    <div key={ctx!.id} className="flex items-center justify-between">
                      <span className="line-clamp-1 text-foreground">{ctx!.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">v{ctx!.currentVersion}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full"
            render={<Link href={`/projects/${params.projectId}/reports/${run.id}`} />}
          >
            <FileText data-icon="inline-start" />
            Xem toàn bộ report suite
          </Button>
        </div>
      </div>

      {!readOnly && (
        <RunConfirmDialog
          open={runOpen}
          onOpenChange={setRunOpen}
          mode="case"
          name={caseResult.caseTitle}
          activeCaseCount={1}
          targetConfigVersion={run.targetConfigVersion}
          onConfirm={handleConfirmRun}
        />
      )}
    </AppShell>
  )
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: "success" | "warning"
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <span
          className={cn(
            "font-mono text-lg font-semibold tabular-nums text-foreground",
            tone === "success" && "text-success",
            tone === "warning" && "text-warning",
          )}
        >
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  )
}
