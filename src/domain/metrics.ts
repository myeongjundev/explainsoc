import type { ConfusionMatrix } from './types'

/**
 * 계산 결과. 분모가 0이면 0을 만들지 않고 계산할 수 없다는 이유를 남긴다.
 * 0은 "모델이 하나도 못 잡았다"는 뜻이 될 수 있어서, 계산이 안 되는 것과 섞으면 안 된다.
 */
export type Computed = { kind: 'value'; value: number } | { kind: 'na'; reason: string }

export interface MatrixMetrics {
  total: number
  attacks: number
  normals: number
  accuracy: Computed
  attackRecall: Computed
  normalRecall: Computed
  fpr: Computed
  attackPrecision: Computed
  normalPrecision: Computed
  attackF1: Computed
  normalF1: Computed
  macroF1: Computed
  /** 모든 흐름을 정상으로만 예측했을 때의 정확도. 판정 기준이 아니라 정확도를 읽기 위한 비교다. */
  alwaysNormalAccuracy: Computed
}

const value = (v: number): Computed => ({ kind: 'value', value: v })
const na = (reason: string): Computed => ({ kind: 'na', reason })

function ratio(numerator: number, denominator: number, reason: string): Computed {
  return denominator === 0 ? na(reason) : value(numerator / denominator)
}

function f1(precision: Computed, recall: Computed, reason: string): Computed {
  if (precision.kind === 'na') return precision
  if (recall.kind === 'na') return recall
  const sum = precision.value + recall.value
  return sum === 0 ? na(reason) : value((2 * precision.value * recall.value) / sum)
}

/** 원고 IV-4와 설계 9절의 식. 양성 클래스는 공격이다. */
export function computeMetrics({ tn, fp, fn, tp }: ConfusionMatrix): MatrixMetrics {
  const total = tn + fp + fn + tp
  const attacks = tp + fn
  const normals = tn + fp

  const noAttacks = '공격 표본이 없어 계산할 수 없습니다'
  const noNormals = '정상 표본이 없어 계산할 수 없습니다'

  const attackRecall = ratio(tp, attacks, noAttacks)
  const normalRecall = ratio(tn, normals, noNormals)
  const attackPrecision = ratio(tp, tp + fp, '공격이라고 예측한 흐름이 없어 계산할 수 없습니다')
  const normalPrecision = ratio(tn, tn + fn, '정상이라고 예측한 흐름이 없어 계산할 수 없습니다')
  const attackF1 = f1(attackPrecision, attackRecall, '공격 정밀도와 Recall이 모두 0이라 계산할 수 없습니다')
  const normalF1 = f1(normalPrecision, normalRecall, '정상 정밀도와 Recall이 모두 0이라 계산할 수 없습니다')

  let macroF1: Computed
  if (attackF1.kind === 'na') macroF1 = attackF1
  else if (normalF1.kind === 'na') macroF1 = normalF1
  else macroF1 = value((attackF1.value + normalF1.value) / 2)

  const empty = '평가한 항목이 없어 계산할 수 없습니다'

  return {
    total,
    attacks,
    normals,
    accuracy: ratio(tn + tp, total, empty),
    attackRecall,
    normalRecall,
    fpr: ratio(fp, fp + tn, noNormals),
    attackPrecision,
    normalPrecision,
    attackF1,
    normalF1,
    macroF1,
    alwaysNormalAccuracy: ratio(normals, total, empty),
  }
}

/** 화면에는 소수 넷째 자리까지 보인다. 테스트는 반올림 전 값을 본다. */
export function roundTo4(v: number): number {
  return Math.round(v * 10_000) / 10_000
}
