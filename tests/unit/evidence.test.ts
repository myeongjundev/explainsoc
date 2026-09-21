// @vitest-environment node
import {
  EVIDENCE,
  PAPER,
  TEST_ATTACKS,
  TRAIN_ATTACKS,
  UNSEEN_TEST_COMPOSITION,
  XGB_RANDOM,
  XGB_UNSEEN,
} from '../../src/data/paperEvidence'

describe('논문 근거 데이터', () => {
  it('P01~P10이 모두 있다', () => {
    expect(Object.keys(EVIDENCE)).toEqual(['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10'])
  })

  it('원문이 없는 근거(P09·P10)는 무엇을 계산하거나 가져왔는지 설명한다', () => {
    for (const e of Object.values(EVIDENCE)) {
      if (e.quotes.length === 0) expect(e.note, e.id).toBeTruthy()
    }
  })

  it('데이터셋 인용은 DOI로 논문을 가리키고 저자 실명을 담지 않는다 (BRB-C12)', () => {
    expect(PAPER.datasetCitation).toContain('doi: 10.5220/0006639801080116')
    // "I. Sharafaldin", "A. H. Lashkari"처럼 이니셜 뒤에 성이 오는 표기가 없어야 한다
    expect(PAPER.datasetCitation).not.toMatch(/\b[A-Z]\.(\s?[A-Z]\.)*\s[A-Z][a-z]+/)
  })

  it('분할 그림의 공격은 학습 9종, 시험 3종이고 겹치지 않는다 (P01)', () => {
    expect(TRAIN_ATTACKS).toHaveLength(9)
    expect(TEST_ATTACKS).toHaveLength(3)
    const train = new Set<string>(TRAIN_ATTACKS)
    expect(TEST_ATTACKS.filter((a) => train.has(a))).toEqual([])
  })

  it('분할 그림의 공격 이름이 원고 IV-3 원문과 같다', () => {
    const quote = EVIDENCE.P01.quotes[0]
    for (const a of [...TRAIN_ATTACKS, ...TEST_ATTACKS]) expect(quote).toContain(a)
  })

  it('무작위 XGBoost 원수치가 원고 V-2 문장의 개수와 같다 (P03·P09)', () => {
    const { tn, fp, fn, tp } = XGB_RANDOM.matrix
    const quote = EVIDENCE.P03.quotes[0]
    expect((tp + fn).toLocaleString('en-US')).toBe('85,175')
    expect(tp.toLocaleString('en-US')).toBe('84,955')
    expect((tn + fp).toLocaleString('en-US')).toBe('419,296')
    expect(fp).toBe(362)
    for (const n of ['85,175', '84,955', '419,296', '362']) expect(quote).toContain(n)
  })

  it('미관측 공격 XGBoost 원수치가 원고의 220,788건 중 160건과 같다', () => {
    const { fn, tp } = XGB_UNSEEN.matrix
    expect(tp).toBe(160)
    expect(fn + tp).toBe(UNSEEN_TEST_COMPOSITION.attack)
    expect(EVIDENCE.P03.quotes[0]).toContain('220,788건 중 160건')
  })

  it('화면용 분할 이름은 원고 용어를 쓴다', () => {
    expect(XGB_UNSEEN.splitLabel).toBe('미관측 공격 스트레스 테스트')
  })
})
