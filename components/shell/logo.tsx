import { ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ShieldCheck className="size-4.5" strokeWidth={2.25} />
      </span>
      {showText && <span className="text-[15px] font-semibold tracking-tight text-foreground">RAG Test Studio</span>}
    </div>
  )
}
