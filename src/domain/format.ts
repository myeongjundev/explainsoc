import type { Computed } from './metrics'
import type { MetricKind, SplitAnswer, TriAnswer } from './types'

/** 화면의 지표 이름. 공급자 자료에 쓰이는 영문을 살리고 뜻을 괄호로 붙인다. */
export const METRIC_LABEL: Record<MetricKind, string> = {
  accuracy: 'Accuracy (정확도)',
  macroF1: 'Macro F1',
  attackRecall: '공격 Recall (공격 탐지율)',
  fpr: 'FPR (오탐률)',
}

export const METRIC_SHORT: Record<MetricKind, string> = {
  accuracy: '정확도',
  macroF1: 'Macro F1',
  attackRecall: '공격 Recall',
  fpr: '오탐률',
}

export const TRI_LABEL: Record<TriAnswer, string> = { yes: '예', no: '아니오', unknown: '모름' }

export const SPLIT_LABEL: Record<SplitAnswer, string> = {
  random: '무작위',
  unseen: '학습에 없던 공격을 따로 시험',
  other: '다른 방식',
  unknown: '모름',
}

export const NOT_COMPUTABLE = '계산할 수 없음'

/**
 * 비율은 소수 넷째 자리까지 보인다. 0이 아닌 아주 작은 값을 0으로 보이게 하지 않는다 —
 * 0과 "거의 0"은 운영에서 다른 이야기다.
 */
export function formatRatio(v: number): string {
  const rounded = Number(v.toFixed(4))
  if (rounded === 0 && v > 0) return '0.0001 미만'
  return String(rounded)
}

export function formatCount(n: number): string {
  return n.toLocaleString('ko-KR')
}

export function formatComputed(c: Computed): string {
  return c.kind === 'value' ? formatRatio(c.value) : NOT_COMPUTABLE
}
