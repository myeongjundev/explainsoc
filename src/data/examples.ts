/**
 * 예시 데이터. 공개 데이터셋 CICIDS2017을 쓴 10번 논문의 집계 결과만 담는다.
 * 원자료, IP, 사용자 이름, 실제 조직 자료, 회사·제품 이름은 넣지 않는다.
 *
 * 폼에 채울 문자열로 둔다. 사용자가 이어서 고칠 수 있어야 하기 때문이다.
 */

import type { MetricKind, SplitAnswer, TriAnswer } from '../domain/types'
import type { MatrixRaw } from '../domain/validation'
import { XGB_RANDOM, XGB_UNSEEN } from './paperEvidence'

export interface ExampleInput {
  id: 'exampleA' | 'exampleB'
  label: string
  claim: { kind: MetricKind; raw: string }[]
  matrix: MatrixRaw
  claimedBest: TriAnswer | null
  split: SplitAnswer
  unseenIncluded: TriAnswer
  deduplicated: TriAnswer
}

const asRaw = (m: { tn: number; fp: number; fn: number; tp: number }): MatrixRaw => ({
  tn: String(m.tn),
  fp: String(m.fp),
  fn: String(m.fn),
  tp: String(m.tp),
})

/**
 * 예시 A — 60초 검토 기본값. 미관측 공격 스트레스 테스트의 XGBoost.
 * 공급자가 보여 줄 법한 두 숫자(Accuracy, FPR)만 주장으로 적고, 뒤집기에 쓸 혼동행렬을 함께 둔다.
 */
export const EXAMPLE_A: ExampleInput = {
  id: 'exampleA',
  label: '논문 예시 — 미관측 공격 스트레스 테스트의 XGBoost',
  claim: [
    { kind: 'accuracy', raw: String(XGB_UNSEEN.reported.accuracy) },
    { kind: 'fpr', raw: String(XGB_UNSEEN.reported.fpr) },
  ],
  matrix: asRaw(XGB_UNSEEN.matrix),
  claimedBest: null,
  split: 'unseen',
  unseenIncluded: 'yes',
  deduplicated: 'yes',
}

/** 예시 B — 높은 무작위 분할 점수. 계층화 무작위 분할의 XGBoost. */
export const EXAMPLE_B: ExampleInput = {
  id: 'exampleB',
  label: '논문 예시 — 계층화 무작위 분할의 XGBoost',
  claim: [
    { kind: 'accuracy', raw: String(XGB_RANDOM.reported.accuracy) },
    { kind: 'macroF1', raw: String(XGB_RANDOM.reported.macroF1) },
    { kind: 'attackRecall', raw: String(XGB_RANDOM.reported.attackRecall) },
    { kind: 'fpr', raw: String(XGB_RANDOM.reported.fpr) },
  ],
  matrix: asRaw(XGB_RANDOM.matrix),
  claimedBest: null,
  split: 'random',
  unseenIncluded: 'no',
  deduplicated: 'yes',
}
