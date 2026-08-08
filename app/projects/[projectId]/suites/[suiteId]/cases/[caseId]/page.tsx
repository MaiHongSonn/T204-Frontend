"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Plus, Trash2, Save, Archive, ArrowLeft } from "lucide-react"
import { useAppState } from "@/lib/app-state"
import { AppShell } from "@/components/shell/app-shell"
import { PageHeader } from "@/components/shell/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Field, FieldLabel, FieldDescription, FieldGroup, FieldSet, FieldLegend } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { CATEGORY_LABELS, SOURCE_LABELS, METRIC_LABELS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { MetricConfig, TestCase, TestCaseCategory } from "@/lib/types"

const categories: TestCaseCategory[] = ["happy_path", "edge_case", "safety", "hallucination"]
const metricTypes: MetricConfig["type"][] = [
  "faithfulness",
  "answer_relevancy",
  "g_eval",
  "safety_toxicity",
  "json_correctness",
  "exact_regex_match",
]

function emptyCase(suiteId: string): TestCase {
  return {
    id: `case-${Date.now()}`,
    suiteId,
    title: "",
    scenario: "",
    category: "happy_path",
    source: "manual",
    requirementQuality: "ready",
    contextVersionIds: [],
    revision: 1,
    requestPayload: `{
  "question": "",
  "session_id": "sess-manual"
}`,
    expectedBehavior: "",
    rubric: "",
    requiredKeywords: [],
    forbiddenKeywords: [],
    requiredRegexes: [],
    forbiddenRegexes: [],
    maxLatencyMs: 1000,
    metrics: [{ id: `m-${Date.now()}`, type: "faithfulness", threshold: 0.8 }],
    archived: false,
  }
}

