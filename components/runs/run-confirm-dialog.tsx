"use client"

import * as React from "react"
import { Eye, EyeOff, Play, ShieldCheck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"

interface RunConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "suite" | "case"
  name: string
  activeCaseCount: number
  targetConfigVersion: number
  onConfirm: () => void
}

export function RunConfirmDialog({
  open,
  onOpenChange,
  mode,
  name,
  activeCaseCount,
  targetConfigVersion,
  onConfirm,
}: RunConfirmDialogProps) {
  const [token, setToken] = React.useState("")
  const [showToken, setShowToken] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setToken("")
      setShowToken(false)
    }
  }, [open])

  function handleRun() {
    if (!token.trim()) return
    onConfirm()
    // Mock submission: token is used only for this run and never persisted.
    setToken("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "suite" ? "Xác nhận chạy suite" : "Xác nhận chạy testcase"}</DialogTitle>
          <DialogDescription>
            Kiểm tra thông tin trước khi thực thi. Kết quả sẽ được lưu vào lịch sử chạy của project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
            <span className="text-muted-foreground">{mode === "suite" ? "Suite" : "Testcase"}</span>
            <span className="max-w-[240px] truncate text-right font-medium text-foreground">{name}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
            <span className="text-muted-foreground">Số testcase sẽ chạy</span>
            <span className="font-mono font-medium text-foreground">{activeCaseCount}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
            <span className="text-muted-foreground">Target config</span>
            <span className="font-mono font-medium text-foreground">v{targetConfigVersion}</span>
          </div>

          <Field>
            <FieldLabel htmlFor="run-token">Target Bearer token</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="run-token"
                type={showToken ? "text" : "password"}
                placeholder="Nhập Bearer token của target"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoComplete="off"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  size="icon-xs"
                  aria-label={showToken ? "Ẩn token" : "Hiện token"}
                  onClick={() => setShowToken((s) => !s)}
                >
                  {showToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <FieldDescription className="flex items-start gap-1.5">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              Token chỉ được dùng để xác thực cho lần chạy này, không được lưu trữ hoặc hiển thị lại sau khi gửi.
            </FieldDescription>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleRun} disabled={!token.trim()}>
            <Play data-icon="inline-start" />
            {mode === "suite" ? "Chạy suite" : "Chạy testcase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
