/**
 * V9 소개서 판독 — 공급자 소개서·제안서 문장에서 판독 입력을 규칙으로 뽑는다(설계 31절).
 *
 * - AI를 부르지 않는다. 정해 둔 표현만 찾고, 못 찾은 것은 비워 둔다 — 비운 조건은 모름과 같이
 *   읽혀 공급자에게 물을 질문이 된다.
 * - "신종 공격까지 탐지"는 능력 주장이지 시험 조건이 아니다. 시험 조건 답으로 바꾸지 않는다.
 * - 원문은 브라우저 메모리에만 둔다. 이 모듈은 문자열을 받아 결과를 돌려줄 뿐 어디에도 저장하지 않는다.
 */

import { newRowId, type FormState, type MetricRow } from './form'
import type { MetricKind, SplitAnswer, TriAnswer } from './types'

export type MarkKind = 'metric' | 'best' | 'split' | 'unseenTest' | 'unseenClaim' | 'dedup'

export interface BrochureMark {
  kind: MarkKind
  /** 원문에서의 위치. 화면이 이 구간에 표시를 붙인다. */
  start: number
  end: number
  text: string
  metric?: MetricKind
  /** 0부터 1 사이 비율로 읽은 값 */
  value?: number
  /** 백분율 기호 없이 1보다 큰 수를 백분율로 읽었는지, F1을 Macro F1로 읽었는지 */
  assumed?: 'percentWithoutSign' | 'f1AsMacro'
  /** 같은 지표가 앞에 이미 있어 이 값은 판독에 쓰지 않았는지 */
  repeated?: boolean
  split?: SplitAnswer
  dedup?: TriAnswer
}

/** 소개서에서 읽은 판독 입력. 없는 것은 null이다. */
export interface BrochurePatch {
  metrics: { kind: MetricKind; raw: string }[]
  claimedBest: TriAnswer | null
  split: SplitAnswer | null
  unseenIncluded: TriAnswer | null
  deduplicated: TriAnswer | null
}

export interface BrochureRead {
  marks: BrochureMark[]
  patch: BrochurePatch
}

export const EMPTY_PATCH: BrochurePatch = { metrics: [], claimedBest: null, split: null, unseenIncluded: null, deduplicated: null }

/** 붙여 넣을 수 있는 소개서 길이. 판독은 입력마다 다시 돌므로 한도를 둔다. */
export const MAX_BROCHURE_CHARS = 5000

const METRIC_NAMES: readonly { kind: MetricKind; pattern: string; f1?: true }[] = [
  { kind: 'macroF1', pattern: 'macro[\\s-]?f1(?:[\\s-]?score)?|매크로\\s?f1' },
  { kind: 'macroF1', pattern: 'f1[\\s-]?(?:score|점수)|f1', f1: true },
  { kind: 'accuracy', pattern: '정확도|accuracy' },
  { kind: 'fpr', pattern: '오탐률|오탐지율|오탐|false[\\s-]?positive[\\s-]?rate|fpr' },
  { kind: 'attackRecall', pattern: '공격\\s?탐지율|탐지율|재현율|검출률|detection[\\s-]?rate|recall|tpr' },
]

/** 비율로 읽을 숫자. 뒤에 개수·순위·기간 단위가 붙으면 비율이 아니다("오탐 86건", "1위"). */
const NUMBER = '(?<![\\d.,])(\\d{1,3}(?:\\.\\d+)?)(?![\\d,])\\s*(%|퍼센트)?(?!\\s?(?:건|개|회|명|초|분|시간|일|배|만|천|종|곳|차|위|년|월|대))'
/** 지표 이름과 숫자 사이. 문장이나 목록이 끝나는 기호는 건너지 않는다. */
const GAP = '[^\\d\\n.,;·]{0,14}?'

const BEST = /업계\s?최고|최고\s?(?:수준의\s?)?성능|가장\s?(?:높은|우수한|뛰어난)\s?(?:성능|정확도|모델)|최상위\s?성능|state[\s-]of[\s-]the[\s-]art|\bsota\b|best[\s-]in[\s-]class/gi
const UNSEEN_TEST = /(?:학습(?:\s?데이터)?에\s?(?:없던|포함되지\s?않은)|미관측)\s?공격[^.\n]{0,24}?(?:시험|평가|검증|테스트)(?:했|하였|을\s?거쳤|을\s?진행)?/gi
const UNSEEN_CLAIM = /(?:알려지지\s?않은|신종|미지의|처음\s?보는|새로운|변종|미확인)\s?(?:신종\s?)?(?:공격|위협|악성코드)|제로\s?데이|zero[\s-]?day|unknown\s(?:attacks?|threats?)/gi
const SPLIT_RANDOM = /무작위|랜덤(?!\s?포레스트)|random(?:ly)?[\s-]?split|층화|stratified|교차\s?검증|cross[\s-]?validation|k[\s-]?fold/gi
const SPLIT_OTHER = /시간\s?순|시간\s?기준|날짜\s?(?:별|기준)|기간별|time[\s-]based|temporal\s?split/gi
const DEDUP = /중복(?:된\s?(?:기록|데이터|행))?(?:을|를)?\s?(?:제거|삭제)|dedup(?:licat\w*)?|duplicates?\s(?:were\s)?removed/gi
const NEGATION = /^\s?(?:하지\s?않|없이|안\s?(?:했|한))/

function toRatio(raw: string, percent: boolean): { value: number; assumed?: BrochureMark['assumed'] } | null {
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  if (percent) return n <= 100 ? { value: n / 100 } : null
  if (n <= 1) return { value: n }
  if (n <= 100) return { value: n / 100, assumed: 'percentWithoutSign' }
  return null
}

