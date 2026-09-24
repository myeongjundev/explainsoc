import { EXAMPLE_A, EXAMPLE_B } from '../../src/data/examples'
import { buildConclusion, per100 } from '../../src/domain/conclusion'
import { checkForm, emptyForm, formFromExample } from '../../src/domain/form'
import { buildReview } from '../../src/domain/review'
import type { ReviewInput } from '../../src/domain/types'

const conclude = (input: ReviewInput) => buildConclusion(input, buildReview(input))
const inputOf = (form = emptyForm()) => checkForm(form).input

describe('결론 카드 — 판정이 아니라 믿을 근거와 숫자의 뜻', () => {
  it('무작위로 나눈 시험이면 믿기 이르다고 하고 논문의 99.8점 → 38.7점을 든다 (논문 예시 B)', () => {
    const c = conclude(inputOf(formFromExample(EXAMPLE_B)))
    expect(c.tone).toBe('early')
    expect(c.headline).toBe('광고 숫자만으로는 아직 믿기 이릅니다')
    expect(c.reasons[0]).toContain('이미 배운 종류의 공격')
    expect(c.reasons[0]).toContain('99.8점이 38.7점')
    expect(c.reasons[1]).toContain('공격 85,175건 중 84,955건')
  })

  it('처음 보는 공격으로 시험했고 표가 있으면 숫자를 100건으로 옮겨 보인다 (논문 예시 A)', () => {
    const c = conclude(inputOf(formFromExample(EXAMPLE_A)))
    expect(c.tone).toBe('shown')
    expect(c.reasons[1]).toContain('공격 220,788건 중 160건을 잡았습니다(100건으로 치면 약 0.07건)')
    expect(c.reasons[1]).toContain('정상 375,518건 중 86건')
  })

  it('처음 보는 공격으로 시험했지만 공격을 잡는 숫자가 없으면 그 숫자가 빠졌다고 한다', () => {
    const form = { ...emptyForm(), metricRows: [{ id: 'x', kind: 'accuracy' as const, raw: '0.99' }], split: 'unseen' as const, unseenIncluded: 'yes' as const }
    const c = conclude(inputOf(form))
    expect(c.tone).toBe('partial')
    expect(c.reasons[1]).toContain('공격을 몇 건이나 잡는지 알려 주는 숫자가 없습니다')
  })

  it('아무것도 모르면 어떤 시험인지 알 수 없다고 하고, 질문 수를 그래서?에 담는다', () => {
    const c = conclude(inputOf())
    expect(c.tone).toBe('early')
    expect(c.reasons).toEqual(['어떤 공격으로 시험한 숫자인지 알 수 없습니다. 처음 보는 공격도 잡는지는 아직 모릅니다.', '받은 성능 숫자가 없습니다.'])
    expect(c.next).toBe('판매 업체에 아래 질문 3개를 하세요. 답을 받으면 이 결론도 바뀝니다.')
  })

  it('두 조건 답이 어긋나면 처음 보는 공격으로 시험했다고 보지 않는다', () => {
    const form = { ...emptyForm(), split: 'unseen' as const, unseenIncluded: 'no' as const }
    expect(conclude(inputOf(form)).tone).toBe('early')
  })

  it('믿기 이르면 논문의 두 시험 막대를, 받은 숫자가 있으면 그 숫자 막대를 그린다', () => {
    const early = conclude(inputOf(formFromExample(EXAMPLE_B))).figure
    expect(early?.title).toBe('논문에서 같은 AI, 두 번의 시험')
    expect(early?.bars.map((b) => b.display)).toEqual(['99.8점', '38.7점'])
    expect(early?.caption).toContain('입력한 제품의 점수가 아닙니다')
    const shown = conclude(inputOf(formFromExample(EXAMPLE_A))).figure
    expect(shown?.bars.map((b) => b.display)).toEqual(['약 0.07건'])
    const partial = { ...emptyForm(), metricRows: [{ id: 'x', kind: 'accuracy' as const, raw: '0.99' }], split: 'unseen' as const, unseenIncluded: 'yes' as const }
    expect(conclude(inputOf(partial)).figure).toBeNull()
  })

  it('100건으로 옮길 때 아주 작은 값을 0으로 뭉개지 않는다', () => {
    expect(per100(160, 220_788)).toBe('약 0.07건')
    expect(per100(1, 1_000_000)).toBe('0.01건 미만')
    expect(per100(0, 10)).toBe('0건')
    expect(per100(84_955, 85_175)).toBe('약 99.7건')
  })
})
