// @vitest-environment node
import { MESSAGES, parseCount, parseMatrix, parseRatio } from '../../src/domain/validation'

describe('비율 입력 (설계 10절)', () => {
  it('빈 칸은 오류가 아니라 정보 없음이다', () => {
    expect(parseRatio('')).toEqual({ kind: 'empty' })
    expect(parseRatio('   ')).toEqual({ kind: 'empty' })
  })

  it('0부터 1 사이 숫자를 읽는다 — 경계 포함', () => {
    expect(parseRatio('0.99')).toEqual({ kind: 'ok', value: 0.99 })
    expect(parseRatio(' .5 ')).toEqual({ kind: 'ok', value: 0.5 })
    expect(parseRatio('0')).toEqual({ kind: 'ok', value: 0 })
    expect(parseRatio('1')).toEqual({ kind: 'ok', value: 1 })
    expect(parseRatio('2e-4')).toEqual({ kind: 'ok', value: 0.0002 })
  })

  it('숫자가 아닌 글자는 계산에서 뺀다', () => {
    for (const bad of ['abc', '0.9a', '0x1', '1,5', '영점구']) {
      expect(parseRatio(bad)).toEqual({ kind: 'error', message: MESSAGES.ratioNotNumber })
    }
  })

  it('음수는 계산에서 뺀다', () => {
    expect(parseRatio('-0.1')).toEqual({ kind: 'error', message: MESSAGES.ratioNegative })
  })

  it('1을 넘고 100 이하면 적은 값을 백분율로 보고 바꿀 값을 알려 준다', () => {
    expect(parseRatio('99')).toEqual({ kind: 'error', message: '비율은 0부터 1 사이로 적어 주세요. 99%라면 0.99로 적습니다' })
    expect(parseRatio('99.8%')).toEqual({ kind: 'error', message: '비율은 0부터 1 사이로 적어 주세요. 99.8%라면 0.998로 적습니다' })
    expect(parseRatio('100')).toEqual({ kind: 'error', message: '비율은 0부터 1 사이로 적어 주세요. 100%라면 1로 적습니다' })
  })

  it('100을 넘거나 백분율 숫자를 읽을 수 없으면 일반 안내를 한다', () => {
    expect(parseRatio('250')).toEqual({ kind: 'error', message: MESSAGES.ratioAboveOne })
    expect(parseRatio('abc%')).toEqual({ kind: 'error', message: MESSAGES.ratioAboveOne })
    expect(MESSAGES.ratioAboveOne).toContain('99%는 0.99입니다')
  })

  it('NaN과 Infinity는 일반 숫자로 적으라고 안내한다', () => {
    for (const bad of ['NaN', 'Infinity', '-infinity', '1e999']) {
      expect(parseRatio(bad)).toEqual({ kind: 'error', message: MESSAGES.ratioNotFinite })
    }
  })
})

describe('혼동행렬 한 칸 (설계 10절)', () => {
  it('0 이상의 정수를 읽는다', () => {
    expect(parseCount('0')).toEqual({ kind: 'ok', value: 0 })
    expect(parseCount('375432')).toEqual({ kind: 'ok', value: 375_432 })
  })

  it('붙여넣은 천 단위 쉼표와 양끝 공백을 안전하게 뺀다', () => {
    expect(parseCount(' 375,432 ')).toEqual({ kind: 'ok', value: 375_432 })
    expect(parseCount('1,234,567')).toEqual({ kind: 'ok', value: 1_234_567 })
  })

  it('쉼표 자리가 이상하면 추측하지 않는다', () => {
    for (const bad of ['1,2,3', '12,34', ',123']) {
      expect(parseCount(bad)).toEqual({ kind: 'error', message: MESSAGES.countInvalid })
    }
  })

  it('글자·소수·음수는 0 이상의 정수로 적으라고 한다', () => {
    for (const bad of ['abc', '86.0', '0.5', '-1', '1e3', '１２']) {
      expect(parseCount(bad)).toEqual({ kind: 'error', message: MESSAGES.countInvalid })
    }
  })

  it('안전 정수를 넘으면 지원 범위보다 크다고 한다', () => {
    expect(parseCount('9007199254740991')).toEqual({ kind: 'ok', value: Number.MAX_SAFE_INTEGER })
    expect(parseCount('9007199254740993')).toEqual({ kind: 'error', message: MESSAGES.countTooLarge })
    expect(parseCount('9'.repeat(40))).toEqual({ kind: 'error', message: MESSAGES.countTooLarge })
  })
})

describe('혼동행렬 네 칸', () => {
  const full = { tn: '375432', fp: '86', fn: '220628', tp: '160' }

  it('모두 유효하면 행렬을 만든다', () => {
    const r = parseMatrix(full)
    expect(r.kind).toBe('ok')
    if (r.kind === 'ok') expect(r.matrix).toEqual({ tn: 375_432, fp: 86, fn: 220_628, tp: 160 })
  })

  it('한 칸이 비면 계산을 시작하지 않는다 — 그 칸만 정보 없음', () => {
    const r = parseMatrix({ ...full, fp: '' })
    expect(r.kind).toBe('incomplete')
    expect(r.fields.fp).toEqual({ kind: 'empty' })
    expect(r.fields.tn.kind).toBe('ok')
  })

  it('한 칸이 잘못되면 계산을 시작하지 않는다', () => {
    expect(parseMatrix({ ...full, tp: '-3' }).kind).toBe('invalid')
    expect(parseMatrix({ ...full, fn: 'abc' }).kind).toBe('invalid')
  })

  it('네 칸의 합이 0이면 평가한 항목이 없다고 한다', () => {
    const r = parseMatrix({ tn: '0', fp: '0', fn: '0', tp: '0' })
    expect(r).toMatchObject({ kind: 'zero', message: MESSAGES.matrixEmpty })
  })
})
