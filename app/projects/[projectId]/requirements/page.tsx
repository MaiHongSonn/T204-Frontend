"use client"

import * as React from "react"
import {
  ListChecks,
  CheckCircle2,
  AlertTriangle,
  MessageCircleQuestion,
  ShieldAlert,
  Lock,
  Sparkles,
  Gauge,
  History,
  SkipForward,
  Send,
} from "lucide-react"
import { useAppState } from "@/lib/app-state"
import { AppShell } from "@/components/shell/app-shell"
import { PageHeader } from "@/components/shell/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { ClarificationQuestion } from "@/lib/types"

const categoryIcon: Record<ClarificationQuestion["category"], React.ComponentType<{ className?: string }>> = {
  Safety: ShieldAlert,
  Security: Lock,
  "Hành vi": Sparkles,
  "Hiệu năng": Gauge,
}

export default function RequirementsPage() {
  const { project, auth, saveRequirement, answerClarification, skipClarification } = useAppState()
  const readOnly = auth.role !== "QA"
  const requirement = project.requirement

  const [draft, setDraft] = React.useState(requirement.text)
  const isDirty = draft !== requirement.text

  const openQuestions = requirement.clarifications.filter((q) => q.status === "open")
  const answeredQuestions = requirement.clarifications.filter((q) => q.status !== "open")

  function handleSave() {
    saveRequirement(draft)
    toast.success("Requirement đã được lưu (phiên bản mới)")
  }

  return (
    <AppShell breadcrumb={["requirements"]}>
      <PageHeader
        title="Requirement & làm rõ"
        description="Mô tả nghiệp vụ chatbot cần đáp ứng. Hệ thống sẽ đề xuất câu hỏi làm rõ để tăng chất lượng testcase sinh tự động."
        eyebrow={
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
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mô tả requirement</CardTitle>
              <CardDescription>Phiên bản hiện tại: v{requirement.currentVersion}</CardDescription>
            </CardHeader>
            <CardContent>
              <Field>
                <FieldLabel htmlFor="req-text">Nội dung</FieldLabel>
                <Textarea
                  id="req-text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={10}
                  disabled={readOnly}
                  className="leading-relaxed"
                />
                <FieldDescription>Mô tả càng chi tiết, chatbot càng dễ được kiểm thử chính xác.</FieldDescription>
              </Field>
              {!readOnly && (
                <div className="mt-4 flex items-center justify-end gap-2">
                  <p className="mr-auto text-sm text-muted-foreground">
                    {isDirty ? "Có thay đổi chưa lưu." : "Chưa có thay đổi nào."}
                  </p>
                  <Button onClick={handleSave} disabled={!isDirty}>
                    Lưu requirement
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircleQuestion className="size-4" />
                Câu hỏi làm rõ đang mở
              </CardTitle>
              <CardDescription>
                Trả lời các câu hỏi này giúp requirement đạt trạng thái &quot;Sẵn sàng&quot;.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {openQuestions.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CheckCircle2 />
                    </EmptyMedia>
                    <EmptyTitle>Không còn câu hỏi mở</EmptyTitle>
                    <EmptyDescription>Tất cả câu hỏi làm rõ đã được xử lý.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="flex flex-col gap-4">
                  {openQuestions.map((q) => (
                    <ClarificationCard key={q.id} question={q} readOnly={readOnly} onAnswer={answerClarification} onSkip={skipClarification} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {answeredQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="size-4" />
                  Đã xử lý
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-3">
                  {answeredQuestions.map((q) => {
                    const Icon = categoryIcon[q.category]
                    return (
                      <li key={q.id} className="flex flex-col gap-1 border-b border-border pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <Icon className="size-3.5 text-muted-foreground" />
                          <Badge variant="secondary" className="text-xs">
                            {q.category}
                          </Badge>
                          <Badge
                            className={cn(
                              "border-transparent text-xs",
                              q.status === "answered" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                            )}
                          >
                            {q.status === "answered" ? "Đã trả lời" : "Đã bỏ qua"}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground">{q.question}</p>
                        {q.answer && <p className="text-sm text-muted-foreground">→ {q.answer}</p>}
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tiến độ làm rõ</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Đã xử lý</span>
                <span className="font-mono tabular-nums text-foreground">
                  {answeredQuestions.length}/{requirement.clarifications.length}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${requirement.clarifications.length ? (answeredQuestions.length / requirement.clarifications.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Requirement vẫn có thể được dùng để sinh testcase khi ở trạng thái &quot;Chất lượng thấp&quot;, nhưng
                các testcase liên quan sẽ được đánh dấu tương ứng để bạn dễ theo dõi độ tin cậy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lịch sử phiên bản</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {requirement.history.slice(0, 4).map((h) => (
                  <li key={h.version} className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0 last:pb-0">
                    <span className="font-medium text-foreground">Phiên bản {h.version}</span>
                    <span className="text-xs text-muted-foreground">{new Date(h.updatedAt).toLocaleDateString("vi-VN")}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

function ClarificationCard({
  question,
  readOnly,
  onAnswer,
  onSkip,
}: {
  question: ClarificationQuestion
  readOnly: boolean
  onAnswer: (id: string, answer: string) => void
  onSkip: (id: string) => void
}) {
  const [answer, setAnswer] = React.useState("")
  const Icon = categoryIcon[question.category]

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="size-3.5 text-muted-foreground" />
          <Badge variant="secondary" className="text-xs">
            {question.category}
          </Badge>
        </div>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          Câu {question.sequence}/{question.total}
        </span>
      </div>
      <p className="text-sm font-medium text-foreground">{question.question}</p>
      {!readOnly && (
        <>
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Nhập câu trả lời của bạn..."
            rows={2}
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSkip(question.id)
                toast("Đã bỏ qua câu hỏi này")
              }}
            >
              <SkipForward data-icon="inline-start" className="size-3.5" />
              Bỏ qua
            </Button>
            <Button
              size="sm"
              disabled={!answer.trim()}
              onClick={() => {
                onAnswer(question.id, answer)
                toast.success("Đã lưu câu trả lời")
              }}
            >
              <Send data-icon="inline-start" className="size-3.5" />
              Trả lời
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
