"use client"

import Link from "next/link"
import {
  Plug,
  ListChecks,
  Library,
  FlaskConical,
  CheckCircle2,
  Circle,
  ArrowRight,
  AlertTriangle,
  CircleCheckBig,
} from "lucide-react"
import { useAppState } from "@/lib/app-state"
import { AppShell } from "@/components/shell/app-shell"
import { PageHeader } from "@/components/shell/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function OverviewPage() {
  const { project, testCases, auth } = useAppState()

  const activeContexts = project.contexts.filter((c) => c.active).length
  const suite = project.suites.find((s) => s.id === "suite-regression") ?? project.suites[0]
  const suiteCases = testCases.filter((c) => c.suiteId === suite?.id && !c.archived)
  const latestRun = project.runs[0]

  const requirement = project.requirement
  const hasOpenOrSkipped = requirement.clarifications.some((c) => c.status === "open" || c.status === "skipped")

  const steps = [
    { label: "Cấu hình target", done: project.target.status === "configured" },
    { label: "Làm rõ requirement", done: !hasOpenOrSkipped },
    { label: "Thêm context", done: activeContexts > 0 },
    { label: "Sinh testcase", done: suiteCases.length > 0 },
    { label: "Chạy và xem report", done: !!latestRun },
  ]
  const nextStepIndex = steps.findIndex((s) => !s.done)
  const nextStep = nextStepIndex === -1 ? null : steps[nextStepIndex]

  const nextStepHref =
    nextStepIndex === 0
      ? `/projects/${project.id}/target`
      : nextStepIndex === 1
        ? `/projects/${project.id}/requirements`
        : nextStepIndex === 2
          ? `/projects/${project.id}/contexts`
          : nextStepIndex === 3 || nextStepIndex === 4
            ? `/projects/${project.id}/suites/${suite?.id}`
            : `/projects/${project.id}/overview`

  return (
    <AppShell breadcrumb={["overview"]}>
      <PageHeader
        title={project.name}
        description={project.description}
        eyebrow={
          <Badge className="w-fit border-transparent bg-success/10 text-success">
            <CircleCheckBig className="size-3.5" data-icon="inline-start" />
            Đang hoạt động
          </Badge>
        }
        action={
          auth.role === "QA" && (
            <Button render={<Link href={`/projects/${project.id}/target`} />}>
              <Plug data-icon="inline-start" />
              Cấu hình chatbot
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 pb-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={Plug}
          title="Target chatbot"
          state={project.target.status === "configured" ? "Đã cấu hình" : "Chưa cấu hình"}
          stateTone={project.target.status === "configured" ? "success" : "warning"}
          metric={`Phiên bản ${project.target.currentVersion}`}
          href={`/projects/${project.id}/target`}
        />
        <SummaryCard
          icon={ListChecks}
          title="Requirement"
          state={requirement.quality === "ready" ? "Sẵn sàng" : "Chất lượng thấp"}
          stateTone={requirement.quality === "ready" ? "success" : "warning"}
          metric={`v${requirement.currentVersion} · ${requirement.clarifications.filter((c) => c.status === "answered").length}/${requirement.clarifications.length} câu đã trả lời`}
          href={`/projects/${project.id}/requirements`}
        />
        <SummaryCard
          icon={Library}
          title="Context"
          state={`${activeContexts}/10 active`}
          stateTone="info"
          metric={`${project.contexts.length} context tổng`}
          href={`/projects/${project.id}/contexts`}
        />
        <SummaryCard
          icon={FlaskConical}
          title="Test suite"
          state={`${suiteCases.length}/20 testcase active`}
          stateTone="info"
          metric={suite?.name ?? "Chưa có suite"}
          href={`/projects/${project.id}/suites/${suite?.id ?? ""}`}
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Quy trình kiểm thử</CardTitle>
          <CardDescription>Theo dõi tiến độ chuẩn bị trước khi chạy testcase thật.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            {steps.map((step, idx) => (
              <li
                key={step.label}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-3",
                  step.done ? "border-success/30 bg-success/5" : idx === nextStepIndex ? "border-primary/40 bg-primary/5" : "border-border",
                )}
              >
                <div className="flex items-center gap-2">
                  {step.done ? (
                    <CheckCircle2 className="size-4 text-success" />
                  ) : (
                    <Circle className={cn("size-4", idx === nextStepIndex ? "text-primary" : "text-muted-foreground")} />
                  )}
                  <span className="text-xs font-medium text-muted-foreground">Bước {idx + 1}</span>
                </div>
                <span className="text-sm font-medium text-foreground">{step.label}</span>
              </li>
            ))}
          </ol>
          {nextStep && (
            <div className="mt-4 flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
              <p className="text-sm text-foreground">
                Bước tiếp theo: <span className="font-medium">{nextStep.label}</span>
              </p>
              {auth.role === "QA" && (
                <Button size="sm" render={<Link href={nextStepHref} />}>
                  Đi tới bước này
                  <ArrowRight data-icon="inline-end" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Chất lượng requirement</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Badge
              className={cn(
                "w-fit border-transparent",
                requirement.quality === "ready" ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
              )}
            >
              {requirement.quality === "ready" ? (
                <CheckCircle2 className="size-3.5" data-icon="inline-start" />
              ) : (
                <AlertTriangle className="size-3.5" data-icon="inline-start" />
              )}
              {requirement.quality === "ready" ? "Sẵn sàng" : "Chất lượng thấp"}
            </Badge>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {requirement.quality === "ready"
                ? "Tất cả câu hỏi làm rõ đã được trả lời đầy đủ."
                : "Có câu hỏi làm rõ đang mở hoặc đã bị bỏ qua. Vẫn có thể sinh testcase nhưng chất lượng có thể thấp hơn."}
            </p>
            <Button variant="outline" size="sm" className="w-fit" render={<Link href={`/projects/${project.id}/requirements`} />}>
              Xem requirement
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {project.activity.slice(0, 4).map((item) => (
                <li key={item.id} className="flex flex-col gap-0.5 border-b border-border pb-2 last:border-0 last:pb-0">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {new Date(item.timestamp).toLocaleString("vi-VN")}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Suite gần đây</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{suite?.name}</span>
              <Badge variant="secondary">{suiteCases.length} active</Badge>
            </div>
            {latestRun && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Kết quả gần nhất:</span>
                <Badge
                  className={cn(
                    "border-transparent",
                    latestRun.outcome === "passed" && "bg-success/10 text-success",
                    latestRun.outcome === "failed" && "bg-destructive/10 text-destructive",
                    latestRun.outcome === "error" && "bg-warning/10 text-warning",
                  )}
                >
                  {latestRun.outcome === "passed" ? "Passed" : latestRun.outcome === "failed" ? "Failed" : "Error"}
                </Badge>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              render={<Link href={`/projects/${project.id}/reports/case-run-001`} />}
            >
              Xem report
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function SummaryCard({
  icon: Icon,
  title,
  state,
  stateTone,
  metric,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  state: string
  stateTone: "success" | "warning" | "info"
  metric: string
  href: string
}) {
  return (
    <Link href={href} className="block">
      <Card className="h-full transition-colors hover:border-primary/40">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="flex size-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Icon className="size-4" />
            </span>
            <Badge
              className={cn(
                "border-transparent",
                stateTone === "success" && "bg-success/10 text-success",
                stateTone === "warning" && "bg-warning/10 text-warning",
                stateTone === "info" && "bg-info/10 text-info",
              )}
            >
              {state}
            </Badge>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">{title}</span>
            <span className="text-xs text-muted-foreground">{metric}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
