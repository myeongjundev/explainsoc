import type { ReactNode } from 'react'
import type { FormCheck, FormState, MetricRow } from '../domain/form'
import { newRowId, unusedKinds } from '../domain/form'
import { SPLIT_LABEL, TRI_LABEL } from '../domain/format'
import type { ReviewInput, SplitAnswer, TriAnswer } from '../domain/types'
import type { MatrixRaw } from '../domain/validation'
import { ChoiceGroup } from './ChoiceGroup'
import { PreviousClaim, previousAnswer } from './PreviousClaim'
import { ConfusionMatrixInput } from './ConfusionMatrixInput'
import { MetricInput } from './MetricInput'

interface Props {
  form: FormState
  check: FormCheck
  onFinish: () => void
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

const TRI_OPTIONS = (['yes', 'no', 'unknown'] as const).map((v) => ({ value: v, label: TRI_LABEL[v] }))
const SPLIT_OPTIONS = (['random', 'unseen', 'other', 'unknown'] as const).map((v) => ({ value: v, label: SPLIT_LABEL[v] }))

/**
 * 입력 여섯 가지를 한 장의 문서에 모두 둔다. 결과를 본 뒤 고칠 때와 두 번째 회차부터 쓴다 —
 * 이미 질문을 한 번 읽은 사람은 바뀐 것만 빠르게 고친다. 값은 한 화면씩 묻는 입력과 같은 FormState에 쓴다.
 */
export function OnePageForm(props: Props) {
  const { form, check, onFinish, previous } = props
  const rows = form.metricRows
  const canAdd = unusedKinds(rows).length > 0 && rows.every((r) => r.kind !== '')
  const updateRow = (id: string, next: MetricRow) => props.onRowsChange(rows.map((r) => (r.id === id ? next : r)))

  const answered = [
    rows.some((r) => r.kind !== '' && r.raw.trim() !== ''),
    form.claimedBest !== null,
    form.matrixOpen,
    form.split !== null,
    form.unseenIncluded !== null,
    form.deduplicated !== null,
  ].filter(Boolean).length

  return (
    <div className="sheet-form">
      <p className="sheet-form__lead">
        {previous
          ? '이번 답변에서 새로 받은 것만 적으세요. 비운 칸은 이전 회차 값을 이어 씁니다.'
          : '아는 것만 채우세요. 비워 두거나 ‘모름’을 고른 곳은 공급자에게 물을 질문이 됩니다.'}
      </p>

      <section className="sheet-form__section" id="form-section-1" aria-labelledby="form-section-1-title">
        <header className="sheet-form__section-head">
          <span className="sheet-form__letter" aria-hidden="true">A</span>
          <h3 id="form-section-1-title">받은 숫자</h3>
        </header>

        <Item n={1} title="제품 자료에 적힌 성능 숫자" why="“정확도 99%”처럼 적힌 숫자 하나면 충분합니다.">
          {previous && <PreviousClaim input={previous} />}
          <div className="sheet-form__metrics">
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
                  onRemove={() => props.onRowsChange(rows.filter((r) => r.id !== row.id))}
                />
              )
            })}
          </div>
          <div className="sheet-form__row">
            <button type="button" className="button button--quiet" onClick={() => props.onRowsChange([...rows, { id: newRowId(), kind: '', raw: '' }])} disabled={!canAdd}>
              + 지표 하나 더
            </button>
            {!previous && (
              <button type="button" className="link-button" onClick={props.onFillExampleB}>
                숫자가 없다면 논문 예시 B로 채우기
              </button>
            )}
          </div>
        </Item>

        <Item n={2}>
          <ChoiceGroup
            size="row"
            legend="공급자가 이 모델을 “가장 좋은 모델”이라고 소개했나요?"
            name="claimed-best"
            options={TRI_OPTIONS}
            value={form.claimedBest}
            onChange={props.onClaimedBest}
            help={<p>가장 높은 하나만 골랐다면, 다시 시험해도 그만큼 나오는지 물어야 합니다.</p>}
          />
        </Item>

        <Item n={3} title="맞히고 틀린 개수 표(혼동행렬)" why="네 칸의 개수가 있으면 비율 하나보다 훨씬 많은 것을 알 수 있습니다. 없으면 넘어가세요.">
          <div>
            <button
              type="button"
              className="button button--quiet"
              aria-expanded={form.matrixOpen}
              aria-controls="matrix-region"
              onClick={() => props.onMatrixOpen(!form.matrixOpen)}
            >
              {form.matrixOpen ? '혼동행렬 닫기' : '혼동행렬로 입력'}
            </button>
          </div>
          <div id="matrix-region" hidden={!form.matrixOpen}>
            {form.matrixOpen && <ConfusionMatrixInput value={form.matrix} parse={check.matrix} onChange={props.onMatrixChange} />}
          </div>
        </Item>
      </section>

      <section className="sheet-form__section" id="form-section-2" aria-labelledby="form-section-2-title">
        <header className="sheet-form__section-head">
          <span className="sheet-form__letter" aria-hidden="true">B</span>
          <h3 id="form-section-2-title">평가 조건</h3>
          <p>모르면 <strong>모름</strong>을 고르세요. 이 앱에서 가장 중요한 답입니다.</p>
        </header>

        <Item n={4}>
          <ChoiceGroup
            size="row"
            legend="시험 자료는 어떻게 나눴나요?"
            name="split"
            options={SPLIT_OPTIONS}
            value={form.split}
            onChange={props.onSplit}
            context={previousAnswer(previous, form.split, previous?.split ?? null, previous?.split ? SPLIT_LABEL[previous.split] : null)}
            help={<p>섞어서 나누면 학습 때 본 공격이 시험에도 들어갑니다. 처음 보는 공격은 따로 시험해야 알 수 있습니다.</p>}
          />
        </Item>

        <Item n={5}>
          <ChoiceGroup
            size="row"
            legend="시험에 학습 때 없던 공격이 들어 있었나요?"
            name="unseen"
            options={TRI_OPTIONS}
            value={form.unseenIncluded}
            onChange={props.onUnseen}
            context={previousAnswer(previous, form.unseenIncluded, previous?.unseenIncluded ?? null, previous?.unseenIncluded ? TRI_LABEL[previous.unseenIncluded] : null)}
            help={<p>논문에서는 이 조건 하나로 Macro F1이 0.9979에서 0.3871로 떨어졌습니다.</p>}
          />
        </Item>

        <Item n={6}>
          <ChoiceGroup
            size="row"
            legend="중복된 기록과 학습·시험에 함께 들어간 기록을 지웠나요?"
            name="dedup"
            options={TRI_OPTIONS}
            value={form.deduplicated}
            onChange={props.onDedup}
            context={previousAnswer(previous, form.deduplicated, previous?.deduplicated ?? null, previous?.deduplicated ? TRI_LABEL[previous.deduplicated] : null)}
            help={<p>같은 기록이 학습과 시험에 함께 있으면 점수가 실제보다 좋게 나올 수 있습니다.</p>}
          />
        </Item>
      </section>

      <footer className="sheet-form__foot">
        <p>
          <strong>{answered}</strong> / 6 답함 · 비운 곳은 질문으로 남습니다
        </p>
        <button type="button" className="button button--primary" onClick={onFinish}>
          결과 보기
        </button>
      </footer>
    </div>
  )
}

function Item({ n, title, why, children }: { n: number; title?: string; why?: string; children: ReactNode }) {
  return (
    <div className="sheet-form__item">
      <span className="sheet-form__num" aria-hidden="true">{n}</span>
      <div className="sheet-form__body">
        {title && <h4 className="sheet-form__title">{title}</h4>}
        {why && <p className="sheet-form__why">{why}</p>}
        {children}
      </div>
    </div>
  )
}
