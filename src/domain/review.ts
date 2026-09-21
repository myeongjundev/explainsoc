/**
 * 입력을 판독 결과로 바꾼다. 점수를 매기지 않고, 사용자 행동 순서로만 늘어놓는다.
 */

import { REVIEW_RULES, type ReviewRule, type RuleId } from './reviewRules'
import type { FindingStatus, ReviewInput } from './types'

export interface Finding {
  ruleId: RuleId
  status: FindingStatus
  title: string
  guidance: string
  question: string
  /** 이 항목의 질문을 공급자 질문 목록에 넣는지 */
  asked: boolean
  evidenceIds: ReviewRule['evidenceIds']
}

/** 설계 13-3: 확인 필요 → 해석 주의 → 입력한 근거. 위험 점수가 아니라 다음 행동 순서다. */
export const STATUS_ORDER: readonly FindingStatus[] = ['check', 'caution', 'input']

export interface Review {
  findings: Finding[]
  byStatus: Record<FindingStatus, Finding[]>
  /** 공급자에게 물을 질문. 사용자가 적은 숫자는 들어가지 않는다. */
  questions: string[]
}

export function buildReview(input: ReviewInput): Review {
  const matched = REVIEW_RULES.filter((rule) => rule.applies(input)).map<Finding>((rule) => ({
    ruleId: rule.id,
    status: rule.status,
    title: rule.title,
    guidance:
      input.source === 'exampleA' && rule.guidanceForPaperExample
        ? rule.guidanceForPaperExample
        : rule.guidance,
    question: rule.question,
    asked: rule.asks ? rule.asks(input) : true,
    evidenceIds: rule.evidenceIds,
  }))

  const byStatus: Record<FindingStatus, Finding[]> = { check: [], caution: [], input: [] }
  for (const f of matched) byStatus[f.status].push(f)

  const findings = STATUS_ORDER.flatMap((s) => byStatus[s])
  const questions = [...new Set(findings.filter((f) => f.asked).map((f) => f.question))]

  return { findings, byStatus, questions }
}

/** 질문 복사에 쓰는 글. 질문 문장만 담는다 — 입력한 숫자는 공급자의 대외비일 수 있다. */
export function questionsToClipboardText(questions: readonly string[]): string {
  return questions.map((q, i) => `${i + 1}. ${q}`).join('\n')
}
