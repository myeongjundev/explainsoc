/**
 * 판독 규칙 R01~R10(설계 7절) + V2 정합성 규칙 R11~R13(설계 23절) + V3 출처 R14 + V9 설명 주장 R15(설계 31절).
 * 규칙 하나에 조건·상태·문구·질문·근거를 함께 둔다.
 *
 * - 임계값으로 등급을 매기지 않는다. 숫자가 높은지 낮은지 판정하지 않는다.
 * - 사용자 입력을 논문 수치와 우열 비교하지 않는다.
 * - R03·R04·R10의 지표 "있음"은 사용자가 직접 적은 주장이다. 혼동행렬은 따로 본다
 *   (구현 체크리스트 1절 해석 1).
 */

import { XGB_UNSEEN, type EvidenceId } from '../data/paperEvidence'
import { computeMetrics, roundTo4, type Computed } from './metrics'
import type { FindingStatus, ReviewInput } from './types'

export type RuleId =
  | 'R01'
  | 'R02'
  | 'R03'
  | 'R04'
  | 'R05'
  | 'R06'
  | 'R07'
  | 'R08'
  | 'R09'
  | 'R10'
  | 'R11'
  | 'R12'
  | 'R13'
  | 'R14'
  | 'R15'

export interface ReviewContext {
  isFollowup: boolean
  sameTrial: import('./types').TriAnswer | null
  /** 이번 회차에 새로 적은 지표나 혼동행렬이 있는지. 합쳐진 이전 근거와 구분한다. */
  hasReceivedEvidence?: boolean
}

export interface ReviewRule {
  id: RuleId
  status: FindingStatus
  /** 결과 목록에서 훑어보기 위한 짧은 이름 */
  title: string
  /** 설계 7절의 "화면 안내" */
  guidance: string
  /** 공급자에게 그대로 소리 내어 읽을 수 있는 질문 */
  question: string
  evidenceIds: readonly EvidenceId[]
  applies: (input: ReviewInput, context?: ReviewContext) => boolean
  /** 질문을 목록에 넣을지. 없으면 늘 넣는다. */
  asks?: (input: ReviewInput) => boolean
  /** 논문 예시 A에서만 원고의 표현을 빌려 쓰는 안내 */
  guidanceForPaperExample?: string
}

/** 고르지 않은 평가 조건은 모름과 같이 읽는다 (설계 10절). */
const splitOf = (i: ReviewInput) => i.split ?? 'unknown'
const unseenOf = (i: ReviewInput) => i.unseenIncluded ?? 'unknown'
const dedupOf = (i: ReviewInput) => i.deduplicated ?? 'unknown'
const has = (i: ReviewInput, k: keyof ReviewInput['claim']) => i.claim[k] !== undefined

const computedValue = (value: Computed): number | undefined => (value.kind === 'value' ? roundTo4(value.value) : undefined)

/** 사용자가 적은 반올림 지표와 혼동행렬 계산값이 화면에서 다르게 보이는지 확인한다. */
export function hasMetricMismatch(input: ReviewInput): boolean {
  if (!input.matrix) return false
  const m = computeMetrics(input.matrix)
  const calculated = {
    accuracy: computedValue(m.accuracy),
    macroF1: computedValue(m.macroF1),
    attackRecall: computedValue(m.attackRecall),
    fpr: computedValue(m.fpr),
  }
  return (Object.keys(input.claim) as (keyof typeof calculated)[]).some((kind) => {
    const claimed = input.claim[kind]
    const actual = calculated[kind]
    return claimed !== undefined && actual !== undefined && roundTo4(claimed) !== actual
  })
}

