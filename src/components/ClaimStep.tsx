import type { FormCheck, FormState, MetricRow } from '../domain/form'
import { newRowId, unusedKinds } from '../domain/form'
import { TRI_LABEL } from '../domain/format'
import type { TriAnswer } from '../domain/types'
import type { MatrixRaw } from '../domain/validation'
import { ChoiceGroup } from './ChoiceGroup'
import { ConfusionMatrixInput } from './ConfusionMatrixInput'
import { MetricInput } from './MetricInput'

interface Props {
  form: FormState
  check: FormCheck
  onRowsChange: (rows: MetricRow[]) => void
  onMatrixOpen: (open: boolean) => void
  onMatrixChange: (matrix: MatrixRaw) => void
  onClaimedBest: (v: TriAnswer) => void
  onFillExampleB: () => void
}

const TRI_OPTIONS = (['yes', 'no', 'unknown'] as const).map((v) => ({ value: v, label: TRI_LABEL[v] }))

/** 화면 B — 가지고 있는 최소 정보부터 받는다. 모르는 지표를 억지로 채우게 하지 않는다. */
export function ClaimStep({ form, check, onRowsChange, onMatrixOpen, onMatrixChange, onClaimedBest, onFillExampleB }: Props) {
  const rows = form.metricRows
  const canAdd = unusedKinds(rows).length > 0 && rows.every((r) => r.kind !== '')

  const updateRow = (id: string, next: MetricRow) => onRowsChange(rows.map((r) => (r.id === id ? next : r)))
  const removeRow = (id: string) => onRowsChange(rows.filter((r) => r.id !== id))
  const addRow = () => onRowsChange([...rows, { id: newRowId(), kind: '', raw: '' }])

  return (
    <div className="step-body">
      <p className="step-lead">
        제품 소개서에 적힌 숫자 하나면 충분합니다. 모르는 칸은 비워 두세요 — 비어 있는 곳은 공급자에게 물을 질문이 됩니다.
      </p>

      <section className="panel" aria-labelledby="claim-metrics-title">
        <h3 id="claim-metrics-title" className="panel__title">
          받은 성능 숫자
        </h3>
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
              onRemove={() => removeRow(row.id)}
            />
          )
        })}
        <button type="button" className="button button--quiet" onClick={addRow} disabled={!canAdd}>
          지표 하나 더
        </button>
      </section>

      <section className="panel">
        <ChoiceGroup
          legend="공급자가 이 모델을 가장 좋은 모델이라고 소개했습니까?"
          name="claimed-best"
          options={TRI_OPTIONS}
          value={form.claimedBest}
          onChange={onClaimedBest}
        />
      </section>

      <section className="panel" aria-labelledby="claim-matrix-title">
        <div className="panel__head">
          <h3 id="claim-matrix-title" className="panel__title">
            혼동행렬
          </h3>
          <button
            type="button"
            className="button button--quiet"
            aria-expanded={form.matrixOpen}
            aria-controls="matrix-region"
            onClick={() => onMatrixOpen(!form.matrixOpen)}
          >
            {form.matrixOpen ? '혼동행렬 닫기' : '혼동행렬로 입력'}
          </button>
        </div>
        <p className="panel__note">TN·FP·FN·TP 네 개의 개수를 가지고 있을 때만 쓰세요. 없으면 넘어가도 됩니다.</p>
        <div id="matrix-region" hidden={!form.matrixOpen}>
          {form.matrixOpen && <ConfusionMatrixInput value={form.matrix} parse={check.matrix} onChange={onMatrixChange} />}
        </div>
      </section>

      <p className="step-aside">
        내 숫자가 없어도 해 볼 수 있습니다.{' '}
        <button type="button" className="link-button" onClick={onFillExampleB}>
          예시 B로 채우기 — 논문의 높은 무작위 분할 점수
        </button>
      </p>
    </div>
  )
}
