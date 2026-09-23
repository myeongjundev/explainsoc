import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { FormCheck, FormState, MetricRow } from '../domain/form'
import { newRowId, unusedKinds } from '../domain/form'
import { SPLIT_LABEL, TRI_LABEL } from '../domain/format'
import type { ReviewInput, SplitAnswer, TriAnswer } from '../domain/types'
import type { MatrixRaw } from '../domain/validation'
import { ChoiceGroup } from './ChoiceGroup'
import { PreviousClaim, previousAnswer } from './PreviousClaim'
import { ConfusionMatrixInput } from './ConfusionMatrixInput'
import { MetricInput } from './MetricInput'

/** 한 화면에 하나씩 묻는 질문. 앞의 셋은 1단계(받은 숫자), 뒤의 셋은 2단계(평가 조건)다. */
export const GUIDED_QUESTIONS = ['metrics', 'claimedBest', 'matrix', 'split', 'unseen', 'dedup'] as const
export type GuidedQuestion = (typeof GUIDED_QUESTIONS)[number]
export const GUIDED_STEP_START = { 1: 0, 2: 3 } as const
export const guidedStepOf = (index: number): 1 | 2 => (index < GUIDED_STEP_START[2] ? 1 : 2)

interface Props {
  form: FormState
  check: FormCheck
  index: number
  onIndex: (index: number) => void
  onFinish: () => void
  onBack: () => void
  /** 질문 여섯 개를 한 장짜리 폼으로 한꺼번에 본다. */
  onShowAll: () => void
  onRowsChange: (rows: MetricRow[]) => void
  onMatrixOpen: (open: boolean) => void
  onMatrixChange: (matrix: MatrixRaw) => void
  onClaimedBest: (v: TriAnswer) => void
  onSplit: (v: SplitAnswer) => void
  onUnseen: (v: TriAnswer) => void
  onDedup: (v: TriAnswer) => void
  onFillExampleB: () => void
  previous?: ReviewInput | null
}

const TRI_DESC: Record<TriAnswer, string> = {
  yes: '자료에 그렇게 적혀 있거나 공급자가 확인해 줬습니다',
  no: '그렇지 않다고 적혀 있습니다',
  unknown: '자료에 없습니다 — 공급자에게 물을 질문이 됩니다',
}
const TRI_OPTIONS = (['yes', 'no', 'unknown'] as const).map((v) => ({ value: v, label: TRI_LABEL[v], description: TRI_DESC[v] }))

const SPLIT_DESC: Record<SplitAnswer, string> = {
  random: '모은 흐름을 섞어 학습용과 시험용으로 나눴습니다',
  unseen: '학습 때 없던 공격 유형을 시험에만 넣었습니다',
  other: '날짜별, 장소별 등 다른 기준으로 나눴습니다',
  unknown: '자료에 없습니다 — 공급자에게 물을 질문이 됩니다',
}
const SPLIT_OPTIONS = (['random', 'unseen', 'other', 'unknown'] as const).map((v) => ({ value: v, label: SPLIT_LABEL[v], description: SPLIT_DESC[v] }))

const MATRIX_OPTIONS = [
  { value: 'yes', label: '있습니다', description: '네 칸의 개수를 직접 적겠습니다' },
  { value: 'no', label: '없습니다', description: '넘어가도 됩니다 — 없으면 요청할 자료로 남깁니다' },
] as const

/**
 * 처음 입력은 한 화면에 질문 하나씩 묻는다. 비전공자가 긴 폼 앞에서 멈추지 않게 한다.
 * 값은 한 장짜리 폼과 같은 FormState에 쓰므로 ‘질문 전체 한 번에 보기’로 옮겨도 입력은 그대로다.
 */
