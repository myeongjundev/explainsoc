// @vitest-environment node
import { EXAMPLE_A, EXAMPLE_B } from '../../src/data/examples'
import { EVIDENCE } from '../../src/data/paperEvidence'
import { checkForm, emptyForm, formFromExample } from '../../src/domain/form'
import { buildReview, questionsToClipboardText } from '../../src/domain/review'
import { REVIEW_RULES, RULE_BY_ID, type RuleId } from '../../src/domain/reviewRules'
import type { ReviewInput } from '../../src/domain/types'

/** 모든 평가 조건에 답했고 아무 규칙도 켜지지 않는 입력에서 출발한다. */
const quiet = (over: Partial<ReviewInput> = {}): ReviewInput => ({
  claim: {},
  matrix: null,
  claimedBest: 'no',
  split: 'unseen',
  unseenIncluded: 'yes',
  deduplicated: 'yes',
  source: 'user',
  ...over,
})

const fired = (input: ReviewInput): RuleId[] => buildReview(input).findings.map((f) => f.ruleId)
const MATRIX = { tn: 90, fp: 5, fn: 3, tp: 2 }

describe('출발점', () => {
  it('모든 조건에 답하고 주장이 없으면 아무 규칙도 켜지지 않는다', () => {
    expect(fired(quiet())).toEqual([])
  })
})

describe('규칙 하나마다 켜지는 조건과 꺼지는 조건', () => {
  it('R01 — 분할이 무작위면 해석 주의', () => {
    expect(fired(quiet({ split: 'random' }))).toEqual(['R01'])
    expect(fired(quiet({ split: 'other' }))).toEqual([])
    expect(RULE_BY_ID.R01.status).toBe('caution')
  })

  it('R02 — 분할이 모름이거나 고르지 않았으면 확인 필요', () => {
    expect(fired(quiet({ split: 'unknown' }))).toEqual(['R02'])
    expect(fired(quiet({ split: null }))).toEqual(['R02'])
    expect(RULE_BY_ID.R02.status).toBe('check')
  })

  it('R03 — 정확도는 있는데 공격 Recall과 혼동행렬이 없으면 해석 주의', () => {
    expect(fired(quiet({ claim: { accuracy: 0.99 } }))).toEqual(['R03'])
    expect(fired(quiet({ claim: { accuracy: 0.99, attackRecall: 0.9 } }))).toEqual([])
    expect(fired(quiet({ claim: { accuracy: 0.99 }, matrix: MATRIX }))).toEqual([])
  })

  it('R04 — 오탐률은 있는데 공격 Recall이 없으면 해석 주의', () => {
    expect(fired(quiet({ claim: { fpr: 0.001 } }))).toEqual(['R04'])
    expect(fired(quiet({ claim: { fpr: 0.001, attackRecall: 0.9 } }))).not.toContain('R04')
  })

  it('R04 — 오탐률 값이 얼마든 낮다고 판정하지 않는다', () => {
    const low = buildReview(quiet({ claim: { fpr: 0.0001 } })).findings[0]
    const high = buildReview(quiet({ claim: { fpr: 0.4 } })).findings[0]
    expect(low.guidance).toBe(high.guidance)
  })

  it('R05 — 가장 좋은 모델이라고 소개했으면 확인 필요', () => {
    expect(fired(quiet({ claimedBest: 'yes' }))).toEqual(['R05'])
    expect(fired(quiet({ claimedBest: 'unknown' }))).toEqual([])
    expect(fired(quiet({ claimedBest: null }))).toEqual([])
  })

  it('R06 — 중복을 빼지 않았으면 해석 주의', () => {
    expect(fired(quiet({ deduplicated: 'no' }))).toEqual(['R06'])
  })

  it('R07 — 중복 처리를 모르거나 고르지 않았으면 확인 필요', () => {
    expect(fired(quiet({ deduplicated: 'unknown' }))).toEqual(['R07'])
    expect(fired(quiet({ deduplicated: null }))).toEqual(['R07'])
  })

  it('R08 — 학습에 없던 공격을 시험하지 않았으면 입력한 근거', () => {
    expect(fired(quiet({ unseenIncluded: 'no' }))).toEqual(['R08'])
    expect(RULE_BY_ID.R08.status).toBe('input')
  })

  it('R09 — 학습에 없던 공격의 시험 여부를 모르면 확인 필요', () => {
    expect(fired(quiet({ unseenIncluded: 'unknown' }))).toEqual(['R09'])
    expect(fired(quiet({ unseenIncluded: null }))).toEqual(['R09'])
  })

  it('R10 — 오탐률과 공격 Recall이 모두 있으면 입력한 근거', () => {
    expect(fired(quiet({ claim: { fpr: 0.001, attackRecall: 0.9 } }))).toEqual(['R10'])
    expect(RULE_BY_ID.R10.status).toBe('input')
  })

  it('R10 — 혼동행렬을 이미 입력했으면 같은 것을 다시 묻지 않는다', () => {
    const withoutMatrix = buildReview(quiet({ claim: { fpr: 0.001, attackRecall: 0.9 } }))
    const withMatrix = buildReview(quiet({ claim: { fpr: 0.001, attackRecall: 0.9 }, matrix: MATRIX }))
    expect(withoutMatrix.questions).toContain(RULE_BY_ID.R10.question)
    expect(withMatrix.findings.map((f) => f.ruleId)).toContain('R10')
    expect(withMatrix.questions).not.toContain(RULE_BY_ID.R10.question)
  })
})

