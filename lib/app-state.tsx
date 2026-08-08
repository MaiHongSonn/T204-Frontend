"use client"

import * as React from "react"
import { initialProject, allTestCases, CURRENT_PROJECT_ID } from "./mock-data"
import type {
  CaseRunResult,
  ClarificationQuestion,
  GenerationOperation,
  GenerationPlan,
  MetricConfig,
  Project,
  ReferenceContext,
  SuiteRun,
  TargetConfig,
  TestCase,
  TestSuite,
  UserRole,
} from "./types"

interface AuthState {
  isAuthenticated: boolean
  userName: string
  role: UserRole
}

interface AppState {
  auth: AuthState
  project: Project
  testCases: TestCase[]
}

interface AppStateContextValue extends AppState {
  login: (role: UserRole, userName: string) => void
  logout: () => void
  setRole: (role: UserRole) => void

  saveTargetConfig: (config: Pick<TargetConfig, "endpoint" | "answerJsonPath" | "requestSchema" | "responseSchema">) => void

  saveRequirement: (text: string) => void
  answerClarification: (id: string, answer: string) => void
  skipClarification: (id: string) => void

  addContext: (name: string, content: string) => void
  editContext: (id: string, name: string, content: string) => void
  archiveContext: (id: string) => void

  createSuite: (name: string, description: string) => TestSuite
  editSuite: (id: string, name: string, description: string) => void
  archiveSuite: (id: string) => void

  startGeneration: (suiteId: string, contextIds: string[], plan: GenerationPlan) => void
  retryGeneration: (suiteId: string) => void
  activeGeneration: GenerationOperation | undefined

  saveTestCase: (testCase: TestCase) => void
  archiveTestCase: (id: string) => void

  activeRun: SuiteRun | undefined
  startSuiteRun: (suiteId: string) => void
  startCaseRun: (suiteId: string, caseId: string) => void
}

const AppStateContext = React.createContext<AppStateContextValue | null>(null)