/** 부동소수점 흔적 없이 폼에 넣을 문자열 */
const ratioText = (v: number) => String(Number(v.toFixed(8)))

function findMetrics(text: string): BrochureMark[] {
  const marks: BrochureMark[] = []
  for (const name of METRIC_NAMES) {
    const forward = new RegExp(`(?<![a-z가-힣])(?:${name.pattern})(?![a-z])${GAP}${NUMBER}`, 'gi')
    const backward = new RegExp(`${NUMBER}\\s?(?:의|에\\s?달하는)?\\s?(?:${name.pattern})(?![a-z])`, 'gi')
    for (const [re, numberGroup] of [[forward, 1], [backward, 1]] as const) {
      for (const m of text.matchAll(re)) {
        const ratio = toRatio(m[numberGroup], Boolean(m[numberGroup + 1]))
        if (!ratio) continue
        marks.push({
          kind: 'metric',
          start: m.index,
          end: m.index + m[0].length,
          text: m[0],
          metric: name.kind,
          value: ratio.value,
          assumed: ratio.assumed ?? (name.f1 ? 'f1AsMacro' : undefined),
        })
      }
    }
  }
  return marks
}

function findAll(text: string, re: RegExp, make: (m: RegExpMatchArray) => Omit<BrochureMark, 'start' | 'end' | 'text'>): BrochureMark[] {
  return [...text.matchAll(re)].map((m) => ({ ...make(m), start: m.index!, end: m.index! + m[0].length, text: m[0] }))
}

/** 겹치는 표시는 먼저 나온 것을 남긴다. 같은 자리에서 시작하면 긴 것을 남긴다. */
function dropOverlaps(marks: BrochureMark[]): BrochureMark[] {
  const sorted = [...marks].sort((a, b) => a.start - b.start || b.end - a.end)
  const kept: BrochureMark[] = []
  for (const mark of sorted) {
    const last = kept.at(-1)
    if (last && mark.start < last.end) continue
    kept.push(mark)
  }
  return kept
}

export function readBrochure(input: string): BrochureRead {
  const text = input.slice(0, MAX_BROCHURE_CHARS)
  const found = [
    // 시험 조건이 능력 주장보다 먼저 자리를 차지한다: "학습에 없던 공격으로 따로 시험"은 조건이다.
    ...findAll(text, UNSEEN_TEST, () => ({ kind: 'unseenTest' })),
    ...findMetrics(text),
    ...findAll(text, BEST, () => ({ kind: 'best' })),
    ...findAll(text, UNSEEN_CLAIM, () => ({ kind: 'unseenClaim' })),
    ...findAll(text, SPLIT_RANDOM, () => ({ kind: 'split', split: 'random' })),
    ...findAll(text, SPLIT_OTHER, () => ({ kind: 'split', split: 'other' })),
    ...findAll(text, DEDUP, (m) => ({ kind: 'dedup', dedup: NEGATION.test(text.slice(m.index! + m[0].length)) ? 'no' : 'yes' })),
  ]
  const marks = dropOverlaps(found)

  const patch: BrochurePatch = { ...EMPTY_PATCH, metrics: [] }
  const seen = new Set<MetricKind>()
  for (const mark of marks) {
    if (mark.kind === 'metric' && mark.metric && mark.value !== undefined) {
      if (seen.has(mark.metric)) {
        mark.repeated = true
        continue
      }
      seen.add(mark.metric)
      patch.metrics.push({ kind: mark.metric, raw: ratioText(mark.value) })
    }
    if (mark.kind === 'best') patch.claimedBest = 'yes'
    if (mark.kind === 'split' && patch.split === null) patch.split = mark.split ?? null
    if (mark.kind === 'unseenTest') {
      patch.split = 'unseen'
      patch.unseenIncluded = 'yes'
    }
    if (mark.kind === 'dedup' && patch.deduplicated === null) patch.deduplicated = mark.dedup ?? null
  }
  return { marks, patch }
}

const sameRows = (rows: readonly MetricRow[], metrics: BrochurePatch['metrics']) =>
  rows.length === metrics.length && rows.every((r, i) => r.kind === metrics[i].kind && r.raw === metrics[i].raw)

/**
 * 소개서가 바뀌면 소개서에서 읽은 칸만 바꾼다. 소개서에 없어 사용자가 직접 답한 조건은 지우지 않는다.
 * 이전 판독이 채운 값이 그대로 남아 있으면 소개서에서 온 것으로 보고, 새 판독에 없으면 비운다.
 */
export function applyBrochure(form: FormState, previous: BrochurePatch, next: BrochurePatch): FormState {
  const pick = <T>(current: T | null, before: T | null, after: T | null): T | null => {
    if (after !== null) return after
    return current === before ? null : current
  }
  const rowsFromText = sameRows(form.metricRows, previous.metrics)
  const metricRows: MetricRow[] = next.metrics.length > 0
    ? next.metrics.map((m) => ({ id: newRowId(), kind: m.kind, raw: m.raw }))
    : rowsFromText ? [{ id: newRowId(), kind: '', raw: '' }] : form.metricRows
  return {
    ...form,
    metricRows,
    claimedBest: pick(form.claimedBest, previous.claimedBest, next.claimedBest),
    split: pick(form.split, previous.split, next.split),
    unseenIncluded: pick(form.unseenIncluded, previous.unseenIncluded, next.unseenIncluded),
    deduplicated: pick(form.deduplicated, previous.deduplicated, next.deduplicated),
    source: 'user',
  }
}
