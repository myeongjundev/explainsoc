// @vitest-environment node
import { caseFileToText, combineRoundInput, makeCaseFile, MAX_CASE_FILE_BYTES, parseCaseFileText, resolveRoundInputs, type CaseRound } from '../../src/domain/caseFile'
import type { ReviewInput } from '../../src/domain/types'

const base: ReviewInput = {
  claim: { fpr: 0.001 },
  matrix: null,
  claimedBest: 'no',
  split: 'unseen',
  unseenIncluded: 'yes',
  deduplicated: 'yes',
  source: 'user',
}

const round: CaseRound = {
  id: 'r1',
  label: '1회차',
  sourceKind: 'proposal',
  sourceNote: '<b>문자열 그대로</b>',
  sameTrial: null,
  input: base,
  responses: {},
}

describe('ExplainSOC 로컬 사례 파일', () => {
  it('내려받은 파일을 손실 없이 다시 연다', () => {
    const file = makeCaseFile('침입 탐지 PoC', [round])
    const parsed = parseCaseFileText(caseFileToText(file))
    expect(parsed).toEqual({ kind: 'ok', value: file })
    if (parsed.kind === 'ok') expect(parsed.value.rounds[0].sourceNote).toBe('<b>문자열 그대로</b>')
  })

  it('알 수 없는 키, 잘못된 행렬, 과대 파일을 거부한다', () => {
    const file = makeCaseFile('검토', [round])
    expect(parseCaseFileText(JSON.stringify({ ...file, surprise: true })).kind).toBe('error')
    const invalid = structuredClone(file)
    invalid.rounds[0].input.matrix = { tn: 0, fp: 0, fn: 0, tp: 0 }
    expect(parseCaseFileText(JSON.stringify(invalid)).kind).toBe('error')
    expect(parseCaseFileText(' '.repeat(MAX_CASE_FILE_BYTES + 1)).kind).toBe('error')
  })

  it('같은 시험일 때만 이전 근거를 합치고, 모름은 임시로 합친다', () => {
    const received: ReviewInput = { ...base, claim: { attackRecall: 0.8 }, split: null, unseenIncluded: null, deduplicated: null }
    expect(combineRoundInput(base, received, 'yes').claim).toEqual({ fpr: 0.001, attackRecall: 0.8 })
    expect(combineRoundInput(base, received, 'unknown').claim).toEqual({ fpr: 0.001, attackRecall: 0.8 })
    expect(combineRoundInput(base, received, 'no').claim).toEqual({ attackRecall: 0.8 })
  })

  it('파일에는 회차별 원자료를 두고 표시할 때만 순서대로 합친다', () => {
    const received: ReviewInput = { ...base, claim: { attackRecall: 0.8 }, split: null, unseenIncluded: null, deduplicated: null }
    const rounds: CaseRound[] = [
      round,
      { ...round, id: 'r2', label: '2회차', sameTrial: 'yes', input: received },
    ]
    expect(rounds[1].input.claim).toEqual({ attackRecall: 0.8 })
    expect(resolveRoundInputs(rounds)?.claim).toEqual({ fpr: 0.001, attackRecall: 0.8 })
    rounds[1] = { ...rounds[1], sameTrial: 'no' }
    expect(resolveRoundInputs(rounds)?.claim).toEqual({ attackRecall: 0.8 })
  })
})
