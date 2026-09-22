import type { FormCheck, FormState, MetricRow } from '../domain/form'
import { newRowId, unusedKinds } from '../domain/form'
import { formatCount, formatRatio, METRIC_LABEL, TRI_LABEL } from '../domain/format'
import { METRIC_KINDS, type ReviewInput, type TriAnswer } from '../domain/types'
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
  previous?: ReviewInput | null
}

const TRI_OPTIONS = (['yes', 'no', 'unknown'] as const).map((v) => ({ value: v, label: TRI_LABEL[v] }))

/** 화면 B — 가지고 있는 최소 정보부터 받는다. 모르는 지표를 억지로 채우게 하지 않는다. */
export function ClaimStep({ form, check, onRowsChange, onMatrixOpen, onMatrixChange, onClaimedBest, onFillExampleB, previous }: Props) {
  const rows = form.metricRows
  const canAdd = unusedKinds(rows).length > 0 && rows.every((r) => r.kind !== '')

  const updateRow = (id: string, next: MetricRow) => onRowsChange(rows.map((r) => (r.id === id ? next : r)))
  const removeRow = (id: string) => onRowsChange(rows.filter((r) => r.id !== id))
  const addRow = () => onRowsChange([...rows, { id: newRowId(), kind: '', raw: '' }])

  return (
    <div className="step-body">
      <p className="step-lead">
        {previous
          ? '이번 답변에서 새로 받은 숫자만 적으세요. 비운 칸은 아래의 이전 회차 값을 이어 씁니다.'
          : '제품 소개서에 적힌 숫자 하나면 충분합니다. 모르는 칸은 비워 두세요 — 비어 있는 곳은 공급자에게 물을 질문이 됩니다.'}
      </p>
      {previous && <PreviousClaim input={previous} />}

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

      {!previous && (
        <p className="step-aside">
          내 숫자가 없어도 해 볼 수 있습니다.{' '}
          <button type="button" className="link-button" onClick={onFillExampleB}>
            예시 B로 채우기 — 논문의 높은 무작위 분할 점수
          </button>
        </p>
      )}
    </div>
  )
}

function PreviousClaim({ input }: { input: ReviewInput }) {
  const metrics = METRIC_KINDS.filter((kind) => input.claim[kind] !== undefined)
  return (
    <aside className="followup-previous" aria-label="이전 회차에서 이어 쓰는 성능 자료">
      <strong>이전 회차 값</strong>
      {metrics.length > 0
        ? <p>{metrics.map((kind) => `${METRIC_LABEL[kind]} ${formatRatio(input.claim[kind] as number)}`).join(' · ')}</p>
        : <p>받은 성능 지표 없음</p>}
      {input.matrix && <p>혼동행렬 TN {formatCount(input.matrix.tn)} · FP {formatCount(input.matrix.fp)} · FN {formatCount(input.matrix.fn)} · TP {formatCount(input.matrix.tp)}</p>}
      <p>이번 회차에서 비워 두면 이 값을 이어 쓰며, 새 값을 적으면 그 항목만 바뀝니다.</p>
    </aside>
  )
}
