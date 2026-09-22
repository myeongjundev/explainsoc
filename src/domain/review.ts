/**
 * 입력을 판독 결과로 바꾼다. 점수를 매기지 않고, 사용자 행동 순서로만 늘어놓는다.
 */

import { REVIEW_RULES, type ReviewContext, type ReviewRule, type RuleId } from './reviewRules'
import { computeMetrics } from './metrics'
import { formatComputed, formatCount, formatRatio, METRIC_LABEL, SPLIT_LABEL, TRI_LABEL } from './format'
import { METRIC_KINDS, type FindingStatus, type QuestionResponse, type ReviewInput } from './types'
import type { CaseRound } from './caseFile'
import type { RoundSourceKind } from './caseFile'

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

export function buildReview(input: ReviewInput, context?: ReviewContext): Review {
  const matched = REVIEW_RULES.filter((rule) => rule.applies(input, context)).map<Finding>((rule) => ({
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

export interface ReviewDiff {
  resolved: Finding[]
  remaining: Finding[]
  added: Finding[]
}

export function compareReviews(previous: Review, current: Review): ReviewDiff {
  const before = new Set(previous.findings.map((finding) => finding.ruleId))
  const after = new Set(current.findings.map((finding) => finding.ruleId))
  return {
    resolved: previous.findings.filter((finding) => !after.has(finding.ruleId)),
    remaining: current.findings.filter((finding) => before.has(finding.ruleId)),
    added: current.findings.filter((finding) => !before.has(finding.ruleId)),
  }
}

export const REQUEST_ARTIFACT: Record<RuleId, string> = {
  R01: '학습·시험 공격 유형 구성표와 분할별 성능표',
  R02: '분할 기준, 기간, 공격 유형을 적은 평가 설계서',
  R03: '같은 시험의 공격 Recall과 TN·FP·FN·TP 원수치',
  R04: '같은 시험의 공격 Recall과 공격 표본 수',
  R05: '분할별 모델 성능 비교표와 선정 기준',
  R06: '중복 제거 전·후 건수와 성능 비교표',
  R07: '중복 키·검사 방법과 학습·시험 교차 중복 건수',
  R08: '미관측 공격 목록과 별도 스트레스 테스트 결과',
  R09: '학습·시험 공격 유형 목록과 겹침 표',
  R10: '같은 시험의 TN·FP·FN·TP 원수치',
  R11: '지표와 혼동행렬의 시험 ID·버전·실행 조건',
  R12: '분할 정의와 시험 공격 유형 구성표',
  R13: '구체적인 분할 기준과 학습·시험 공격 유형 표',
  R14: '기존 주장과 새 자료의 시험 ID·버전·실행 조건',
}

export function buildRequestText(review: Review): string {
  const asked = review.findings.filter((finding) => finding.asked)
  const lines = ['ExplainSOC · 공급자 자료 요청서', '']
  if (asked.length === 0) return `${lines.join('\n')}\n현재 입력에서 추가로 요청할 자료가 없습니다.`
  asked.forEach((finding, index) => {
    lines.push(`${index + 1}. ${finding.question}`)
    lines.push(`   요청할 자료: ${REQUEST_ARTIFACT[finding.ruleId]}`)
    lines.push(`   이유: ${finding.guidance}`)
    lines.push(`   근거: ${finding.evidenceIds.join(', ')}`, '')
  })
  lines.push('※ 이 요청서는 모델 품질 판정이 아니라 평가 조건을 확인하기 위한 목록입니다.')
  return lines.join('\n')
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

const ROUND_SOURCE_LABEL: Record<RoundSourceKind, string> = {
  proposal: '최초 제안서',
  'vendor-response': '공급자 답변',
  'additional-test': '추가 시험',
  other: '기타',
}

const SAME_TRIAL_LABEL: Record<NonNullable<CaseRound['sameTrial']>, string> = {
  yes: '예',
  no: '아니오',
  unknown: '모름',
}

/** 화면과 인쇄가 공유하는 PoC 검토표 텍스트. 입력은 사용자의 명시적 복사 동작 때만 클립보드로 간다. */
export interface BriefContext {
  caseTitle: string
  rounds: readonly CaseRound[]
  current: CaseRound
  diff: ReviewDiff | null
}

export function buildBriefText(input: ReviewInput, review: Review, responses: Readonly<Record<string, QuestionResponse>>, context?: BriefContext): string {
  const lines = ['ExplainSOC · PoC 성능 주장 검토표', '']
  if (context) {
    lines.push(`[사례] ${context.caseTitle}`, '', '[회차 기록]')
    for (const round of [...context.rounds, context.current]) {
      lines.push(`- ${round.label} · ${ROUND_SOURCE_LABEL[round.sourceKind]} · 같은 시험: ${round.sameTrial ? SAME_TRIAL_LABEL[round.sameTrial] : '해당 없음'}`)
      if (round.sourceNote.trim()) lines.push(`  출처: ${round.sourceNote.trim()}`)
    }
    if (context.diff) {
      const ids = (items: Finding[]) => items.map((item) => item.ruleId).join(', ') || '없음'
      lines.push('', '[이전 회차와 변화]')
      lines.push(`- 해결됨: ${ids(context.diff.resolved)}`)
      lines.push(`- 남음: ${ids(context.diff.remaining)}`)
      lines.push(`- 새로 생김: ${ids(context.diff.added)}`)
      if (context.current.sameTrial === 'unknown' || context.current.sameTrial === null) lines.push('- 주의: 같은 시험인지 확인 전인 임시 비교')
    }
    lines.push('')
  }
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

  lines.push('', '[남은 공급자 질문과 답변]')
  if (review.questions.length === 0) lines.push('- 현재 입력에서 추가로 물을 질문 없음')
  for (const [index, question] of review.questions.entries()) {
    const response = responses[question] ?? { status: 'unasked', note: '' }
    const finding = review.findings.find((item) => item.question === question)
    lines.push(`${index + 1}. ${question}`)
    lines.push(`   상태: ${RESPONSE_LABEL[response.status]}`)
    if (finding) lines.push(`   요청할 자료: ${REQUEST_ARTIFACT[finding.ruleId]}`)
    if (response.note.trim()) lines.push(`   메모: ${response.note.trim()}`)
  }

  lines.push('', '[검토 결과와 근거]')
  if (review.findings.length === 0) lines.push('- 현재 입력에서 추가 판독 항목 없음')
  else for (const finding of review.findings) {
    lines.push(`- ${finding.title}: ${finding.guidance}`)
    lines.push(`  근거: ${finding.evidenceIds.join(', ')}`)
  }
  lines.push('', '※ 이 검토표는 모델의 합격·불합격이나 실제 조직망 성능을 판정하지 않습니다.')
  return lines.join('\n')
}