export const REVIEW_RULES: readonly ReviewRule[] = [
  {
    id: 'R01',
    status: 'caution',
    title: '무작위로 나눈 시험의 점수',
    guidance: '관측한 공격이 섞인 시험의 높은 점수를 미관측 공격 성능으로 확대할 수 없습니다.',
    question: '학습에 없던 공격만 따로 둔 시험 결과도 있습니까?',
    evidenceIds: ['P07', 'P03'],
    applies: (i) => splitOf(i) === 'random',
  },
  {
    id: 'R02',
    status: 'check',
    title: '시험 자료를 나눈 기준',
    guidance: '점수를 만든 시험 조건을 알 수 없습니다.',
    question: '학습과 시험 자료를 어떤 기준으로 나눴습니까?',
    evidenceIds: ['P07', 'P01'],
    applies: (i) => splitOf(i) === 'unknown',
  },
  {
    id: 'R03',
    status: 'caution',
    title: '정확도만 있는 주장',
    guidance: '전체 정확도만으로 공격 미탐을 알 수 없습니다.',
    question: '공격 Recall과 TN·FP·FN·TP를 제공할 수 있습니까?',
    evidenceIds: ['P06'],
    applies: (i) => has(i, 'accuracy') && !has(i, 'attackRecall') && i.matrix === null,
  },
  {
    id: 'R04',
    status: 'caution',
    title: '공격 Recall 없는 오탐률',
    guidance: '낮아 보이는 오탐률만으로 공격 탐지 능력을 알 수 없습니다.',
    // 원고 V-2 원문의 표현을 빌린다. 숫자는 근거 데이터에서 가져온다.
    guidanceForPaperExample: `매우 낮은 FPR ${XGB_UNSEEN.reported.fpr}는 좋은 결과처럼 보이지만, 논문에서 이 숫자는 모델이 거의 모든 흐름을 정상으로 예측한 결과였습니다. 공격 Recall과 함께 읽어야 합니다.`,
    question: '같은 시험에서 공격 Recall은 얼마입니까?',
    evidenceIds: ['P03'],
    applies: (i) => has(i, 'fpr') && !has(i, 'attackRecall'),
  },
  {
    id: 'R05',
    status: 'check',
    title: '가장 좋은 모델이라는 주장',
    guidance: '분할에 따라 모델 순위가 달라질 수 있습니다.',
    question: '다른 분할에서도 같은 모델이 가장 높았습니까?',
    evidenceIds: ['P04'],
    // 이 앱은 평가 결과를 하나만 받으므로, 이 주장이 있으면 늘 한 분할 결과만 있는 셈이다.
    applies: (i) => i.claimedBest === 'yes',
  },
  {
    id: 'R06',
    status: 'caution',
    title: '중복을 빼지 않은 평가',
    guidance: '중복을 처리하지 않은 평가는 낙관적일 수 있습니다.',
    question: '완전 중복과 학습·시험 중복을 제거한 결과가 있습니까?',
    evidenceIds: ['P05'],
    applies: (i) => dedupOf(i) === 'no',
  },
  {
    id: 'R07',
    status: 'check',
    title: '중복 처리 여부',
    guidance: '중복 통제 여부를 알 수 없습니다.',
    question: '중복과 학습·시험 사이 같은 행을 검사했습니까?',
    evidenceIds: ['P05'],
    applies: (i) => dedupOf(i) === 'unknown',
  },
  {
    id: 'R08',
    status: 'input',
    title: '학습에 없던 공격은 시험하지 않음',
    guidance: '이 시험은 학습에서 보지 못한 공격을 직접 검증하지 않았습니다.',
    question: '미관측 공격만 별도로 둔 스트레스 테스트가 있습니까?',
    evidenceIds: ['P07'],
    applies: (i) => unseenOf(i) === 'no',
  },
  {
    id: 'R09',
    status: 'check',
    title: '학습에 없던 공격의 시험 여부',
    guidance: '새 공격을 시험했는지 알 수 없습니다.',
    question: '시험에 학습 때 없던 공격 유형이 들어 있었습니까?',
    evidenceIds: ['P01', 'P07'],
    applies: (i) => unseenOf(i) === 'unknown',
  },
  {
    id: 'R10',
    status: 'input',
    title: '오탐률과 공격 Recall',
    guidance: '두 값을 나란히 제시합니다. 높고 낮음을 자동 판정하지 않습니다.',
    question: '필요하면 혼동행렬 원수치를 제공할 수 있습니까?',
    evidenceIds: ['P06'],
    applies: (i) => has(i, 'fpr') && has(i, 'attackRecall'),
    // 이미 네 칸을 입력했다면 같은 것을 다시 묻지 않는다 (구현 체크리스트 1절 해석 2).
    asks: (i) => i.matrix === null,
  },
  {
    id: 'R11',
    status: 'check',
    title: '주장 지표와 혼동행렬 계산값이 다름',
    guidance: '적어 준 지표와 같은 화면의 혼동행렬에서 계산한 값이 소수 넷째 자리에서 다릅니다.',
    question: '이 성능 지표와 혼동행렬은 같은 시험 결과입니까?',
    evidenceIds: ['P02', 'P06'],
    applies: hasMetricMismatch,
  },
  {
    id: 'R12',
    status: 'check',
    title: '평가 조건의 두 답이 서로 다름',
    guidance: '학습에 없던 공격을 따로 시험했다고 했지만, 미관측 공격 포함 여부에는 아니오라고 답했습니다.',
    question: '미관측 공격을 별도 시험한 것과 시험에 미관측 공격이 없다는 답 가운데 어느 것이 맞습니까?',
    evidenceIds: ['P01', 'P07'],
    applies: (i) => splitOf(i) === 'unseen' && unseenOf(i) === 'no',
  },
  {
    id: 'R13',
    status: 'check',
    title: '다른 방식으로 나눈 시험',
    guidance: '다른 방식이라는 답만으로는 학습과 시험의 관계를 알 수 없습니다.',
    question: '학습과 시험을 나눈 구체적인 기준과 각 시험의 공격 유형 구성을 제공할 수 있습니까?',
    evidenceIds: ['P01', 'P07'],
    applies: (i) => splitOf(i) === 'other',
  },
  {
    id: 'R14',
    status: 'check',
    title: '받은 자료의 시험 출처',
    guidance: '새로 받은 성능 근거가 기존 주장과 같은 시험에서 나왔는지 알 수 없습니다. 확인 전의 변화는 임시 미리보기입니다.',
    question: '이번에 받은 지표와 혼동행렬은 기존 성능 주장과 같은 시험 결과입니까?',
    evidenceIds: ['P02', 'P06'],
    applies: (i, context) => Boolean(
      context?.isFollowup
      && (context.sameTrial === null || context.sameTrial === 'unknown')
      && (context.hasReceivedEvidence ?? (Object.keys(i.claim).length > 0 || Boolean(i.matrix))),
    ),
  },
  {
    id: 'R15',
    status: 'check',
    title: '설명 가능한 AI라는 주장',
    guidance: '탐지 근거를 설명해 준다는 것과 공격을 잘 잡는다는 것은 다른 이야기입니다. 설명이 늘 같게 나와도 공격을 거의 놓칠 수 있습니다.',
    question: '보여 준 설명은 어떤 시험 자료로 학습한 모델의 것이고, 같은 시험에서 공격 Recall은 얼마입니까?',
    evidenceIds: ['P14', 'P08'],
    applies: (i) => i.claimedExplanation === 'yes',
  },
]

export const RULE_BY_ID: Record<RuleId, ReviewRule> = Object.fromEntries(
  REVIEW_RULES.map((r) => [r.id, r]),
) as Record<RuleId, ReviewRule>
