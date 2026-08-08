"use client"

import * as React from "react"
import Link from "next/link"
import {
  Plug,
  History,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  Clock,
} from "lucide-react"
import { useAppState } from "@/lib/app-state"
import { AppShell } from "@/components/shell/app-shell"
import { PageHeader } from "@/components/shell/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type ConnectionState = "idle" | "testing" | "success" | "error"

export default function TargetConfigPage() {
  const { project, auth, saveTargetConfig } = useAppState()
  const readOnly = auth.role !== "QA"
  const target = project.target

  const [endpoint, setEndpoint] = React.useState(target.endpoint)
  const [answerJsonPath, setAnswerJsonPath] = React.useState(target.answerJsonPath)
  const [requestSchema, setRequestSchema] = React.useState(target.requestSchema)
  const [responseSchema, setResponseSchema] = React.useState(target.responseSchema)
  const [connectionState, setConnectionState] = React.useState<ConnectionState>("idle")
  const [connectionDetail, setConnectionDetail] = React.useState<{
    httpStatus?: number
    latencyMs?: number
    extractedAnswer?: string
    errorMessage?: string
  } | null>(null)
  const [historyOpen, setHistoryOpen] = React.useState(false)

  const isDirty =
    endpoint !== target.endpoint ||
    answerJsonPath !== target.answerJsonPath ||
    requestSchema !== target.requestSchema ||
    responseSchema !== target.responseSchema

  function handleTestConnection() {
    setConnectionState("testing")
    setConnectionDetail(null)
    window.setTimeout(() => {
      const succeeds = endpoint.trim().length > 0 && Math.random() > 0.2
      if (succeeds) {
        setConnectionState("success")
        setConnectionDetail({
          httpStatus: 200,
          latencyMs: 340 + Math.floor(Math.random() * 200),
          extractedAnswer: "Bạn có thể đổi trả sản phẩm trong vòng 30 ngày kể từ ngày mua hàng.",
        })
        toast.success("Kết nối thành công tới target chatbot")
      } else {
        setConnectionState("error")
        setConnectionDetail({
          httpStatus: 404,
          errorMessage: "Không thể trích xuất câu trả lời theo Answer JSONPath đã cấu hình.",
        })
        toast.error("Kết nối thất bại")
      }
    }, 1400)
  }

  function handleSave() {
    saveTargetConfig({ endpoint, answerJsonPath, requestSchema, responseSchema })
    toast.success("Đã lưu cấu hình target (phiên bản mới)")
  }

  return (
    <AppShell breadcrumb={["target"]}>
      <PageHeader
        title="Cấu hình target chatbot"
        description="Khai báo endpoint, schema request/response để hệ thống có thể gọi và trích xuất câu trả lời từ chatbot của bạn."
        eyebrow={
          <Badge
            className={cn(
              "w-fit border-transparent",
              target.status === "configured" ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
            )}
          >
            {target.status === "configured" ? "Đã cấu hình" : "Chưa cấu hình"}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin kết nối</CardTitle>
              <CardDescription>Phiên bản hiện tại: v{target.currentVersion}</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="endpoint">Endpoint (POST)</FieldLabel>
                  <Input
                    id="endpoint"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="https://api.example.com/v1/chat"
                    disabled={readOnly}
                  />
                  <FieldDescription>Hệ thống sẽ gửi request POST đến endpoint này khi chạy testcase.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="jsonpath">Answer JSONPath</FieldLabel>
                  <Input
                    id="jsonpath"
                    value={answerJsonPath}
                    onChange={(e) => setAnswerJsonPath(e.target.value)}
                    placeholder="$.data.answer"
                    className="font-mono"
                    disabled={readOnly}
                  />
                  <FieldDescription>Đường dẫn JSONPath để trích xuất câu trả lời từ response.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="req-schema">Request schema (JSON mẫu)</FieldLabel>
                  <Textarea
                    id="req-schema"
                    value={requestSchema}
                    onChange={(e) => setRequestSchema(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                    disabled={readOnly}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="res-schema">Response schema (JSON mẫu)</FieldLabel>
                  <Textarea
                    id="res-schema"
                    value={responseSchema}
                    onChange={(e) => setResponseSchema(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                    disabled={readOnly}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {!readOnly && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {isDirty ? "Có thay đổi chưa lưu." : "Chưa có thay đổi nào."}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleTestConnection} disabled={connectionState === "testing"}>
                  {connectionState === "testing" ? (
                    <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                  ) : (
                    <PlayCircle data-icon="inline-start" />
                  )}
                  Test connection
                </Button>
                <Button onClick={handleSave} disabled={!isDirty}>
                  Lưu cấu hình
                </Button>
              </div>
            </div>
          )}

          {connectionState !== "idle" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kết quả test connection</CardTitle>
              </CardHeader>
              <CardContent>
                {connectionState === "testing" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Đang gửi request kiểm tra tới target...
                  </div>
                )}
                {connectionState === "success" && connectionDetail && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="size-4" />
                      <span className="text-sm font-medium">Kết nối thành công</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                      <Stat label="HTTP status" value={String(connectionDetail.httpStatus)} />
                      <Stat label="Độ trễ" value={`${connectionDetail.latencyMs} ms`} />
                    </div>
                    <div className="rounded-md bg-secondary/50 p-3">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Câu trả lời trích xuất</p>
                      <p className="text-sm text-foreground">{connectionDetail.extractedAnswer}</p>
                    </div>
                  </div>
                )}
                {connectionState === "error" && connectionDetail && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="size-4" />
                      <span className="text-sm font-medium">Kết nối thất bại</span>
                    </div>
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {connectionDetail.errorMessage}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lịch sử phiên bản</CardTitle>
              <CardDescription>Mọi thay đổi cấu hình đều được ghi phiên bản.</CardDescription>
            </CardHeader>
            <CardContent>
              <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
                <ul className="flex flex-col gap-3">
                  {target.history.slice(0, historyOpen ? undefined : 3).map((h) => (
                    <li key={h.version} className="flex flex-col gap-1 border-b border-border pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Phiên bản {h.version}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {new Date(h.updatedAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Thay đổi: {h.changedFields.join(", ")}</p>
                    </li>
                  ))}
                </ul>
                {target.history.length > 3 && (
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="mt-3 w-full">
                      <History data-icon="inline-start" className="size-3.5" />
                      {historyOpen ? "Thu gọn" : `Xem tất cả ${target.history.length} phiên bản`}
                      <ChevronDown
                        data-icon="inline-end"
                        className={cn("size-3.5 transition-transform", historyOpen && "rotate-180")}
                      />
                    </Button>
                  </CollapsibleTrigger>
                )}
                <CollapsibleContent />
              </Collapsible>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ghi chú</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Việc thay đổi cấu hình target sẽ tạo phiên bản mới. Các run trước đó vẫn giữ nguyên tham chiếu tới
                phiên bản cấu hình lúc chạy, giúp bạn xác định chính xác nguyên nhân khi kết quả kiểm thử thay đổi.
              </p>
            </CardContent>
          </Card>

          {readOnly && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
              <Plug className="size-4" />
              Bạn đang ở vai trò DEV (chỉ xem). Chuyển sang QA để chỉnh sửa cấu hình.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border border-border p-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-sm tabular-nums text-foreground">{value}</span>
    </div>
  )
}
