import { applyBrochure, EMPTY_PATCH, MAX_BROCHURE_CHARS, readBrochure } from '../../src/domain/brochure'
import { EXAMPLE_BROCHURE } from '../../src/data/examples'
import { checkForm, emptyForm } from '../../src/domain/form'
import { buildReview } from '../../src/domain/review'

const kinds = (text: string) => readBrochure(text).marks.map((m) => m.kind)

describe('소개서에서 지표를 읽는다', () => {
  it('백분율과 소수를 0부터 1 사이 비율로 읽는다', () => {
    const { patch } = readBrochure('정확도 99.8%, 오탐률은 0.02%, Recall: 0.95')
    expect(patch.metrics).toEqual([
      { kind: 'accuracy', raw: '0.998' },
      { kind: 'fpr', raw: '0.0002' },
      { kind: 'attackRecall', raw: '0.95' },
    ])
  })

  it('숫자가 지표 이름 앞에 와도 읽는다', () => {
    const { patch } = readBrochure('99.9%의 탐지율과 0.1% 오탐률을 보였습니다.')
    expect(patch.metrics).toEqual([
      { kind: 'attackRecall', raw: '0.999' },
      { kind: 'fpr', raw: '0.001' },
    ])
  })

  it('개수·순위·100 넘는 수는 비율로 읽지 않는다', () => {
    expect(readBrochure('오탐 86건, 탐지율 1위, 정확도 250').patch.metrics).toEqual([])
  })

  it('천 단위 쉼표가 있는 수의 일부를 떼어 읽지 않는다', () => {
    expect(readBrochure('오탐 220,788').patch.metrics).toEqual([])
  })

  it('백분율 기호 없이 1보다 큰 수는 백분율로 읽고 그 가정을 남긴다', () => {
    const { marks, patch } = readBrochure('정확도 99.5를 기록')
    expect(patch.metrics).toEqual([{ kind: 'accuracy', raw: '0.995' }])
    expect(marks[0].assumed).toBe('percentWithoutSign')
  })

  it('F1은 Macro F1로 읽되 그 가정을 남기고, Macro F1은 그대로 읽는다', () => {
    expect(readBrochure('F1 0.97').marks[0]).toMatchObject({ metric: 'macroF1', assumed: 'f1AsMacro' })
    expect(readBrochure('Macro F1 0.97').marks[0]).toMatchObject({ metric: 'macroF1', assumed: undefined })
  })

  it('같은 지표가 두 번 나오면 처음 값을 쓰고 뒤의 것은 반복으로 표시한다', () => {
    const { marks, patch } = readBrochure('정확도 99%. 정확도 95%.')
    expect(patch.metrics).toEqual([{ kind: 'accuracy', raw: '0.99' }])
    expect(marks.map((m) => m.repeated ?? false)).toEqual([false, true])
  })
})