export function GuidedInput(props: Props) {
  const { form, check, index, onIndex, onFinish, onBack, onShowAll, previous } = props
  const question = GUIDED_QUESTIONS[index]
  const titleRef = useRef<HTMLSpanElement>(null)
  const firstRender = useRef(true)
  const [noMatrix, setNoMatrix] = useState(false)

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    titleRef.current?.focus()
  }, [index])

  const total = GUIDED_QUESTIONS.length
  const isLast = index === total - 1
  const answered = isAnswered(question, form) || (question === 'matrix' && noMatrix)

  const title = (text: string) => (
    <span className="guided__question" tabIndex={-1} ref={titleRef}>
      {text}
    </span>
  )

  let body: ReactNode
  switch (question) {
    case 'metrics':
      body = <MetricsQuestion {...props} title={title('제품 자료에 적힌 성능 숫자를 적어 주세요')} />
      break
    case 'claimedBest':
      body = (
        <ChoiceGroup
          size="large"
          legend={title('공급자가 이 모델을 “가장 좋은 모델”이라고 소개했나요?')}
          name="claimed-best"
          options={TRI_OPTIONS}
          value={form.claimedBest}
          onChange={props.onClaimedBest}
          help={<p>여러 모델 중 점수가 가장 높은 하나만 골라 보여 줬다면, 같은 시험을 다시 했을 때도 그만큼 나오는지 물어야 합니다.</p>}
        />
      )
      break
    case 'matrix':
      body = (
        <div className="guided__stack">
          <ChoiceGroup
            size="large"
            legend={title('맞히고 틀린 개수를 적은 표(혼동행렬)가 있나요?')}
            name="matrix-has"
            options={MATRIX_OPTIONS}
            value={form.matrixOpen ? 'yes' : noMatrix ? 'no' : null}
            onChange={(v) => {
              setNoMatrix(v === 'no')
              props.onMatrixOpen(v === 'yes')
            }}
            help={<p>정상·공격 흐름을 몇 건 맞히고 몇 건 틀렸는지 적은 네 칸짜리 표입니다. 비율 하나보다 훨씬 많은 것을 알려 줍니다.</p>}
          />
          {form.matrixOpen && <ConfusionMatrixInput value={form.matrix} parse={check.matrix} onChange={props.onMatrixChange} />}
        </div>
      )
      break
    case 'split':
      body = (
        <ChoiceGroup
          size="large"
          legend={title('시험 자료는 어떻게 나눴나요?')}
          name="split"
          options={SPLIT_OPTIONS}
          value={form.split}
          onChange={props.onSplit}
          context={previousAnswer(previous, form.split, previous?.split ?? null, previous?.split ? SPLIT_LABEL[previous.split] : null)}
          help={<p>섞어서 나누면 학습 때 본 공격이 시험에도 들어갑니다. 처음 보는 공격을 잡는지는 학습에 없던 공격을 따로 시험해야 알 수 있습니다.</p>}
        />
      )
      break
    case 'unseen':
      body = (
        <ChoiceGroup
          size="large"
          legend={title('시험에 학습 때 없던 공격이 들어 있었나요?')}
          name="unseen"
          options={TRI_OPTIONS}
          value={form.unseenIncluded}
          onChange={props.onUnseen}
          context={previousAnswer(previous, form.unseenIncluded, previous?.unseenIncluded ?? null, previous?.unseenIncluded ? TRI_LABEL[previous.unseenIncluded] : null)}
          help={<p>논문에서는 이 조건 하나로 Macro F1이 0.9979에서 0.3871로 떨어졌습니다.</p>}
        />
      )
      break
    case 'dedup':
      body = (
        <ChoiceGroup
          size="large"
          legend={title('중복된 기록과 학습·시험에 함께 들어간 기록을 지웠나요?')}
          name="dedup"
          options={TRI_OPTIONS}
          value={form.deduplicated}
          onChange={props.onDedup}
          context={previousAnswer(previous, form.deduplicated, previous?.deduplicated ?? null, previous?.deduplicated ? TRI_LABEL[previous.deduplicated] : null)}
          help={<p>같은 기록이 학습과 시험에 함께 있으면 답을 외운 셈이라 점수가 실제보다 좋게 나올 수 있습니다.</p>}
        />
      )
      break
  }

  return (
    <section className="guided" aria-label={`질문 ${index + 1} / ${total}`}>
      <div className="guided__progress">
        <div className="guided__progress-row">
          <span className="guided__count">
            질문 <strong>{index + 1}</strong> / {total}
          </span>
          <button type="button" className="link-button guided__all" onClick={onShowAll}>
            질문 전체 한 번에 보기
          </button>
        </div>
        <span className="guided__bar" aria-hidden="true">
          {GUIDED_QUESTIONS.map((q, i) => (
            <span key={q} className={`guided__tick${i < index ? ' is-done' : ''}${i === index ? ' is-current' : ''}`} />
          ))}
        </span>
      </div>

      <div className="guided__card">{body}</div>

      <div className="guided__nav">
        <button type="button" className="button" onClick={() => (index === 0 ? onBack() : onIndex(index - 1))}>
          이전
        </button>
        <button type="button" className="button button--primary" onClick={() => (isLast ? onFinish() : onIndex(index + 1))}>
          {isLast ? '결과 보기' : answered ? '다음' : '건너뛰고 다음'}
        </button>
      </div>
      {!answered && question !== 'metrics' && (
        <p className="guided__skip-note">답하지 않고 넘어가면 ‘모름’처럼 공급자에게 물을 질문으로 남습니다.</p>
      )}
    </section>
  )
}

