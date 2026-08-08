import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
  className,
}: {
  title: string
  description: string
  action?: React.ReactNode
  eyebrow?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-4 pb-6 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow}
        <h1 className="text-2xl font-semibold tracking-tight text-balance text-foreground">{title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}
