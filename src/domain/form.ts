/**
 * 화면 폼 상태와, 그 상태를 판독 입력으로 바꾸는 일. 검증을 통과한 값만 넘기고
 * 잘못된 값은 그 칸의 오류로만 남긴다 — 한 칸의 실수가 전체 결과를 막지 않는다.
 */

import type { ExampleInput } from '../data/examples'
import { METRIC_KINDS, type InputSource, type MetricKind, type ReviewInput, type SplitAnswer, type TriAnswer } from './types'
import { MESSAGES, parseMatrix, parseRatio, type MatrixParse, type MatrixRaw, type Parsed } from './validation'

export interface MetricRow {
  id: string
  kind: MetricKind | ''
  raw: string
}

export interface FormState {
  metricRows: MetricRow[]
  matrixOpen: boolean
  matrix: MatrixRaw
  claimedBest: TriAnswer | null
  split: SplitAnswer | null
  unseenIncluded: TriAnswer | null
  deduplicated: TriAnswer | null
  source: InputSource
}

let rowSeq = 0
export const newRowId = () => `m${++rowSeq}`

export const EMPTY_MATRIX: MatrixRaw = { tn: '', fp: '', fn: '', tp: '' }

export function emptyForm(): FormState {
  return {
    metricRows: [{ id: newRowId(), kind: '', raw: '' }],
    matrixOpen: false,
    matrix: { ...EMPTY_MATRIX },
    claimedBest: null,
    split: null,
    unseenIncluded: null,
    deduplicated: null,
    source: 'user',
  }
}

export function formFromExample(example: ExampleInput): FormState {
  return {
    metricRows: example.claim.map((c) => ({ id: newRowId(), kind: c.kind, raw: c.raw })),
    matrixOpen: true,
    matrix: { ...example.matrix },
    claimedBest: example.claimedBest,
    split: example.split,
    unseenIncluded: example.unseenIncluded,
    deduplicated: example.deduplicated,
    source: example.id,
  }
}

/** 저장된 검증 입력을 사용자가 다시 고칠 수 있는 폼 문자열로 되돌린다. */
export function formFromReviewInput(input: ReviewInput): FormState {
  const rows = METRIC_KINDS.filter((kind) => input.claim[kind] !== undefined).map((kind) => ({
    id: newRowId(),
    kind,
    raw: String(input.claim[kind]),
  }))
  return {
    metricRows: rows.length > 0 ? rows : [{ id: newRowId(), kind: '', raw: '' }],
    matrixOpen: input.matrix !== null,
    matrix: input.matrix ? Object.fromEntries(Object.entries(input.matrix).map(([key, value]) => [key, String(value)])) as MatrixRaw : { ...EMPTY_MATRIX },
    claimedBest: input.claimedBest,
    split: input.split,
    unseenIncluded: input.unseenIncluded,
    deduplicated: input.deduplicated,
    source: input.source,
  }
}

export interface RowCheck {
  id: string
  parsed: Parsed<number> | null
  /** 지표 이름을 고르지 않았는데 값을 적었을 때 */
  kindMissing: boolean
}

export interface FormCheck {
  input: ReviewInput
  rows: RowCheck[]
  matrix: MatrixParse | null
  /** 화면 상단 오류 요약에 쓰는 개수 */
  errorCount: number
}

/** 같은 지표를 두 줄에 적었으면 먼저 적은 유효한 값을 쓴다. */
export function checkForm(form: FormState): FormCheck {
  const claim: ReviewInput['claim'] = {}
  let errorCount = 0

  const rows = form.metricRows.map<RowCheck>((row) => {
    if (row.kind === '') {
      const kindMissing = row.raw.trim() !== ''
      if (kindMissing) errorCount++
      return { id: row.id, parsed: null, kindMissing }
    }
    const parsed = parseRatio(row.raw)
    if (parsed.kind === 'error') errorCount++
    if (parsed.kind === 'ok' && claim[row.kind] === undefined) claim[row.kind] = parsed.value
    return { id: row.id, parsed, kindMissing: false }
  })

  const matrix = form.matrixOpen ? parseMatrix(form.matrix) : null
  if (matrix?.kind === 'invalid') {
    errorCount += Object.values(matrix.fields).filter((f) => f.kind === 'error').length
  }

  return {
    input: {
      claim,
      matrix: matrix?.kind === 'ok' ? matrix.matrix : null,
      claimedBest: form.claimedBest,
      split: form.split,
      unseenIncluded: form.unseenIncluded,
      deduplicated: form.deduplicated,
      source: form.source,
    },
    rows,
    matrix,
    errorCount,
  }
}

export const kindMissingMessage = MESSAGES.metricKindMissing

export function unusedKinds(rows: readonly MetricRow[]): MetricKind[] {
  const used = new Set(rows.map((r) => r.kind))
  return METRIC_KINDS.filter((k) => !used.has(k))
}