function isAnswered(q: GuidedQuestion, form: FormState): boolean {
  switch (q) {
    case 'metrics':
      return form.metricRows.some((r) => r.kind !== '' && r.raw.trim() !== '') || form.source !== 'user'
    case 'claimedBest':
      return form.claimedBest !== null
    case 'matrix':
      return form.matrixOpen
    case 'split':
      return form.split !== null
    case 'unseen':
      return form.unseenIncluded !== null
    case 'dedup':
      return form.deduplicated !== null
  }
}

function MetricsQuestion({ form, check, onRowsChange, onFillExampleB, previous, title }: Props & { title: ReactNode }) {
  const rows = form.metricRows
  const canAdd = unusedKinds(rows).length > 0 && rows.every((r) => r.kind !== '')
  const updateRow = (id: string, next: MetricRow) => onRowsChange(rows.map((r) => (r.id === id ? next : r)))

  return (
    <div className="guided__stack">
      <h3 className="guided__heading">{title}</h3>
      <p className="guided__lead">
        {previous
          ? '이번 답변에서 새로 받은 숫자만 적으세요. 비운 칸은 이전 회차 값을 이어 씁니다.'
          : '“정확도 99%”처럼 적힌 숫자 하나면 충분합니다. 없으면 건너뛰어도 됩니다.'}
      </p>
      {previous && <PreviousClaim input={previous} />}
      <div className="guided__metrics">
        {rows.map((row, i) => {
          const taken = new Set(rows.filter((r) => r.id !== row.id && r.kind !== '').map((r) => r.kind as Exclude<typeof r.kind, ''>))
          return (
            <MetricInput
              key={row.id}
              row={row}
              index={i}
              check={check.rows.find((c) => c.id === row.id)}
              takenKinds={taken}
              canRemove={rows.length > 1}
              onChange={(next) => updateRow(row.id, next)}
              onRemove={() => onRowsChange(rows.filter((r) => r.id !== row.id))}
            />
          )
        })}
      </div>
      <div className="guided__row">
        <button type="button" className="button button--quiet" onClick={() => onRowsChange([...rows, { id: newRowId(), kind: '', raw: '' }])} disabled={!canAdd}>
          + 지표 하나 더
        </button>
        {!previous && (
          <button type="button" className="link-button" onClick={onFillExampleB}>
            숫자가 없다면 논문 예시 B로 채우기
          </button>
        )}
      </div>
    </div>
  )
}
