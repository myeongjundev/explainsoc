import { useId } from 'react'
import { computeMetrics } from '../domain/metrics'
import { formatComputed } from '../domain/format'
import { MATRIX_FIELDS, type MatrixField, type MatrixParse, type MatrixRaw } from '../domain/validation'

interface Props {
  value: MatrixRaw
  parse: MatrixParse | null
  onChange: (value: MatrixRaw) => void
}

/** 칸마다 한국어로 무엇을 세는지 쓴다. TN·FP 순서를 사용자에게 떠넘기지 않는다. */
const CELL: Record<MatrixField, { label: string; hint: string }> = {
  tn: { label: '정상→정상 (TN)', hint: '실제 정상 · 예측 정상' },
  fp: { label: '정상→공격, 오탐 (FP)', hint: '실제 정상 · 예측 공격' },
  fn: { label: '공격→정상, 미탐 (FN)', hint: '실제 공격 · 예측 정상' },
  tp: { label: '공격→공격 (TP)', hint: '실제 공격 · 예측 공격' },
}

export function ConfusionMatrixInput({ value, parse, onChange }: Props) {
  const baseId = useId()
  const statusId = `${baseId}-status`

  const fieldError = (f: MatrixField) => {
    const p = parse?.fields[f]
    return p?.kind === 'error' ? p.message : null
  }

  const cell = (f: MatrixField) => {
    const id = `${baseId}-${f}`
    const err = fieldError(f)
    return (
      <td className={`matrix__cell matrix__cell--${f}`}>
        <label htmlFor={id}>
          <span className="matrix__label">{CELL[f].label}</span>
          <span className="visually-hidden"> — {CELL[f].hint}</span>
        </label>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          value={value[f]}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `${id}-error` : statusId}
          onChange={(e) => onChange({ ...value, [f]: e.target.value })}
        />
        {err && (
          <p className="field__error" id={`${id}-error`}>
            {err}
          </p>
        )}
      </td>
    )
  }

  const metrics = parse?.kind === 'ok' ? computeMetrics(parse.matrix) : null

  let status: string
  if (!parse || parse.kind === 'incomplete') {
    const empty = MATRIX_FIELDS.filter((f) => parse?.fields[f].kind === 'empty').length
    status = empty === 4 || !parse ? '네 칸을 모두 채우면 지표를 계산합니다.' : `빈 칸 ${empty}개는 정보 없음으로 두었습니다. 네 칸을 모두 채우면 계산합니다.`
  } else if (parse.kind === 'invalid') status = '잘못 적은 칸을 고치면 계산합니다. 다른 입력의 판독은 그대로 진행됩니다.'
  else if (parse.kind === 'zero') status = parse.message
  else status = '입력한 네 칸으로 계산했습니다. 품질 판정이 아닙니다.'

  return (
    <div className="matrix">
      <p className="matrix__intro">
        행은 <strong>실제</strong>, 열은 <strong>예측</strong>입니다. 찾아야 할 쪽(양성)은 <strong>공격</strong>입니다.
      </p>
      <table className="matrix__table">
        <caption className="visually-hidden">혼동행렬 입력 — 행은 실제, 열은 예측</caption>
        <thead>
          <tr>
            <td />
            <th scope="col">예측 정상</th>
            <th scope="col">예측 공격</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">실제 정상</th>
            {cell('tn')}
            {cell('fp')}
          </tr>
          <tr>
            <th scope="row">실제 공격</th>
            {cell('fn')}
            {cell('tp')}
          </tr>
        </tbody>
      </table>
      <p className="matrix__status" id={statusId} role="status">
        {status}
      </p>
      {metrics && (
        <dl className="matrix__metrics">
          <div>
            <dt>Accuracy</dt>
            <dd>{formatComputed(metrics.accuracy)}</dd>
          </div>
          <div>
            <dt>공격 Recall</dt>
            <dd>{formatComputed(metrics.attackRecall)}</dd>
          </div>
          <div>
            <dt>정상 Recall</dt>
            <dd>{formatComputed(metrics.normalRecall)}</dd>
          </div>
          <div>
            <dt>FPR</dt>
            <dd>{formatComputed(metrics.fpr)}</dd>
          </div>
          <div>
            <dt>Macro F1</dt>
            <dd>{formatComputed(metrics.macroF1)}</dd>
          </div>
        </dl>
      )}
      {metrics && <NaReasons metrics={metrics} />}
    </div>
  )
}

/** 계산할 수 없는 지표가 있으면 왜 그런지 한 줄씩 적는다. */
function NaReasons({ metrics }: { metrics: ReturnType<typeof computeMetrics> }) {
  const reasons = [
    ['공격 Recall', metrics.attackRecall],
    ['정상 Recall·FPR', metrics.fpr],
    ['Macro F1', metrics.macroF1],
  ] as const
  const lines = reasons.flatMap(([name, c]) => (c.kind === 'na' ? [`${name}: ${c.reason}`] : []))
  if (lines.length === 0) return null
  return (
    <ul className="matrix__na">
      {lines.map((l) => (
        <li key={l}>{l}</li>
      ))}
    </ul>
  )
}
