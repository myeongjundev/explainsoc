// 앱 전체가 함께 쓰는 형태. 화면 문구와 논문 숫자는 여기 두지 않는다.

/** 사용자가 받은 성능표에 적혀 있을 수 있는 지표. 양성 클래스는 공격이다. */
export type MetricKind = 'accuracy' | 'macroF1' | 'attackRecall' | 'fpr'

export const METRIC_KINDS: readonly MetricKind[] = ['accuracy', 'macroF1', 'attackRecall', 'fpr']

export type TriAnswer = 'yes' | 'no' | 'unknown'

/** 시험 자료를 나눈 방식. `unseen`은 학습에 없던 공격을 따로 시험한 경우다. */
export type SplitAnswer = 'random' | 'unseen' | 'other' | 'unknown'

/**
 * 결과 상태 세 가지. 어느 것도 모델 품질을 보증하지 않는다.
 * - check: 확인 필요 — 정보가 없거나 모름이라고 답했다
 * - caution: 해석 주의 — 숫자는 있지만 단독 해석이 위험하다
 * - input: 입력한 근거 — 사용자가 제공한 값이다
 */
export type FindingStatus = 'check' | 'caution' | 'input'

export interface ConfusionMatrix {
  tn: number
  fp: number
  fn: number
  tp: number
}

/** 입력 값이 어디서 왔는지. 논문 예시일 때만 원고의 표현을 그대로 빌려 쓴다. */
export type InputSource = 'exampleA' | 'exampleB' | 'user'

/**
 * 판독 규칙이 읽는 입력. 검증을 통과한 값만 들어온다.
 * 잘못 적은 값은 0으로 바꾸지 않고 아예 빠진다.
 */
export interface ReviewInput {
  /** 사용자가 직접 적은 주장 지표. 혼동행렬에서 계산한 값은 여기 들어오지 않는다. */
  claim: Partial<Record<MetricKind, number>>
  /** 네 칸이 모두 유효하고 합이 0보다 클 때만 값이 있다. */
  matrix: ConfusionMatrix | null
  claimedBest: TriAnswer | null
  split: SplitAnswer | null
  unseenIncluded: TriAnswer | null
  deduplicated: TriAnswer | null
  source: InputSource
}
