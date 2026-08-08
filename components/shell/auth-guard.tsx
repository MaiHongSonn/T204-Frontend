"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAppState } from "@/lib/app-state"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { auth } = useAppState()
  const router = useRouter()

  React.useEffect(() => {
    if (!auth.isAuthenticated) {
      router.replace("/login")
    }
  }, [auth.isAuthenticated, router])

  if (!auth.isAuthenticated) {
    return null
  }

  return <>{children}</>
}
