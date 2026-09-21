// @vitest-environment node
import { computeMetrics, roundTo4, type Computed } from '../../src/domain/metrics'
import { UNSEEN_TEST_COMPOSITION, XGB_RANDOM, XGB_UNSEEN } from '../../src/data/paperEvidence'

const v = (c: Computed): number => {
  if (c.kind !== 'value') throw new Error(`계산할 수 없음: ${c.reason}`)
  return c.value
}

describe('정확한 혼동행렬에서 원고 V-2의 반올림 값이 나온다', () => {
  it('무작위 XGBoost [[418934, 362], [220, 84955]]', () => {
    const m = computeMetrics(XGB_RANDOM.matrix)
    expect(roundTo4(v(m.accuracy))).toBe(0.9988)
    expect(roundTo4(v(m.macroF1))).toBe(0.9979)
    expect(roundTo4(v(m.attackRecall))).toBe(0.9974)
    expect(roundTo4(v(m.fpr))).toBe(0.0009)
    // 저장해 둔 원고 값과도 같아야 한다
    expect(roundTo4(v(m.accuracy))).toBe(XGB_RANDOM.reported.accuracy)
    expect(roundTo4(v(m.macroF1))).toBe(XGB_RANDOM.reported.macroF1)
    expect(roundTo4(v(m.attackRecall))).toBe(XGB_RANDOM.reported.attackRecall)
    expect(roundTo4(v(m.fpr))).toBe(XGB_RANDOM.reported.fpr)
  })

  it('미관측 공격 XGBoost [[375432, 86], [220628, 160]]', () => {
    const m = computeMetrics(XGB_UNSEEN.matrix)
    expect(roundTo4(v(m.accuracy))).toBe(0.6299)
    expect(roundTo4(v(m.macroF1))).toBe(0.3871)
    expect(roundTo4(v(m.attackRecall))).toBe(0.0007)
    expect(roundTo4(v(m.fpr))).toBe(0.0002)
    expect(roundTo4(v(m.accuracy))).toBe(XGB_UNSEEN.reported.accuracy)
    expect(roundTo4(v(m.macroF1))).toBe(XGB_UNSEEN.reported.macroF1)
    expect(roundTo4(v(m.attackRecall))).toBe(XGB_UNSEEN.reported.attackRecall)
    expect(roundTo4(v(m.fpr))).toBe(XGB_UNSEEN.reported.fpr)
  })

  it('반올림 전 값으로도 확인한다', () => {
    const m = computeMetrics(XGB_UNSEEN.matrix)
    expect(v(m.accuracy)).toBeCloseTo(375_592 / 596_306, 12)
    expect(v(m.attackRecall)).toBeCloseTo(160 / 220_788, 12)
    expect(v(m.fpr)).toBeCloseTo(86 / 375_518, 12)
  })
})

describe('항상 정상 기준선 (P10)', () => {
  it('미관측 공격 시험 구성에서 0.6297이 나온다', () => {
    const m = computeMetrics(XGB_UNSEEN.matrix)
    expect(roundTo4(v(m.alwaysNormalAccuracy))).toBe(0.6297)
    expect(roundTo4(UNSEEN_TEST_COMPOSITION.normal / UNSEEN_TEST_COMPOSITION.total)).toBe(0.6297)
  })

  it('혼동행렬 원수와 원고 IV-3의 시험 구성이 같다', () => {
    const { tn, fp, fn, tp } = XGB_UNSEEN.matrix
    expect(tn + fp).toBe(UNSEEN_TEST_COMPOSITION.normal)
    expect(fn + tp).toBe(UNSEEN_TEST_COMPOSITION.attack)
    expect(tn + fp + fn + tp).toBe(UNSEEN_TEST_COMPOSITION.total)
  })

  it('정확도가 기준선보다 높은 몫은 596,306건 가운데 74건(TP−FP)뿐이다', () => {
    const m = computeMetrics(XGB_UNSEEN.matrix)
    const { tp, fp } = XGB_UNSEEN.matrix
    expect(tp - fp).toBe(74)
    expect(v(m.accuracy) - v(m.alwaysNormalAccuracy)).toBeCloseTo(74 / 596_306, 12)
  })
})

describe('분모가 0이면 0을 만들지 않는다', () => {
  it('네 칸의 합이 0이면 정확도와 기준선을 계산할 수 없다', () => {
    const m = computeMetrics({ tn: 0, fp: 0, fn: 0, tp: 0 })
    expect(m.accuracy.kind).toBe('na')
    expect(m.alwaysNormalAccuracy.kind).toBe('na')
    expect(m.macroF1.kind).toBe('na')
  })

  it('공격 표본이 없으면(TP+FN=0) 공격 Recall을 계산할 수 없다', () => {
    const m = computeMetrics({ tn: 10, fp: 2, fn: 0, tp: 0 })
    expect(m.attackRecall).toEqual({ kind: 'na', reason: '공격 표본이 없어 계산할 수 없습니다' })
    expect(m.fpr.kind).toBe('value')
  })

  it('정상 표본이 없으면(FP+TN=0) FPR과 정상 Recall을 계산할 수 없다', () => {
    const m = computeMetrics({ tn: 0, fp: 0, fn: 3, tp: 7 })
    expect(m.fpr).toEqual({ kind: 'na', reason: '정상 표본이 없어 계산할 수 없습니다' })
    expect(m.normalRecall.kind).toBe('na')
    expect(v(m.attackRecall)).toBe(0.7)
  })

  it('공격이라고 예측한 흐름이 없으면 공격 정밀도와 F1을 계산할 수 없다', () => {
    const m = computeMetrics({ tn: 90, fp: 0, fn: 10, tp: 0 })
    expect(m.attackPrecision.kind).toBe('na')
    expect(m.attackF1.kind).toBe('na')
    expect(m.macroF1.kind).toBe('na')
  })

  it('계산할 수 있는 0은 0으로 둔다 — 공격을 하나도 못 잡은 것', () => {
    const m = computeMetrics({ tn: 80, fp: 5, fn: 15, tp: 0 })
    expect(m.attackRecall).toEqual({ kind: 'value', value: 0 })
  })
})
