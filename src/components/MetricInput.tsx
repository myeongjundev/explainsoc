import { useId } from 'react'
import type { RowCheck, MetricRow } from '../domain/form'
import { kindMissingMessage } from '../domain/form'
import { METRIC_LABEL } from '../domain/format'
import { METRIC_KINDS, type MetricKind } from '../domain/types'

interface Props {
  row: MetricRow
  check: RowCheck | undefined
  /** 다른 줄에서 이미 고른 지표. 같은 지표를 두 번 고르지 않게 한다. */
  takenKinds: ReadonlySet<MetricKind>
  index: number
  canRemove: boolean
  onChange: (row: MetricRow) => void
  onRemove: () => void
}

/** 지표 한 줄. 지표 이름을 고르기 전에는 숫자 칸을 열지 않는다 (설계 10절). */
export function MetricInput({ row, check, takenKinds, index, canRemove, onChange, onRemove }: Props) {
  const kindId = useId()
  const valueId = useId()
  const messageId = useId()

  const parsed = check?.parsed
  const error = check?.kindMissing ? kindMissingMessage : parsed?.kind === 'error' ? parsed.message : null
  const noKind = row.kind === ''

  return (
    <div className="metric-row">
      <div className="field">
        <label htmlFor={kindId}>지표 {index + 1}</label>
        <select
          id={kindId}
          value={row.kind}
          onChange={(e) => onChange({ ...row, kind: e.target.value as MetricKind | '' })}
        >
          <option value="">지표를 고르세요</option>
          {METRIC_KINDS.map((k) => (
            <option key={k} value={k} disabled={takenKinds.has(k) && row.kind !== k}>
              {METRIC_LABEL[k]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={valueId}>값 (0부터 1 사이)</label>
        <input
          id={valueId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder={noKind ? '먼저 지표를 고르세요' : '예: 0.99'}
          disabled={noKind && row.raw === ''}
          value={row.raw}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || noKind ? messageId : undefined}
          onChange={(e) => onChange({ ...row, raw: e.target.value })}
        />
        {error ? (
          <p className="field__error" id={messageId}>
            {error}
          </p>
        ) : (
          noKind && (
            <p className="field__hint" id={messageId}>
              {kindMissingMessage}
            </p>
          )
        )}
      </div>
      {canRemove && (
        <button type="button" className="button button--quiet metric-row__remove" onClick={onRemove}>
          이 지표 빼기
        </button>
      )}
    </div>
  )
}
