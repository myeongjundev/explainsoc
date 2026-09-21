import type { ConfusionMatrix } from './types'

/**
 * 입력 하나를 읽은 결과. 빈 칸은 오류가 아니다 — 모르는 것도 이 앱에서는 중요한 답이다.
 * 잘못 적은 값은 0으로 바꾸지 않고 계산에서 뺀다.
 */
export type Parsed<T> =
  | { kind: 'empty' }
  | { kind: 'ok'; value: T }
  | { kind: 'error'; message: string }

export const MESSAGES = {
  ratioNotNumber: '0부터 1 사이의 숫자로 적어 주세요',
  ratioNegative: '비율은 0보다 작을 수 없습니다',
  ratioAboveOne: '비율은 0부터 1 사이로 적어 주세요. 99%는 0.99입니다',
  ratioNotFinite: 'Infinity나 NaN 대신 0부터 1 사이의 일반 숫자로 적어 주세요',
  countInvalid: '0 이상의 정수로 적어 주세요',
  countTooLarge: '지원 범위보다 큰 값입니다',
  matrixEmpty: '평가한 항목이 없어 지표를 계산할 수 없습니다',
  metricKindMissing: '먼저 지표 이름을 골라 주세요',
} as const

const DECIMAL = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/
const NON_FINITE = /^[+-]?(infinity|nan)$/i

/** 0부터 1 사이의 비율. 1과 0은 들어간다. */
export function parseRatio(raw: string): Parsed<number> {
  const text = raw.trim()
  if (text === '') return { kind: 'empty' }
  if (NON_FINITE.test(text)) return { kind: 'error', message: MESSAGES.ratioNotFinite }
  // "99%"처럼 백분율로 적은 사람에게는 0.99로 적으라고 바로 알려 준다.
  if (text.endsWith('%')) return { kind: 'error', message: MESSAGES.ratioAboveOne }
  if (!DECIMAL.test(text)) return { kind: 'error', message: MESSAGES.ratioNotNumber }
  const v = Number(text)
  if (!Number.isFinite(v)) return { kind: 'error', message: MESSAGES.ratioNotFinite }
  if (v < 0) return { kind: 'error', message: MESSAGES.ratioNegative }
  if (v > 1) return { kind: 'error', message: MESSAGES.ratioAboveOne }
  return { kind: 'ok', value: v === 0 ? 0 : v }
}

const PLAIN_INT = /^\d+$/
const GROUPED_INT = /^\d{1,3}(,\d{3})+$/

/** 혼동행렬 한 칸. 0 이상의 정수이고, 붙여넣은 천 단위 쉼표는 읽어 준다. */
export function parseCount(raw: string): Parsed<number> {
  const text = raw.trim()
  if (text === '') return { kind: 'empty' }
  if (!PLAIN_INT.test(text) && !GROUPED_INT.test(text)) {
    return { kind: 'error', message: MESSAGES.countInvalid }
  }
  const digits = text.replaceAll(',', '')
  const v = Number(digits)
  if (!Number.isSafeInteger(v)) return { kind: 'error', message: MESSAGES.countTooLarge }
  return { kind: 'ok', value: v }
}

export type MatrixField = 'tn' | 'fp' | 'fn' | 'tp'
export const MATRIX_FIELDS: readonly MatrixField[] = ['tn', 'fp', 'fn', 'tp']

export type MatrixRaw = Record<MatrixField, string>
export type MatrixParsedFields = Record<MatrixField, Parsed<number>>

export type MatrixParse =
  | { kind: 'incomplete'; fields: MatrixParsedFields }
  | { kind: 'invalid'; fields: MatrixParsedFields }
  | { kind: 'zero'; fields: MatrixParsedFields; message: string }
  | { kind: 'ok'; fields: MatrixParsedFields; matrix: ConfusionMatrix }

/**
 * 네 칸을 함께 읽는다. 한 칸이라도 비었거나 잘못됐으면 계산을 시작하지 않지만,
 * 그 사실이 다른 입력(지표, 평가 조건)의 판독을 막지는 않는다.
 */
export function parseMatrix(raw: MatrixRaw): MatrixParse {
  const fields = {
    tn: parseCount(raw.tn),
    fp: parseCount(raw.fp),
    fn: parseCount(raw.fn),
    tp: parseCount(raw.tp),
  }
  const all = MATRIX_FIELDS.map((f) => fields[f])
  if (all.some((p) => p.kind === 'error')) return { kind: 'invalid', fields }
  if (all.some((p) => p.kind === 'empty')) return { kind: 'incomplete', fields }
  const [tn, fp, fn, tp] = all.map((p) => (p as { kind: 'ok'; value: number }).value)
  if (tn + fp + fn + tp === 0) return { kind: 'zero', fields, message: MESSAGES.matrixEmpty }
  return { kind: 'ok', fields, matrix: { tn, fp, fn, tp } }
}