export default function TestCaseEditorPage() {
  const params = useParams<{ projectId: string; suiteId: string; caseId: string }>()
  const router = useRouter()
  const { testCases, auth, saveTestCase, archiveTestCase } = useAppState()
  const readOnly = auth.role !== "QA"
  const isNew = params.caseId === "new"

  const existing = isNew ? null : testCases.find((c) => c.id === params.caseId)
  const [form, setForm] = React.useState<TestCase>(existing ?? emptyCase(params.suiteId))
  const [archiveOpen, setArchiveOpen] = React.useState(false)

  if (!isNew && !existing) {
    return (
      <AppShell breadcrumb={["suites", "cases"]}>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Không tìm thấy testcase</EmptyTitle>
            <EmptyDescription>Testcase này có thể đã bị archive hoặc không tồn tại.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </AppShell>
    )
  }

  function update<K extends keyof TestCase>(key: K, value: TestCase[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateListField(key: "requiredKeywords" | "forbiddenKeywords" | "requiredRegexes" | "forbiddenRegexes", raw: string) {
    update(
      key,
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    )
  }

  function addMetric() {
    update("metrics", [...form.metrics, { id: `m-${Date.now()}`, type: "faithfulness", threshold: 0.8 }])
  }

  function updateMetric(id: string, patch: Partial<MetricConfig>) {
    update(
      "metrics",
      form.metrics.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    )
  }

  function removeMetric(id: string) {
    update("metrics", form.metrics.filter((m) => m.id !== id))
  }

  function handleSave() {
    saveTestCase(form)
    toast.success(isNew ? "Testcase đã được tạo" : "Testcase đã được lưu (revision mới)")
    router.push(`/projects/${params.projectId}/suites/${params.suiteId}`)
  }

  return (
    <AppShell breadcrumb={["suites", "cases", isNew ? "Testcase mới" : form.title || "Sửa testcase"]}>
      <PageHeader
        title={isNew ? "Tạo testcase mới" : "Sửa testcase"}
        description="Định nghĩa kịch bản, luật kiểm tra và metric đánh giá cho testcase này."
        eyebrow={
          !isNew && (
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary">{SOURCE_LABELS[form.source]}</Badge>
              <Badge variant="secondary">Revision {form.revision}</Badge>
            </div>
          )
        }
        action={
          <Button variant="outline" onClick={() => router.push(`/projects/${params.projectId}/suites/${params.suiteId}`)}>
            <ArrowLeft data-icon="inline-start" />
            Quay lại
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="title">Tiêu đề</FieldLabel>
                  <Input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} disabled={readOnly} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="scenario">Kịch bản</FieldLabel>
                  <Textarea
                    id="scenario"
                    value={form.scenario}
                    onChange={(e) => update("scenario", e.target.value)}
                    rows={2}
                    disabled={readOnly}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="category">Danh mục</FieldLabel>
                  <Select value={form.category} onValueChange={(v) => update("category", v as TestCaseCategory)} disabled={readOnly}>
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {CATEGORY_LABELS[c]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="payload">Request payload (JSON)</FieldLabel>
                  <Textarea
                    id="payload"
                    value={form.requestPayload}
                    onChange={(e) => update("requestPayload", e.target.value)}
                    rows={6}
                    className="font-mono text-sm"
                    disabled={readOnly}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kỳ vọng & đánh giá</CardTitle>
              <CardDescription>Mô tả hành vi mong đợi và tiêu chí chấm điểm định tính.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="expected">Hành vi mong đợi</FieldLabel>
                  <Textarea
                    id="expected"
                    value={form.expectedBehavior}
                    onChange={(e) => update("expectedBehavior", e.target.value)}
                    rows={3}
                    disabled={readOnly}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="rubric">Rubric chấm điểm</FieldLabel>
                  <Textarea
                    id="rubric"
                    value={form.rubric}
                    onChange={(e) => update("rubric", e.target.value)}
                    rows={3}
                    disabled={readOnly}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Luật kiểm tra (rule-based)</CardTitle>
              <CardDescription>Các từ khoá và regex, ngăn cách bởi dấu phẩy.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="req-kw">Từ khoá bắt buộc</FieldLabel>
                  <Input
                    id="req-kw"
                    defaultValue={form.requiredKeywords.join(", ")}
                    onBlur={(e) => updateListField("requiredKeywords", e.target.value)}
                    disabled={readOnly}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="forb-kw">Từ khoá cấm</FieldLabel>
                  <Input
                    id="forb-kw"
                    defaultValue={form.forbiddenKeywords.join(", ")}
                    onBlur={(e) => updateListField("forbiddenKeywords", e.target.value)}
                    disabled={readOnly}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="req-re">Regex bắt buộc</FieldLabel>
                  <Input
                    id="req-re"
                    className="font-mono"
                    defaultValue={form.requiredRegexes.join(", ")}
                    onBlur={(e) => updateListField("requiredRegexes", e.target.value)}
                    disabled={readOnly}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="forb-re">Regex cấm</FieldLabel>
                  <Input
                    id="forb-re"
                    className="font-mono"
                    defaultValue={form.forbiddenRegexes.join(", ")}
                    onBlur={(e) => updateListField("forbiddenRegexes", e.target.value)}
                    disabled={readOnly}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="latency">Độ trễ tối đa (ms)</FieldLabel>
                  <Input
                    id="latency"
                    type="number"
                    value={form.maxLatencyMs}
                    onChange={(e) => update("maxLatencyMs", Number(e.target.value))}
                    className="w-32"
                    disabled={readOnly}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Metric đánh giá (LLM-as-judge)</CardTitle>
                  <CardDescription>Đặt threshold = 0 để đưa metric về dạng chỉ tham khảo.</CardDescription>
                </div>
                {!readOnly && (
                  <Button variant="outline" size="sm" onClick={addMetric}>
                    <Plus data-icon="inline-start" className="size-3.5" />
                    Thêm metric
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {form.metrics.map((m) => (
                <FieldSet key={m.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <FieldLegend className="text-xs">Metric</FieldLegend>
                    {!readOnly && form.metrics.length > 1 && (
                      <Button variant="ghost" size="icon-sm" onClick={() => removeMetric(m.id)} aria-label="Xoá metric">
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel className="text-xs">Loại metric</FieldLabel>
                      <Select value={m.type} onValueChange={(v) => updateMetric(m.id, { type: v as MetricConfig["type"] })} disabled={readOnly}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {metricTypes.map((t) => (
                              <SelectItem key={t} value={t}>
                                {METRIC_LABELS[t]}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs">
                        Threshold {m.threshold === 0 && <span className="text-muted-foreground">(tham khảo)</span>}
                      </FieldLabel>
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step={0.05}
                        value={m.threshold}
                        onChange={(e) => updateMetric(m.id, { threshold: Number(e.target.value) })}
                        disabled={readOnly}
                      />
                    </Field>
                  </div>
                </FieldSet>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trạng thái</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Badge
                className={cn(
                  "w-fit border-transparent",
                  form.requirementQuality === "ready" ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
                )}
              >
                Requirement: {form.requirementQuality === "ready" ? "Sẵn sàng" : "Chất lượng thấp"}
              </Badge>
              {form.lastRunOutcome && (
                <p className="text-sm text-muted-foreground">
                  Kết quả gần nhất: <span className="font-medium text-foreground">{form.lastRunOutcome}</span>
                </p>
              )}
            </CardContent>
          </Card>

          {!readOnly && (
            <div className="flex flex-col gap-2">
              <Button onClick={handleSave} disabled={!form.title.trim()}>
                <Save data-icon="inline-start" />
                {isNew ? "Tạo testcase" : "Lưu thay đổi"}
              </Button>
              {!isNew && (
                <Button variant="outline" onClick={() => setArchiveOpen(true)}>
                  <Archive data-icon="inline-start" />
                  Archive testcase
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive testcase này?</AlertDialogTitle>
            <AlertDialogDescription>
              Testcase sẽ không còn xuất hiện trong danh sách active và không được chạy trong các run tiếp theo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                archiveTestCase(form.id)
                toast.success("Testcase đã được archive")
                router.push(`/projects/${params.projectId}/suites/${params.suiteId}`)
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
