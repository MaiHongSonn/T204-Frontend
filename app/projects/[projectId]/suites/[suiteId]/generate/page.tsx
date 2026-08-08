"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Sparkles,
  Library,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react"
import { useAppState } from "@/lib/app-state"
import { AppShell } from "@/components/shell/app-shell"
import { PageHeader } from "@/components/shell/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import type { GenerationPlan } from "@/lib/types"

const categoryMeta: { key: keyof GenerationPlan; label: string; description: string; tone: string }[] = [
  { key: "happy_path", label: "Happy path", description: "Câu hỏi tiêu chuẩn, đúng kịch bản mong đợi.", tone: "bg-success/10 text-success" },
  { key: "edge_case", label: "Edge case", description: "Trường hợp biên, thiếu thông tin hoặc bất thường.", tone: "bg-info/10 text-info" },
  { key: "safety", label: "Safety", description: "Kiểm tra hành vi an toàn, chống lạm dụng.", tone: "bg-destructive/10 text-destructive" },
  { key: "hallucination", label: "Hallucination", description: "Kiểm tra chatbot có bịa thông tin ngoài context.", tone: "bg-warning/10 text-warning" },
]

export default function GenerateTestCasesPage() {
  const params = useParams<{ projectId: string; suiteId: string }>()
  const router = useRouter()
  const { project, startGeneration, retryGeneration, activeGeneration } = useAppState()

  const activeContexts = project.contexts.filter((c) => c.active)
  const [selectedContexts, setSelectedContexts] = React.useState<string[]>(activeContexts.map((c) => c.id))
  const [plan, setPlan] = React.useState<GenerationPlan>({ happy_path: 4, edge_case: 3, safety: 2, hallucination: 1 })

  const total = plan.happy_path + plan.edge_case + plan.safety + plan.hallucination
  const isRunning = activeGeneration?.status === "queued" || activeGeneration?.status === "running"
  const isDone = activeGeneration?.status === "completed"
  const isFailed = activeGeneration?.status === "failed"

  function toggleContext(id: string) {
    setSelectedContexts((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  function updatePlan(key: keyof GenerationPlan, value: number) {
    setPlan((prev) => ({ ...prev, [key]: Math.max(0, Math.min(20, value)) }))
  }

  function handleStart() {
    startGeneration(params.suiteId, selectedContexts, plan)
  }

  return (
    <AppShell breadcrumb={["suites", "generate"]}>
      <PageHeader
        title="Sinh testcase tự động"
        description="Chọn context tham chiếu và số lượng testcase mong muốn cho mỗi danh mục."
        action={
          <Button variant="outline" onClick={() => router.push(`/projects/${params.projectId}/suites/${params.suiteId}`)}>
            <ArrowLeft data-icon="inline-start" />
            Quay lại suite
          </Button>
        }
      />

      {!activeGeneration || (activeGeneration.suiteId !== params.suiteId && !isRunning) ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Library className="size-4" />
                Chọn context tham chiếu
              </CardTitle>
              <CardDescription>Testcase sẽ được sinh dựa trên nội dung các context đã chọn.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {activeContexts.length === 0 ? (
                <Alert>
                  <AlertTriangle />
                  <AlertTitle>Chưa có context active</AlertTitle>
                  <AlertDescription>Hãy thêm context trước khi sinh testcase để đảm bảo chất lượng.</AlertDescription>
                </Alert>
              ) : (
                activeContexts.map((ctx) => (
                  <label
                    key={ctx.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-accent/40"
                  >
                    <Checkbox
                      checked={selectedContexts.includes(ctx.id)}
                      onCheckedChange={() => toggleContext(ctx.id)}
                      className="mt-0.5"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{ctx.name}</span>
                      <span className="line-clamp-1 text-xs text-muted-foreground">{ctx.content}</span>
                    </div>
                  </label>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kế hoạch sinh testcase</CardTitle>
              <CardDescription>Tổng: {total} testcase</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {categoryMeta.map((c) => (
                <Field key={c.key}>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor={c.key} className="flex items-center gap-2">
                      <Badge className={cn("border-transparent", c.tone)}>{c.label}</Badge>
                    </FieldLabel>
                    <Input
                      id={c.key}
                      type="number"
                      min={0}
                      max={20}
                      value={plan[c.key]}
                      onChange={(e) => updatePlan(c.key, Number(e.target.value))}
                      className="w-16 text-center"
                    />
                  </div>
                  <FieldDescription>{c.description}</FieldDescription>
                </Field>
              ))}
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-2 lg:col-span-3">
            <Button size="lg" onClick={handleStart} disabled={total === 0 || selectedContexts.length === 0}>
              <Sparkles data-icon="inline-start" />
              Sinh {total} testcase
            </Button>
          </div>
        </div>
      ) : (
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle className="text-base">Đang xử lý yêu cầu sinh testcase</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            {isRunning && (
              <>
                <Loader2 className="size-10 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {activeGeneration.status === "queued" ? "Đang xếp hàng..." : "Đang sinh testcase từ context..."}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Kế hoạch: {activeGeneration.plan.happy_path + activeGeneration.plan.edge_case + activeGeneration.plan.safety + activeGeneration.plan.hallucination} testcase
                  </p>
                </div>
              </>
            )}
            {isDone && (
              <>
                <CheckCircle2 className="size-10 text-success" />
                <div>
                  <p className="text-sm font-medium text-foreground">Sinh testcase hoàn tất</p>
                  <p className="mt-1 text-sm text-muted-foreground">Testcase mới đã được thêm vào suite.</p>
                </div>
                <Button onClick={() => router.push(`/projects/${params.projectId}/suites/${params.suiteId}`)}>
                  Xem test case
                </Button>
              </>
            )}
            {isFailed && (
              <>
                <XCircle className="size-10 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-foreground">Sinh testcase thất bại</p>
                  <p className="mt-1 text-sm text-muted-foreground">{activeGeneration.failureReason}</p>
                </div>
                <Button variant="outline" onClick={() => retryGeneration(params.suiteId)}>
                  <RotateCcw data-icon="inline-start" />
                  Thử lại
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </AppShell>
  )
}
