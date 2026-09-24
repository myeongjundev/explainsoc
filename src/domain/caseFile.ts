import { METRIC_KINDS, type InputSource, type MetricKind, type QuestionResponse, type ReviewInput, type SplitAnswer, type TriAnswer } from './types'

export const CASE_KIND = 'explainsoc-case' as const
export const CASE_SCHEMA_VERSION = 1 as const
export const MAX_CASE_FILE_BYTES = 1024 * 1024

export type RoundSourceKind = 'proposal' | 'vendor-response' | 'additional-test' | 'other'

export interface CaseRound {
  id: string
  label: string
  sourceKind: RoundSourceKind
  sourceNote: string
  sameTrial: TriAnswer | null
  input: ReviewInput
  responses: Record<string, QuestionResponse>
}

export interface CaseFile {
  kind: typeof CASE_KIND
  schemaVersion: typeof CASE_SCHEMA_VERSION
  title: string
  rounds: CaseRound[]
}

export type CaseFileParse = { kind: 'ok'; value: CaseFile } | { kind: 'error'; message: string }

const SOURCE_KINDS: readonly RoundSourceKind[] = ['proposal', 'vendor-response', 'additional-test', 'other']
const INPUT_SOURCES: readonly InputSource[] = ['exampleA', 'exampleB', 'user']
const SPLITS: readonly SplitAnswer[] = ['random', 'unseen', 'other', 'unknown']
const TRI: readonly TriAnswer[] = ['yes', 'no', 'unknown']
const RESPONSE_STATUSES: readonly QuestionResponse['status'][] = ['unasked', 'answered', 'requested', 'followup']

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const hasOnlyKeys = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).every((key) => keys.includes(key))
const shortText = (value: unknown, max: number) => typeof value === 'string' && [...value].length <= max
const nonBlankShortText = (value: unknown, max: number) => shortText(value, max) && String(value).trim().length > 0
const nullableEnum = <T extends string>(value: unknown, values: readonly T[]): value is T | null => value === null || values.includes(value as T)
const nonNegativeInteger = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const ratio = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1

function validInput(value: unknown): value is ReviewInput {
  if (!isObject(value) || !hasOnlyKeys(value, ['claim', 'matrix', 'claimedBest', 'split', 'unseenIncluded', 'deduplicated', 'claimedExplanation', 'source'])) return false
  if (!isObject(value.claim) || !hasOnlyKeys(value.claim, METRIC_KINDS)) return false
  for (const kind of Object.keys(value.claim) as MetricKind[]) if (!ratio(value.claim[kind])) return false

  if (value.matrix !== null) {
    if (!isObject(value.matrix) || !hasOnlyKeys(value.matrix, ['tn', 'fp', 'fn', 'tp'])) return false
    const matrix = value.matrix
    if (!['tn', 'fp', 'fn', 'tp'].every((key) => nonNegativeInteger(matrix[key]))) return false
    if (['tn', 'fp', 'fn', 'tp'].reduce((sum, key) => sum + Number(matrix[key]), 0) === 0) return false
  }

  return nullableEnum(value.claimedBest, TRI)
    && nullableEnum(value.split, SPLITS)
    && nullableEnum(value.unseenIncluded, TRI)
    && nullableEnum(value.deduplicated, TRI)
    // V9에 생긴 항목이라 이전 파일에는 없다
    && (value.claimedExplanation === undefined || nullableEnum(value.claimedExplanation, TRI))
    && INPUT_SOURCES.includes(value.source as InputSource)
}

function validResponses(value: unknown): value is Record<string, QuestionResponse> {
  if (!isObject(value) || Object.keys(value).length > 100) return false
  return Object.entries(value).every(([question, response]) => {
    if ([...question].length === 0 || [...question].length > 500 || !isObject(response)) return false
    if (!hasOnlyKeys(response, ['status', 'note'])) return false
    return RESPONSE_STATUSES.includes(response.status as QuestionResponse['status']) && shortText(response.note, 2000)
  })
}

