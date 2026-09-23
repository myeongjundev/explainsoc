/**
 * V9 결론 카드 — 결과 맨 위에서 "그래서 뭐?"에 쉬운 말로 답한다(설계 31절).
 *
 * - AI 제품을 좋다·나쁘다로 판정하지 않는다. 광고 숫자만으로 믿을 근거가 있는지(시험 조건)와,
 *   받은 숫자가 말하는 사실을 "100건으로 치면"으로 옮겨 보일 뿐이다. 점수·등급·합격선은 없다.
 * - 판독 규칙 R01~R14를 바꾸지 않는다. 같은 입력과 같은 판독 결과만 읽는다.
 */

import { XGB_RANDOM, XGB_UNSEEN } from '../data/paperEvidence'
import { formatCount } from './format'
import type { Review } from './review'
import type { ReviewInput } from './types'

/**
 * - early: 처음 보는 공격으로 시험했다는 근거가 없다 — 광고 숫자만으로는 믿기 이르다
 * - partial: 처음 보는 공격으로 시험했지만 공격을 몇 건 잡는지 알려 주는 숫자가 없다
 * - shown: 처음 보는 공격으로 시험했고, 공격을 잡은 비율을 알 수 있다 — 숫자를 직접 보고 판단한다
 */
export type ConclusionTone = 'early' | 'partial' | 'shown'

export interface Conclusion {
  tone: ConclusionTone
  headline: string
  /** "왜?" — 시험 조건 한 줄과 숫자 한 줄 */
  reasons: string[]
  /** "그래서?" */
  next: string
}

const score = (v: number) => `${(v * 100).toFixed(1)}점`

/** 100건으로 치면 몇 건인지. 1건보다 적으면 소수 둘째 자리까지 보여 0으로 뭉개지 않는다. */
export function per100(part: number, whole: number): string {
  const v = (part / whole) * 100
  if (v === 0) return '0건'
  if (v < 0.01) return '0.01건 미만'
  if (v < 1) return `약 ${Number(v.toFixed(2))}건`
  return `약 ${Number(v.toFixed(1))}건`
}

function conditionReason(input: ReviewInput): { tested: boolean; text: string } {
  const split = input.split ?? 'unknown'
  const unseen = input.unseenIncluded ?? 'unknown'
  if (split === 'unseen' && unseen === 'no') {
    return { tested: false, text: '시험 조건의 두 답이 서로 다릅니다. 처음 보는 공격으로 시험했는지 먼저 확인해야 합니다.' }
  }
  if (split === 'unseen' || unseen === 'yes') {
    return { tested: true, text: 'AI가 학습 때 보지 못한 종류의 공격으로 따로 시험한 숫자입니다. 처음 보는 공격을 잡는지 볼 수 있는 시험입니다.' }
  }
  if (split === 'random') {
    return {
      tested: false,
      text: `이 숫자는 AI가 이미 배운 종류의 공격으로 치른 시험에서 나왔습니다. 논문에서 같은 AI가 처음 보는 공격을 만나자 ${score(XGB_RANDOM.reported.macroF1)}이 ${score(XGB_UNSEEN.reported.macroF1)}이 됐습니다.`,
    }
  }
  return { tested: false, text: '어떤 공격으로 시험한 숫자인지 알 수 없습니다. 처음 보는 공격도 잡는지는 아직 모릅니다.' }
}

function numberReason(input: ReviewInput): { recallKnown: boolean; text: string } {
  const m = input.matrix
  if (m && m.tp + m.fn > 0) {
    const attacks = m.tp + m.fn
    const normals = m.tn + m.fp
    const caught = `공격 ${formatCount(attacks)}건 중 ${formatCount(m.tp)}건을 잡았습니다(100건으로 치면 ${per100(m.tp, attacks)})`
    const alarms = normals > 0 ? ` 정상 ${formatCount(normals)}건 중 ${formatCount(m.fp)}건은 공격으로 잘못 알렸습니다.` : ''
    return { recallKnown: true, text: `받은 표(맞히고 틀린 개수)를 보면, ${caught}.${alarms}` }
  }
  const recall = input.claim.attackRecall
  if (recall !== undefined) {
    return { recallKnown: true, text: `공격을 잡는 비율(공격 Recall)이 ${recall}입니다. 공격 100건으로 치면 약 ${Number((recall * 100).toFixed(2))}건을 잡는다는 뜻입니다.` }
  }
  if (Object.keys(input.claim).length > 0) {
    return { recallKnown: false, text: '공격을 몇 건이나 잡는지 알려 주는 숫자가 없습니다. 정확도나 오탐률만으로는 알 수 없습니다.' }
  }
  return { recallKnown: false, text: '받은 성능 숫자가 없습니다.' }
}

export function buildConclusion(input: ReviewInput, review: Review): Conclusion {
  const condition = conditionReason(input)
  const numbers = numberReason(input)
  const tone: ConclusionTone = !condition.tested ? 'early' : numbers.recallKnown ? 'shown' : 'partial'
  const headline = {
    early: '광고 숫자만으로는 아직 믿기 이릅니다',
    partial: '처음 보는 공격으로 시험했지만, 공격을 몇 건 잡는지는 아직 모릅니다',
    shown: '처음 보는 공격으로 시험한 숫자가 있습니다. 아래 숫자를 직접 보고 판단하세요',
  }[tone]
  const count = review.questions.length
  const next = count > 0
    ? `판매 업체에 아래 질문 ${count}개를 하세요. 답을 받으면 이 결론도 바뀝니다.`
    : '지금 입력에서 더 물을 질문은 없습니다. 받은 자료가 같은 시험에서 나왔는지만 확인하세요.'
  return { tone, headline, reasons: [condition.text, numbers.text], next }
}
