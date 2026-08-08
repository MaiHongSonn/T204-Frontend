"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, Loader2, Eye, EyeOff, KeyRound } from "lucide-react"
import { useAppState } from "@/lib/app-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const DEMO_ACCOUNTS = [
  {
    role: "QA" as const,
    title: "QA Engineer",
    username: "qa.nguyenminhanh",
    description: "Có thể tạo, chỉnh sửa và chạy testcase.",
  },
  {
    role: "DEV" as const,
    title: "Developer",
    username: "dev.tranquocbao",
    description: "Chỉ xem dữ liệu project, không thể chỉnh sửa.",
  },
]

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAppState()
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [keepSession, setKeepSession] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedRole, setSelectedRole] = React.useState<"QA" | "DEV">("QA")

  function quickFill(role: "QA" | "DEV") {
    const account = DEMO_ACCOUNTS.find((a) => a.role === role)!
    setUsername(account.username)
    setPassword("••••••••")
    setSelectedRole(role)
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.")
      return
    }
    setError(null)
    setLoading(true)
    window.setTimeout(() => {
      login(selectedRole, selectedRole === "QA" ? "Nguyễn Minh Anh" : "Trần Quốc Bảo")
      setLoading(false)
      router.push("/projects")
    }, 900)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="items-center gap-3 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="size-5.5" strokeWidth={2.25} />
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold tracking-tight text-foreground">RAG Test Studio</span>
              <CardTitle className="text-xl font-semibold">Đăng nhập vào workspace QA</CardTitle>
              <CardDescription>Đăng nhập để tạo, đánh giá và theo dõi các testcase cho chatbot RAG.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <FieldGroup>
                <Field data-invalid={!!error}>
                  <FieldLabel htmlFor="username">Tên đăng nhập</FieldLabel>
                  <Input
                    id="username"
                    autoComplete="username"
                    placeholder="vd: qa.nguyenminhanh"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    aria-invalid={!!error}
                  />
                </Field>
                <Field data-invalid={!!error}>
                  <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={!!error}
                      className="pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {error && <FieldDescription className="text-destructive">{error}</FieldDescription>}
                </Field>
                <div className="flex items-center gap-2">
                  <Checkbox id="keep-session" checked={keepSession} onCheckedChange={(v) => setKeepSession(!!v)} />
                  <label htmlFor="keep-session" className="text-sm leading-none text-muted-foreground">
                    Phiên đăng nhập có hiệu lực 24 giờ
                  </label>
                </div>
              </FieldGroup>

              <Button type="submit" size="lg" disabled={loading} className="w-full">
                {loading && <Loader2 className="size-4 animate-spin" data-icon="inline-start" />}
                Đăng nhập
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <KeyRound className="size-3.5" />
                Thông tin xác thực chỉ dùng cho phiên hiện tại.
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <p className="px-1 text-xs font-medium text-muted-foreground">Tài khoản demo — bấm để điền nhanh</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.role}
                type="button"
                onClick={() => quickFill(account.role)}
                className={cn(
                  "flex flex-col gap-1 rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selectedRole === account.role && username === account.username
                    ? "border-primary/50 bg-accent/40"
                    : "border-border",
                )}
              >
                <span className="text-sm font-medium text-foreground">{account.title}</span>
                <span className="text-xs leading-snug text-muted-foreground">{account.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
