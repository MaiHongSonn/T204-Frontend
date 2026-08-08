"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  Plus,
  Sparkles,
  Play,
  Archive,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Circle,
  History,
} from "lucide-react"
import { useAppState } from "@/lib/app-state"
import { AppShell } from "@/components/shell/app-shell"
import { PageHeader } from "@/components/shell/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { RunConfirmDialog } from "@/components/runs/run-confirm-dialog"
import { CATEGORY_LABELS, SOURCE_LABELS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { TestCase } from "@/lib/types"

const categoryTone: Record<TestCase["category"], string> = {
  happy_path: "bg-success/10 text-success",
  edge_case: "bg-info/10 text-info",
  safety: "bg-destructive/10 text-destructive",
  hallucination: "bg-warning/10 text-warning",
}

const outcomeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  passed: CheckCircle2,
  failed: XCircle,
  error: AlertTriangle,
}

export default function SuiteDetailPage() {
  const params = useParams<{ projectId: string; suiteId: string }>()
  const router = useRouter()
  const { project, testCases, auth, archiveTestCase, startSuiteRun, startCaseRun } = useAppState()
  const readOnly = auth.role !== "QA"

  const [runDialog, setRunDialog] = React.useState<
    { mode: "suite" } | { mode: "case"; caseId: string; caseTitle: string } | null
  >(null)

  const suite = project.suites.find((s) => s.id === params.suiteId)
  const suiteCases = testCases.filter((c) => c.suiteId === params.suiteId && !c.archived)
  const suiteRuns = project.runs.filter((r) => r.suiteId === params.suiteId)

  if (!suite) {
    return (
      <AppShell breadcrumb={["suites"]}>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Không tìm thấy suite</EmptyTitle>
            <EmptyDescription>Suite này có thể đã bị archive hoặc không tồn tại.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </AppShell>
    )
  }

  function handleConfirmRun() {
    if (!runDialog) return
    if (runDialog.mode === "suite") {
      startSuiteRun(suite!.id)
      toast.success("Run suite đã được xếp hàng")
    } else {
      startCaseRun(suite!.id, runDialog.caseId)
      toast.success("Run testcase đã được xếp hàng")
    }
    router.push(`/projects/${params.projectId}/runs/latest`)
  }

  return (
    <AppShell breadcrumb={["suites", suite.name]}>
      <PageHeader
        title={suite.name}
        description={suite.description}
        eyebrow={<Badge variant="secondary">{suiteCases.length}/20 testcase active</Badge>}
        action={
          !readOnly && (
            <div className="flex items-center gap-2">
              <Button variant="outline" render={<Link href={`/projects/${params.projectId}/suites/${suite.id}/generate`} />}>
                <Sparkles data-icon="inline-start" />
                Sinh testcase
              </Button>
              <Button onClick={() => setRunDialog({ mode: "suite" })} disabled={suiteCases.length === 0}>
                <Play data-icon="inline-start" />
                Chạy suite
              </Button>
            </div>
          )
        }
      />

      <Tabs defaultValue="cases">
        <TabsList>
          <TabsTrigger value="cases">Test case</TabsTrigger>
          <TabsTrigger value="runs">Lịch sử run</TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="mt-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{suiteCases.length} testcase active trong suite này.</p>
            {!readOnly && (
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/projects/${params.projectId}/suites/${suite.id}/cases/new`} />}
              >
                <Plus data-icon="inline-start" />
                Tạo testcase thủ công
              </Button>
            )}
          </div>

          {suiteCases.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Sparkles />
                </EmptyMedia>
                <EmptyTitle>Chưa có testcase</EmptyTitle>
                <EmptyDescription>Sinh testcase tự động từ context hoặc tạo thủ công.</EmptyDescription>
              </EmptyHeader>
              {!readOnly && (
                <EmptyContent>
                  <Button render={<Link href={`/projects/${params.projectId}/suites/${suite.id}/generate`} />}>
                    <Sparkles data-icon="inline-start" />
                    Sinh testcase
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Nguồn</TableHead>
                    <TableHead>Chất lượng req.</TableHead>
                    <TableHead>Kết quả gần nhất</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suiteCases.map((tc) => {
                    const OutcomeIcon = tc.lastRunOutcome ? outcomeIcon[tc.lastRunOutcome] : Circle
                    return (
                      <TableRow
                        key={tc.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/projects/${params.projectId}/suites/${suite.id}/cases/${tc.id}`)}
                      >
                        <TableCell className="max-w-[280px]">
                          <span className="line-clamp-1 font-medium text-foreground">{tc.title}</span>
                          <span className="line-clamp-1 text-xs text-muted-foreground">{tc.scenario}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("border-transparent", categoryTone[tc.category])}>
                            {CATEGORY_LABELS[tc.category]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{SOURCE_LABELS[tc.source]}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "border-transparent",
                              tc.requirementQuality === "ready" ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
                            )}
                          >
                            {tc.requirementQuality === "ready" ? "Sẵn sàng" : "Thấp"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tc.lastRunOutcome ? (
                            <span
                              className={cn(
                                "flex items-center gap-1.5 text-sm",
                                tc.lastRunOutcome === "passed" && "text-success",
                                tc.lastRunOutcome === "failed" && "text-destructive",
                                tc.lastRunOutcome === "error" && "text-warning",
                              )}
                            >
                              <OutcomeIcon className="size-3.5" />
                              {tc.lastRunOutcome === "passed" ? "Passed" : tc.lastRunOutcome === "failed" ? "Failed" : "Error"}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Chưa chạy</span>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {!readOnly && (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="ghost" size="icon-sm" aria-label="Thao tác khác">
                                    <MoreHorizontal className="size-3.5" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end">
                                <DropdownMenuGroup>
                                  <DropdownMenuItem
                                    onClick={() => setRunDialog({ mode: "case", caseId: tc.id, caseTitle: tc.title })}
                                  >
                                    <Play data-icon="inline-start" className="size-3.5" />
                                    Chạy testcase
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/projects/${params.projectId}/suites/${suite.id}/cases/${tc.id}`)}
                                  >
                                    Sửa testcase
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => {
                                      archiveTestCase(tc.id)
                                      toast.success("Testcase đã được archive")
                                    }}
                                  >
                                    <Archive data-icon="inline-start" className="size-3.5" />
                                    Archive
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="runs" className="mt-4">
          {suiteRuns.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <History />
                </EmptyMedia>
                <EmptyTitle>Chưa có run nào</EmptyTitle>
                <EmptyDescription>Chạy suite để xem lịch sử kết quả tại đây.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {suiteRuns.map((run) => {
                const passed = run.cases.filter((c) => c.state === "passed").length
                return (
                  <Link
                    key={run.id}
                    href={`/projects/${params.projectId}/reports/${run.id}`}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">
                        Run {new Date(run.createdAt).toLocaleString("vi-VN")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Target v{run.targetConfigVersion} · Requirement v{run.requirementVersion} ·{" "}
                        {passed}/{run.cases.length} passed
                      </span>
                    </div>
                    <Badge
                      className={cn(
                        "border-transparent",
                        run.outcome === "passed" && "bg-success/10 text-success",
                        run.outcome === "failed" && "bg-destructive/10 text-destructive",
                        run.outcome === "error" && "bg-warning/10 text-warning",
                      )}
                    >
                      {run.outcome === "passed" ? "Passed" : run.outcome === "failed" ? "Failed" : "Error"}
                    </Badge>
                  </Link>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <RunConfirmDialog
        open={!!runDialog}
        onOpenChange={(open) => !open && setRunDialog(null)}
        mode={runDialog?.mode ?? "suite"}
        name={runDialog?.mode === "case" ? runDialog.caseTitle : suite.name}
        activeCaseCount={runDialog?.mode === "case" ? 1 : suiteCases.length}
        targetConfigVersion={project.target.currentVersion}
        onConfirm={handleConfirmRun}
      />
    </AppShell>
  )
}
