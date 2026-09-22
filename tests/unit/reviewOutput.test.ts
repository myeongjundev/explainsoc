// @vitest-environment node
import type { CaseRound } from '../../src/domain/caseFile'
import {
  buildBriefText,
  buildRequestText,
  buildReview,
  buildRoundComparison,
} from '../../src/domain/review'
import type { ReviewInput } from '../../src/domain/types'

const previousInput: ReviewInput = {
  claim: { fpr: 0.001 },
  matrix: null,
  claimedBest: 'no',
  split: 'unseen',
  unseenIncluded: 'yes',
  deduplicated: 'yes',
  source: 'user',
}

const separateInput: ReviewInput = {
  claim: { attackRecall: 0.0007 },
  matrix: null,
  claimedBest: null,
  split: null,
  unseenIncluded: null,
  deduplicated: null,
  source: 'user',
}

describe('회차 비교 의미', () => {
  const previous = buildReview(previousInput)
  const current = buildReview(separateInput, { isFollowup: true, sameTrial: 'no', hasReceivedEvidence: true })

  it('같은 시험이 아니면 규칙 소멸을 해결로 분류하지 않는다', () => {
    const comparison = buildRoundComparison(previous, current, 'no')
    expect(comparison.kind).toBe('separate')
    if (comparison.kind === 'separate') {
      expect(comparison.previous.map((finding) => finding.ruleId)).toContain('R04')
      expect(comparison.current.map((finding) => finding.ruleId)).not.toContain('R04')
    }
  })

  it('예는 확정 비교, 모름은 임시 비교다', () => {
    expect(buildRoundComparison(previous, current, 'yes').kind).toBe('confirmed')
    expect(buildRoundComparison(previous, current, 'unknown').kind).toBe('provisional')
  })
})

describe('사람이 읽는 산출물', () => {
  const review = buildReview(previousInput)
  const question = review.questions[0]
  const firstRound: CaseRound = {
    id: 'r1',
    label: '1회차 · 최초 주장',
    sourceKind: 'proposal',
    sourceNote: '첫 제안서',
    sameTrial: null,
    input: previousInput,
    responses: { [question]: { status: 'requested', note: '다음 주 Recall 표 요청' } },
  }
  const secondRound: CaseRound = {
    id: 'r2',
    label: '2회차 · 공급자 답변',
    sourceKind: 'vendor-response',
    sourceNote: '',
    sameTrial: 'no',
    input: separateInput,
    responses: {},
  }
  const current = buildReview(separateInput, { isFollowup: true, sameTrial: 'no', hasReceivedEvidence: true })
  const comparison = buildRoundComparison(review, current, 'no')

  it('이전 회차의 답변 상태와 메모를 검토표에 남긴다', () => {
    const text = buildBriefText(separateInput, current, {}, {
      caseTitle: '침입 탐지 PoC',
      rounds: [firstRound],
      current: secondRound,
      comparison,
    })
    expect(text).toContain('당시 상태: 자료 요청')
    expect(text).toContain('당시 메모: 다음 주 Recall 표 요청')
    expect(text).toContain('[별도 시험 판독]')
    expect(text).toContain('이전 시험 판독: R04 · 공격 Recall 없는 오탐률')
    expect(text).not.toContain('[이전 회차와 변화]')
  })

  it('요청서와 검토표에서 근거 코드를 원고 절과 제목으로 푼다', () => {
    const request = buildRequestText(review)
    expect(request).toContain('P03 · 원고 V-2 · 무작위와 미관측 공격의 XGBoost')
    expect(request).toContain('[근거 목록]')
    const brief = buildBriefText(previousInput, review, {}, undefined)
    expect(brief).toContain('근거: P03 · 원고 V-2 · 무작위와 미관측 공격의 XGBoost')
  })
})