describe('소개서에서 주장과 시험 조건을 가린다', () => {
  it('최고 성능 주장을 읽는다', () => {
    expect(readBrochure('업계 최고 성능을 입증했습니다').patch.claimedBest).toBe('yes')
  })

  it('신종 공격을 잡는다는 능력 주장은 시험 조건 답으로 바꾸지 않는다', () => {
    const { marks, patch } = readBrochure('알려지지 않은 신종 공격까지 탐지합니다')
    expect(marks.map((m) => m.kind)).toEqual(['unseenClaim'])
    expect(patch.unseenIncluded).toBeNull()
    expect(patch.split).toBeNull()
  })

  it('학습에 없던 공격으로 따로 시험했다는 문장은 시험 조건으로 읽는다', () => {
    const { patch } = readBrochure('학습에 없던 공격으로 따로 시험했습니다')
    expect(patch.split).toBe('unseen')
    expect(patch.unseenIncluded).toBe('yes')
  })

  it('무작위·교차 검증은 무작위 분할, 날짜 기준은 다른 방식으로 읽는다', () => {
    expect(readBrochure('5-fold 교차 검증으로 평가').patch.split).toBe('random')
    expect(readBrochure('날짜 기준으로 나눠 평가').patch.split).toBe('other')
  })

  it('랜덤 포레스트라는 모델 이름을 분할 방식으로 읽지 않는다', () => {
    expect(readBrochure('랜덤 포레스트 모델을 썼습니다').patch.split).toBeNull()
  })

  it('중복 제거를 읽고, 하지 않았다는 문장은 아니오로 읽는다', () => {
    expect(readBrochure('중복을 제거한 데이터로 평가').patch.deduplicated).toBe('yes')
    expect(readBrochure('중복 제거하지 않은 원본으로 평가').patch.deduplicated).toBe('no')
  })

  it('설명 가능한 AI·XAI·SHAP·탐지 근거 제시를 설명 주장으로 읽는다', () => {
    for (const text of ['설명 가능한 AI로 만들었습니다', 'XAI 대시보드', 'SHAP 값을 보여 줍니다', '탐지 근거를 제시합니다']) {
      expect(readBrochure(text).patch.claimedExplanation, text).toBe('yes')
    }
    expect(readBrochure('XAIR 장비').patch.claimedExplanation).toBeNull()
  })

  it('판독할 표현이 없으면 아무것도 읽지 않는다', () => {
    expect(readBrochure('보안 운영을 더 쉽게 만드는 솔루션입니다.')).toEqual({ marks: [], patch: EMPTY_PATCH })
  })

  it('표시는 원문 위치를 가리키고 서로 겹치지 않는다', () => {
    const text = EXAMPLE_BROCHURE.text
    const { marks } = readBrochure(text)
    marks.forEach((m) => expect(text.slice(m.start, m.end)).toBe(m.text))
    marks.slice(1).forEach((m, i) => expect(m.start).toBeGreaterThanOrEqual(marks[i].end))
  })

  it(`${MAX_BROCHURE_CHARS.toLocaleString()}자를 넘는 부분은 읽지 않는다`, () => {
    const text = `${'가'.repeat(MAX_BROCHURE_CHARS)} 정확도 99%`
    expect(readBrochure(text).marks).toEqual([])
  })
})

describe('예시 소개서 — 논문의 무작위 분할 숫자를 빌린 가상의 문장', () => {
  it('정확도·오탐률, 무작위 분할, 신종 공격 주장, 최고 성능, 설명 가능 AI 주장을 읽는다', () => {
    const { marks, patch } = readBrochure(EXAMPLE_BROCHURE.text)
    expect(kinds(EXAMPLE_BROCHURE.text)).toEqual(['metric', 'metric', 'split', 'unseenClaim', 'best', 'xaiClaim'])
    expect(marks.filter((m) => m.kind === 'metric').map((m) => m.metric)).toEqual(['accuracy', 'fpr'])
    expect(patch).toMatchObject({ claimedBest: 'yes', split: 'random', unseenIncluded: null, deduplicated: null, claimedExplanation: 'yes' })
  })

  it('판독 규칙에 넣으면 무작위 분할·신종 공격·최고 성능·중복·설명 주장 질문이 나온다', () => {
    const form = applyBrochure(emptyForm(), EMPTY_PATCH, readBrochure(EXAMPLE_BROCHURE.text).patch)
    const ids = buildReview(checkForm(form).input).findings.map((f) => f.ruleId).sort()
    expect(ids).toEqual(['R01', 'R03', 'R04', 'R05', 'R07', 'R09', 'R15'])
  })
})

describe('소개서를 고쳐도 직접 답한 조건은 지우지 않는다', () => {
  it('소개서에서 온 값은 문장이 사라지면 비우고, 직접 답한 값은 남긴다', () => {
    const first = readBrochure('정확도 99%, 무작위 분할').patch
    let form = applyBrochure(emptyForm(), EMPTY_PATCH, first)
    expect(form.split).toBe('random')
    form = { ...form, deduplicated: 'yes' } // 사용자가 한 화면씩 입력에서 직접 답했다
    const second = readBrochure('오탐률 0.1%').patch
    form = applyBrochure(form, first, second)
    expect(form.split).toBeNull()
    expect(form.deduplicated).toBe('yes')
    expect(form.metricRows.map((r) => [r.kind, r.raw])).toEqual([['fpr', '0.001']])
  })

  it('소개서의 지표가 모두 사라지면 빈 지표 줄 하나로 돌아간다', () => {
    const first = readBrochure('정확도 99%').patch
    const form = applyBrochure(applyBrochure(emptyForm(), EMPTY_PATCH, first), first, EMPTY_PATCH)
    expect(form.metricRows.map((r) => [r.kind, r.raw])).toEqual([['', '']])
  })
})