function nowIso() {
  return new Date().toISOString()
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = React.useState<AuthState>({
    isAuthenticated: false,
    userName: "Nguyễn Minh Anh",
    role: "QA",
  })
  const [project, setProject] = React.useState<Project>(initialProject)
  const [testCases, setTestCases] = React.useState<TestCase[]>(allTestCases)
  const [activeGeneration, setActiveGeneration] = React.useState<GenerationOperation | undefined>(undefined)
  const [activeRun, setActiveRun] = React.useState<SuiteRun | undefined>(project.runs[0])

  const login = React.useCallback((role: UserRole, userName: string) => {
    setAuth({ isAuthenticated: true, role, userName })
  }, [])

  const logout = React.useCallback(() => {
    setAuth((prev) => ({ ...prev, isAuthenticated: false }))
  }, [])

  const setRole = React.useCallback((role: UserRole) => {
    setAuth((prev) => ({ ...prev, role }))
  }, [])

  const pushActivity = React.useCallback((label: string) => {
    setProject((prev) => ({
      ...prev,
      activity: [{ id: `act-${Date.now()}`, label, timestamp: nowIso() }, ...prev.activity].slice(0, 10),
    }))
  }, [])

  const saveTargetConfig = React.useCallback<AppStateContextValue["saveTargetConfig"]>(
    (config) => {
      setProject((prev) => {
        const nextVersion = prev.target.currentVersion + 1
        const changedFields: string[] = []
        if (config.endpoint !== prev.target.endpoint) changedFields.push("Endpoint")
        if (config.answerJsonPath !== prev.target.answerJsonPath) changedFields.push("Answer JSONPath")
        if (config.requestSchema !== prev.target.requestSchema) changedFields.push("Request schema")
        if (config.responseSchema !== prev.target.responseSchema) changedFields.push("Response schema")
        return {
          ...prev,
          target: {
            ...prev.target,
            ...config,
            currentVersion: nextVersion,
            updatedAt: nowIso(),
            status: "configured",
            history: [
              {
                version: nextVersion,
                endpoint: config.endpoint,
                method: "POST",
                answerJsonPath: config.answerJsonPath,
                requestSchema: config.requestSchema,
                responseSchema: config.responseSchema,
                updatedAt: nowIso(),
                changedFields: changedFields.length ? changedFields : ["Không có thay đổi nội dung"],
              },
              ...prev.target.history,
            ],
          },
        }
      })
      pushActivity(`Cấu hình target đã được lưu (phiên bản mới)`)
    },
    [pushActivity],
  )

  const saveRequirement = React.useCallback((text: string) => {
    setProject((prev) => {
      const nextVersion = prev.requirement.currentVersion + 1
      return {
        ...prev,
        requirement: {
          ...prev.requirement,
          text,
          currentVersion: nextVersion,
          updatedAt: nowIso(),
          history: [{ version: nextVersion, text, updatedAt: nowIso() }, ...prev.requirement.history],
        },
      }
    })
    pushActivity(`Requirement được cập nhật lên phiên bản mới`)
  }, [pushActivity])

  function recomputeRequirementQuality(clarifications: ClarificationQuestion[]) {
    const hasOpenOrSkipped = clarifications.some((c) => c.status === "open" || c.status === "skipped")
    return hasOpenOrSkipped ? "low" : "ready"
  }

  const answerClarification = React.useCallback((id: string, answer: string) => {
    setProject((prev) => {
      const clarifications = prev.requirement.clarifications.map((c) =>
        c.id === id ? { ...c, status: "answered" as const, answer, answeredAt: nowIso() } : c,
      )
      return {
        ...prev,
        requirement: {
          ...prev.requirement,
          clarifications,
          quality: recomputeRequirementQuality(clarifications),
        },
      }
    })
    pushActivity("Đã trả lời một câu hỏi làm rõ requirement")
  }, [pushActivity])

  const skipClarification = React.useCallback((id: string) => {
    setProject((prev) => {
      const clarifications = prev.requirement.clarifications.map((c) =>
        c.id === id ? { ...c, status: "skipped" as const, answeredAt: nowIso() } : c,
      )
      return {
        ...prev,
        requirement: {
          ...prev.requirement,
          clarifications,
          quality: recomputeRequirementQuality(clarifications),
        },
      }
    })
    pushActivity("Đã bỏ qua một câu hỏi làm rõ requirement")
  }, [pushActivity])

  const addContext = React.useCallback(
    (name: string, content: string) => {
      setProject((prev) => {
        const id = `ctx-${Date.now()}`
        const newContext: ReferenceContext = {
          id,
          name,
          content,
          currentVersion: 1,
          charCount: content.length,
          updatedAt: nowIso(),
          active: true,
          history: [{ version: 1, content, charCount: content.length, updatedAt: nowIso() }],
        }
        return { ...prev, contexts: [newContext, ...prev.contexts] }
      })
      pushActivity(`Context "${name}" đã được thêm`)
    },
    [pushActivity],
  )

  const editContext = React.useCallback(
    (id: string, name: string, content: string) => {
      setProject((prev) => ({
        ...prev,
        contexts: prev.contexts.map((c) => {
          if (c.id !== id) return c
          const nextVersion = c.currentVersion + 1
          return {
            ...c,
            name,
            content,
            charCount: content.length,
            currentVersion: nextVersion,
            updatedAt: nowIso(),
            history: [{ version: nextVersion, content, charCount: content.length, updatedAt: nowIso() }, ...c.history],
          }
        }),
      }))
      pushActivity(`Context đã được cập nhật phiên bản mới`)
    },
    [pushActivity],
  )

  const archiveContext = React.useCallback((id: string) => {
    setProject((prev) => ({
      ...prev,
      contexts: prev.contexts.map((c) => (c.id === id ? { ...c, active: false } : c)),
    }))
    pushActivity("Một context đã được archive")
  }, [pushActivity])

  const createSuite = React.useCallback(
    (name: string, description: string) => {
      const newSuite: TestSuite = {
        id: `suite-${Date.now()}`,
        projectId: CURRENT_PROJECT_ID,
        name,
        description,
        active: true,
        updatedAt: nowIso(),
      }
      setProject((prev) => ({ ...prev, suites: [newSuite, ...prev.suites] }))
      pushActivity(`Suite "${name}" đã được tạo`)
      return newSuite
    },
    [pushActivity],
  )

  const editSuite = React.useCallback((id: string, name: string, description: string) => {
    setProject((prev) => ({
      ...prev,
      suites: prev.suites.map((s) => (s.id === id ? { ...s, name, description, updatedAt: nowIso() } : s)),
    }))
  }, [])

  const archiveSuite = React.useCallback(
    (id: string) => {
      setProject((prev) => ({
        ...prev,
        suites: prev.suites.map((s) => (s.id === id ? { ...s, active: false } : s)),
      }))
      pushActivity("Một suite đã được archive")
    },
    [pushActivity],
  )

  const startGeneration = React.useCallback(
    (suiteId: string, contextIds: string[], plan: GenerationPlan) => {
      const op: GenerationOperation = {
        id: `gen-${Date.now()}`,
        suiteId,
        status: "queued",
        contextIds,
        plan,
        createdAt: nowIso(),
      }
      setActiveGeneration(op)
      pushActivity("Yêu cầu sinh testcase đã được xếp hàng")

      window.setTimeout(() => {
        setActiveGeneration((prev) => (prev && prev.id === op.id ? { ...prev, status: "running" } : prev))
      }, 900)

      window.setTimeout(() => {
        // 85% chance of success in the mock
        const willSucceed = Math.random() > 0.15
        if (!willSucceed) {
          setActiveGeneration((prev) =>
            prev && prev.id === op.id
              ? { ...prev, status: "failed", failureReason: "Không thể kết nối tới mô hình sinh testcase. Vui lòng thử lại." }
              : prev,
          )
          return
        }
        const total = plan.happy_path + plan.edge_case + plan.safety + plan.hallucination
        const categories: { category: TestCase["category"]; count: number }[] = [
          { category: "happy_path", count: plan.happy_path },
          { category: "edge_case", count: plan.edge_case },
          { category: "safety", count: plan.safety },
          { category: "hallucination", count: plan.hallucination },
        ]
        const newCases: TestCase[] = []
        categories.forEach(({ category, count }) => {
          for (let i = 0; i < count; i++) {
            const idx = newCases.length
            newCases.push({
              id: `case-gen-${op.id}-${idx}`,
              suiteId,
              title: `Testcase sinh tự động #${idx + 1} (${category})`,
              scenario: "Kịch bản được sinh tự động dựa trên context và requirement hiện hành.",
              category,
              source: "llm_generated",
              requirementQuality: "low",
              contextVersionIds: contextIds,
              revision: 1,
              requestPayload: `{
  "question": "Câu hỏi mẫu được sinh tự động",
  "session_id": "sess-gen"
}`,
              expectedBehavior: "Chatbot trả lời đúng chính sách, không bịa thông tin.",
              rubric: "Đánh giá độ chính xác và bám sát context.",
              requiredKeywords: [],
              forbiddenKeywords: [],
              requiredRegexes: [],
              forbiddenRegexes: [],
              maxLatencyMs: 1000,
              metrics: [{ id: `m-gen-${idx}`, type: "faithfulness", threshold: 0.8 }],
              archived: false,
            })
          }
        })
        setTestCases((prev) => [...newCases, ...prev])
        setActiveGeneration((prev) => (prev && prev.id === op.id ? { ...prev, status: "completed" } : prev))
        pushActivity(`Sinh testcase hoàn tất: ${total} testcase mới`)
      }, 2600)
    },
    [pushActivity],
  )

  const retryGeneration = React.useCallback(
    (suiteId: string) => {
      setActiveGeneration((prev) => {
        if (!prev) return prev
        startGeneration(suiteId, prev.contextIds, prev.plan)
        return prev
      })
    },
    [startGeneration],
  )

  const saveTestCase = React.useCallback((testCase: TestCase) => {
    setTestCases((prev) => {
      const exists = prev.some((c) => c.id === testCase.id)
      if (exists) {
        return prev.map((c) => (c.id === testCase.id ? { ...testCase, revision: c.revision + 1 } : c))
      }
      return [{ ...testCase }, ...prev]
    })
  }, [])

  const archiveTestCase = React.useCallback((id: string) => {
    setTestCases((prev) => prev.map((c) => (c.id === id ? { ...c, archived: true } : c)))
  }, [])

  function runSingleCase(tc: TestCase): CaseRunResult {
    // Deterministic-ish mock outcome generation
    const rand = Math.random()
    if (rand < 0.1) {
      return {
        caseId: tc.id,
        caseTitle: tc.title,
        category: tc.category,
        state: "error",
        httpStatus: 502,
        testCaseRevision: tc.revision,
        ruleResults: [{ rule: "Response schema hợp lệ", status: "not_run", reason: "Không nhận được response hợp lệ từ target." }],
        metricResults: tc.metrics.map((m) => ({
          metric: m.type,
          threshold: m.threshold,
          gating: m.threshold > 0,
          status: "not_run" as const,
          reason: "Không thể chấm điểm do lỗi kỹ thuật khi gọi target.",
        })),
      }
    }
    const passed = rand > 0.35
    const score = passed ? 0.8 + Math.random() * 0.18 : 0.4 + Math.random() * 0.3
    return {
      caseId: tc.id,
      caseTitle: tc.title,
      category: tc.category,
      state: passed ? "passed" : "failed",
      httpStatus: 200,
      latencyMs: 380 + Math.floor(Math.random() * 300),
      score: Number(score.toFixed(2)),
      extractedAnswer: "Bạn có thể đổi trả sản phẩm trong vòng 30 ngày kể từ ngày mua, kèm hoá đơn hợp lệ.",
      testCaseRevision: tc.revision,
      ruleResults: [
        { rule: "Response schema hợp lệ", status: "passed", reason: "Trường answer tồn tại và đúng kiểu string." },
        { rule: "Độ trễ tối đa 1000 ms", status: "passed", observedValue: "412 ms", reason: "Trong ngưỡng cho phép." },
      ],
      metricResults: tc.metrics.map((m) => ({
        metric: m.type,
        score: m.threshold > 0 ? Number(score.toFixed(2)) : undefined,
        threshold: m.threshold,
        gating: m.threshold > 0,
        status: m.threshold === 0 ? "reference" : passed ? "passed" : "failed",
        reason:
          m.threshold === 0
            ? "Chỉ tham khảo, không ảnh hưởng pass/fail."
            : passed
              ? "Đạt ngưỡng yêu cầu."
              : "Điểm số thấp hơn ngưỡng yêu cầu.",
      })),
    }
  }

  const startRun = React.useCallback(
    (suiteId: string, casesToRun: TestCase[]) => {
      const runId = `run-${Date.now()}`
      const isSingleCase = casesToRun.length === 1
      const newRun: SuiteRun = {
        id: runId,
        suiteId,
        status: "queued",
        createdAt: nowIso(),
        targetConfigVersion: project.target.currentVersion,
        requirementVersion: project.requirement.currentVersion,
        requirementQuality: project.requirement.quality,
        cases: casesToRun.map((tc) => ({
          caseId: tc.id,
          caseTitle: tc.title,
          category: tc.category,
          state: "queued",
          testCaseRevision: tc.revision,
          ruleResults: [],
          metricResults: [],
        })),
        timeline: [
          {
            label: isSingleCase ? "Run 1 testcase được xếp hàng" : "Run được xếp hàng",
            timestamp: nowIso(),
          },
        ],
      }
      setActiveRun(newRun)
      pushActivity(isSingleCase ? `Run cho 1 testcase đã được xếp hàng` : `Run mới cho suite đã được xếp hàng`)

      window.setTimeout(() => {
        setActiveRun((prev) =>
          prev && prev.id === runId
            ? { ...prev, status: "dispatching", timeline: [...prev.timeline, { label: "Đang dispatch tới target", timestamp: nowIso() }] }
            : prev,
        )
      }, 700)

      window.setTimeout(() => {
        setActiveRun((prev) =>
          prev && prev.id === runId
            ? { ...prev, status: "running", timeline: [...prev.timeline, { label: "Bắt đầu thực thi test case", timestamp: nowIso() }] }
            : prev,
        )
      }, 1400)

      casesToRun.forEach((tc, i) => {
        window.setTimeout(() => {
          setActiveRun((prev) => {
            if (!prev || prev.id !== runId) return prev
            const result = runSingleCase(tc)
            return {
              ...prev,
              cases: prev.cases.map((c) => (c.caseId === tc.id ? result : c)),
              timeline: [...prev.timeline, { label: `Hoàn tất case: ${tc.title}`, timestamp: nowIso() }],
            }
          })
        }, 1800 + i * 900)
      })

      window.setTimeout(
        () => {
          setActiveRun((prev) => {
            if (!prev || prev.id !== runId) return prev
            const outcomes = prev.cases.map((c) => c.state)
            const outcome = outcomes.includes("error") ? "error" : outcomes.includes("failed") ? "failed" : "passed"
            const finished: SuiteRun = {
              ...prev,
              status: "completed",
              completedAt: nowIso(),
              outcome,
              timeline: [...prev.timeline, { label: "Run hoàn tất", timestamp: nowIso() }],
            }
            setProject((p) => ({ ...p, runs: [finished, ...p.runs] }))
            return finished
          })
          pushActivity(isSingleCase ? "Run testcase đã hoàn tất" : "Run suite đã hoàn tất")
        },
        1800 + casesToRun.length * 900 + 600,
      )

      return runId
    },
    [project.target.currentVersion, project.requirement.currentVersion, project.requirement.quality, pushActivity],
  )

  const startSuiteRun = React.useCallback(
    (suiteId: string) => {
      const suiteCases = testCases.filter((c) => c.suiteId === suiteId && !c.archived).slice(0, 20)
      startRun(suiteId, suiteCases)
    },
    [testCases, startRun],
  )

  const startCaseRun = React.useCallback(
    (suiteId: string, caseId: string) => {
      const tc = testCases.find((c) => c.id === caseId)
      if (!tc) return
      startRun(suiteId, [tc])
    },
    [testCases, startRun],
  )

  const value: AppStateContextValue = {
    auth,
    project,
    testCases,
    login,
    logout,
    setRole,
    saveTargetConfig,
    saveRequirement,
    answerClarification,
    skipClarification,
    addContext,
    editContext,
    archiveContext,
    createSuite,
    editSuite,
    archiveSuite,
    startGeneration,
    retryGeneration,
    activeGeneration,
    saveTestCase,
    archiveTestCase,
    activeRun,
    startSuiteRun,
    startCaseRun,
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = React.useContext(AppStateContext)
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider")
  return ctx
}

export type { MetricConfig }