function validRound(value: unknown, index: number): value is CaseRound {
  if (!isObject(value) || !hasOnlyKeys(value, ['id', 'label', 'sourceKind', 'sourceNote', 'sameTrial', 'input', 'responses'])) return false
  return value.id === `r${index + 1}`
    && nonBlankShortText(value.label, 120)
    && SOURCE_KINDS.includes(value.sourceKind as RoundSourceKind)
    && shortText(value.sourceNote, 1000)
    && (index === 0 ? value.sameTrial === null : TRI.includes(value.sameTrial as TriAnswer))
    && validInput(value.input)
    && validResponses(value.responses)
}

export function makeCaseFile(title: string, rounds: readonly CaseRound[]): CaseFile {
  return {
    kind: CASE_KIND,
    schemaVersion: CASE_SCHEMA_VERSION,
    title: title.trim() || '이름 없는 PoC 검토',
    rounds: rounds.map((round, index) => ({ ...round, id: `r${index + 1}` })),
  }
}

export function caseFileToText(value: CaseFile): string {
  return `${JSON.stringify(value, null, 2)}\n`
}

export function parseCaseFileText(text: string): CaseFileParse {
  if (new TextEncoder().encode(text).byteLength > MAX_CASE_FILE_BYTES) {
    return { kind: 'error', message: '사례 파일은 1 MiB 이하여야 합니다.' }
  }

  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { kind: 'error', message: 'JSON 형식의 ExplainSOC 사례 파일이 아닙니다.' }
  }

  if (!isObject(raw) || !hasOnlyKeys(raw, ['kind', 'schemaVersion', 'title', 'rounds'])) {
    return { kind: 'error', message: '사례 파일에 알 수 없는 항목이 있거나 필요한 항목이 없습니다.' }
  }
  if (raw.kind !== CASE_KIND || raw.schemaVersion !== CASE_SCHEMA_VERSION) {
    return { kind: 'error', message: '지원하는 ExplainSOC 사례 파일 버전이 아닙니다.' }
  }
  if (!nonBlankShortText(raw.title, 200) || !Array.isArray(raw.rounds) || raw.rounds.length === 0 || raw.rounds.length > 20) {
    return { kind: 'error', message: '사례 이름 또는 회차 수가 올바르지 않습니다.' }
  }
  if (!raw.rounds.every((round, index) => validRound(round, index))) {
    return { kind: 'error', message: '회차 안에 잘못된 값이 있습니다. 원본 ExplainSOC 파일인지 확인해 주세요.' }
  }
  return { kind: 'ok', value: raw as unknown as CaseFile }
}

/** 같은 시험이라고 답했을 때만 이전 근거 위에 새 근거를 합친다. 모름은 R14 미리보기를 위해 임시로 겹친다. */
export function combineRoundInput(previous: ReviewInput | null, received: ReviewInput, sameTrial: TriAnswer | null): ReviewInput {
  if (!previous) return received
  if (sameTrial === 'no') return { ...received, source: 'user' }
  return {
    claim: { ...previous.claim, ...received.claim },
    matrix: received.matrix ?? previous.matrix,
    claimedBest: received.claimedBest ?? previous.claimedBest,
    split: received.split ?? previous.split,
    unseenIncluded: received.unseenIncluded ?? previous.unseenIncluded,
    deduplicated: received.deduplicated ?? previous.deduplicated,
    claimedExplanation: received.claimedExplanation ?? previous.claimedExplanation ?? null,
    source: 'user',
  }
}

/** 저장된 각 회차의 원자료를 순서대로 적용해 마지막 회차에서 보이는 유효 입력을 만든다. */
export function resolveRoundInputs(rounds: readonly CaseRound[]): ReviewInput | null {
  return rounds.reduce<ReviewInput | null>(
    (previous, round) => combineRoundInput(previous, round.input, round.sameTrial),
    null,
  )
}