describe('모름이 가장 중요한 입력이다', () => {
  it('아무것도 적지 않아도 질문 목록이 비지 않는다', () => {
    const review = buildReview(checkForm(emptyForm()).input)
    expect(review.findings.map((f) => f.ruleId)).toEqual(['R02', 'R07', 'R09'])
    expect(review.questions.length).toBe(3)
  })

  it('숫자 하나만 적어도 조건 질문과 함께 판독한다', () => {
    const review = buildReview(quiet({ split: null, unseenIncluded: null, deduplicated: null, claim: { accuracy: 0.99 } }))
    expect(review.findings.map((f) => f.ruleId)).toEqual(['R02', 'R07', 'R09', 'R03'])
  })
})

describe('논문 예시', () => {
  it('예시 A에서는 R04가 켜지고 원고의 표현을 빌린다', () => {
    const review = buildReview(checkForm(formFromExample(EXAMPLE_A)).input)
    expect(review.findings.map((f) => f.ruleId)).toEqual(['R04'])
    expect(review.findings[0].guidance).toContain('매우 낮은 FPR 0.0002')
    expect(review.questions).toEqual(['같은 시험에서 공격 Recall은 얼마입니까?'])
  })

  it('원고 표현은 예시 A에서만 쓴다 — 같은 조건의 사용자 입력에는 일반 안내', () => {
    const user = buildReview(quiet({ claim: { fpr: 0.0002 } }))
    expect(user.findings[0].guidance).not.toContain('0.0002')
  })

  it('예시 B에서는 R01·R08·R10이 켜진다', () => {
    const review = buildReview(checkForm(formFromExample(EXAMPLE_B)).input)
    expect(review.findings.map((f) => f.ruleId)).toEqual(['R01', 'R08', 'R10'])
    expect(review.questions).toEqual([RULE_BY_ID.R01.question, RULE_BY_ID.R08.question])
  })
})

describe('결과는 판정이 아니라 다음 행동 순서다', () => {
  it('확인 필요 → 해석 주의 → 입력한 근거 순서로 놓는다', () => {
    const review = buildReview(
      quiet({ split: 'random', unseenIncluded: 'unknown', deduplicated: 'no', claim: { fpr: 0.01, attackRecall: 0.5 } }),
    )
    expect(review.findings.map((f) => f.status)).toEqual(['check', 'caution', 'caution', 'input'])
  })

  it('규칙 문구에 합격 판정, 점수, 등급, 추천이 없다', () => {
    const banned = ['합격', '불합격', '신뢰 점수', '등급', '추천', '안전합니다', '위험합니다', '우수', '통과']
    for (const rule of REVIEW_RULES) {
      const text = [rule.title, rule.guidance, rule.question, rule.guidanceForPaperExample ?? ''].join(' ')
      for (const word of banned) expect(text, `${rule.id}에 '${word}'`).not.toContain(word)
    }
  })

  it('규칙이 참조하는 근거 ID는 모두 근거 데이터에 있다', () => {
    for (const rule of REVIEW_RULES) {
      expect(rule.evidenceIds.length).toBeGreaterThan(0)
      for (const id of rule.evidenceIds) expect(EVIDENCE[id], `${rule.id} → ${id}`).toBeDefined()
    }
  })

  it('규칙은 R01부터 R10까지 정확히 열 개다', () => {
    expect(REVIEW_RULES.map((r) => r.id)).toEqual(['R01', 'R02', 'R03', 'R04', 'R05', 'R06', 'R07', 'R08', 'R09', 'R10'])
  })
})

describe('질문 복사', () => {
  it('질문 문장만 담고 사용자가 적은 숫자는 담지 않는다', () => {
    const input = quiet({ split: 'unknown', claim: { accuracy: 0.8123, fpr: 0.0456 } })
    const text = questionsToClipboardText(buildReview(input).questions)
    expect(text).not.toContain('0.8123')
    expect(text).not.toContain('0.0456')
    expect(text.split('\n')[0]).toBe(`1. ${RULE_BY_ID.R02.question}`)
  })
})
