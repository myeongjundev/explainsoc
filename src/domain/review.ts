/**
 * 입력을 판독 결과로 바꾼다. 점수를 매기지 않고, 사용자 행동 순서로만 늘어놓는다.
 */

import { REVIEW_RULES, type ReviewRule, type RuleId } from './reviewRules'
import { computeMetrics } from './metrics'
import { formatComputed, formatCount, formatRatio, METRIC_LABEL, SPLIT_LABEL, TRI_LABEL } from './format'
import { METRIC_KINDS, type FindingStatus, type QuestionResponse, type ReviewInput } from './types'

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

const RESPONSE_LABEL: Record<QuestionResponse['status'], string> = {
  unasked: '아직 묻지 않음',
  answered: '답변 받음',
  requested: '자료 요청',
  followup: '추가 확인',
}

/** 화면과 인쇄가 공유하는 PoC 검토표 텍스트. 입력은 사용자의 명시적 복사 동작 때만 클립보드로 간다. */
export function buildBriefText(input: ReviewInput, review: Review, responses: Readonly<Record<string, QuestionResponse>>): string {
  const lines = ['ExplainSOC · PoC 성능 주장 검토표', '']
  lines.push('[받은 성능 주장]')
  const claimed = METRIC_KINDS.filter((k) => input.claim[k] !== undefined)
  if (claimed.length === 0) lines.push('- 적지 않음')
  else for (const kind of claimed) lines.push(`- ${METRIC_LABEL[kind]}: ${formatRatio(input.claim[kind] as number)}`)

  if (input.matrix) {
    const m = computeMetrics(input.matrix)
    lines.push(`- 혼동행렬: TN ${formatCount(input.matrix.tn)} · FP ${formatCount(input.matrix.fp)} · FN ${formatCount(input.matrix.fn)} · TP ${formatCount(input.matrix.tp)}`)
    lines.push(`- 혼동행렬 계산: Accuracy ${formatComputed(m.accuracy)} · 공격 Recall ${formatComputed(m.attackRecall)} · FPR ${formatComputed(m.fpr)} · Macro F1 ${formatComputed(m.macroF1)}`)
  }

  const tri = (value: typeof input.unseenIncluded) => (value ? TRI_LABEL[value] : '모름')
  lines.push('', '[평가 조건]')
  lines.push(`- 시험 자료 분할: ${input.split ? SPLIT_LABEL[input.split] : '모름'}`)
  lines.push(`- 학습 때 없던 공격 포함: ${tri(input.unseenIncluded)}`)
  lines.push(`- 중복 제거: ${tri(input.deduplicated)}`)

  lines.push('', '[검토 결과]')
  if (review.findings.length === 0) lines.push('- 현재 입력에서 추가 판독 항목 없음')
  else for (const finding of review.findings) lines.push(`- ${finding.title}: ${finding.guidance}`)

  lines.push('', '[공급자 질문과 답변]')
  for (const [index, question] of review.questions.entries()) {
    const response = responses[question] ?? { status: 'unasked', note: '' }
    lines.push(`${index + 1}. ${question}`)
    lines.push(`   상태: ${RESPONSE_LABEL[response.status]}`)
    if (response.note.trim()) lines.push(`   메모: ${response.note.trim()}`)
  }
  lines.push('', '※ 이 검토표는 모델의 합격·불합격이나 실제 조직망 성능을 판정하지 않습니다.')
  return lines.join('\n')
}
