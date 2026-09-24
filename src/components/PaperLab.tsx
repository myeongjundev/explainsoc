import { forwardRef, useEffect, useId, useState } from 'react'
import {
  EXPLANATION_STABILITY,
  FEATURE_LABEL,
  MODEL_TABLE,
  PERMUTATION,
  SEED_TABLE,
  SHAP_TOP5,
  type LabModel,
  type LabSplit,
  type ModelRow,
} from '../data/paperEvidence'
import { formatRatio } from '../domain/format'
import { EvidenceDetails } from './EvidenceDetails'

/** 다른 화면에서 실험 하나로 바로 들어올 때 쓰는 이름 */
export type LabSection = 'rank' | 'seed' | 'shift' | 'blind'

const SECTION_TITLE_ID: Record<LabSection, string> = {
  rank: 'lab-rank-title',
  seed: 'lab-seed-title',
  shift: 'lab-shift-title',
  blind: 'lab-blind-title',
}

interface Props {
  onBack: () => void
  backLabel: string
  /** 있으면 그 실험의 제목으로 초점을 옮긴다 */
  section?: LabSection | null
}

const SPLIT_NAME: Record<LabSplit, { plain: string; paper: string }> = {
  random: { plain: '학습에 있던 공격 유형으로 시험', paper: '계층화 무작위 분할' },
  unseen: { plain: '처음 보는 공격 유형으로 시험', paper: '미관측 공격 스트레스 테스트' },
}

type Metric = 'macroF1' | 'attackRecall' | 'fpr'

const METRIC_NAME: Record<Metric, string> = {
  macroF1: 'Macro F1',
  attackRecall: '공격 Recall',
  fpr: '오탐률(FPR)',
}

const pct = (v: number) => `${Number((v * 100).toFixed(2))}%`

/** 화면 D — 논문 실험실. 원고 V-2~V-5의 결과를 직접 바꿔 보며 확인한다(설계 31절). 새 수치를 만들지 않는다. */
/** 실험실 첫머리의 목차. 제목·한 줄은 각 실험 카드의 제목과 결과를 줄인 말이다. */
const INDEX: readonly { section: LabSection; no: number; title: string; line: string }[] = [
  { section: 'rank', no: 1, title: '1위는 시험이 정합니다', line: '같은 세 모델도 시험을 바꾸면 1위가 바뀝니다' },
  { section: 'seed', no: 2, title: '운이 아니었습니다', line: '세 번 학습해도 처음 보는 공격에서 같은 결과' },
  { section: 'shift', no: 3, title: '설명도 시험을 탑니다', line: 'SHAP 상위 특징이 시험마다 달라집니다' },
  { section: 'blind', no: 4, title: '안정된 설명 ≠ 잘 잡는 모델', line: '설명은 세 번 같았지만 공격은 거의 못 잡았습니다' },
]

function goTo(section: LabSection) {
  const heading = document.getElementById(SECTION_TITLE_ID[section])
  heading?.scrollIntoView?.({ block: 'start' })
  heading?.focus()
}

export const PaperLab = forwardRef<HTMLHeadingElement, Props>(function PaperLab({ onBack, backLabel, section }, headingRef) {
  useEffect(() => {
    if (section) goTo(section)
  }, [section])
  return (
    <div className="lab">
      <header className="lab__head">
        <p className="lab__kicker">논문 실험실 · CICIDS2017 · 세 모델 · 두 시험</p>
        <h2 id="lab-title" className="step-title" tabIndex={-1} ref={headingRef}>광고 숫자 뒤에 있던 실험을 직접 바꿔 보세요</h2>
        <p className="lab__lead">
          10번 논문의 실험 결과를 그대로 옮겼습니다. 새로 계산하거나 추정한 숫자는 없습니다. 각 실험 아래 ‘논문 근거 보기’에서 원문과 한계를 확인할 수 있습니다.
        </p>
        <nav aria-label="실험 목록">
          <ol className="lab__index">
            {INDEX.map((item) => (
              <li key={item.section}>
                <button type="button" className="lab__index-item" onClick={() => goTo(item.section)}>
                  <span className="lab__index-no" aria-hidden="true">{item.no}</span>
                  <span className="lab__index-title">{item.title}</span>
                  <span className="lab__index-line">{item.line}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </header>
      <RankFlip />
      <SeedCheck />
      <ExplanationShift />
      <StableButBlind />
      <section className="lab-card lab-card--ask" aria-labelledby="lab-ask-title">
        <p className="lab-card__no">실험을 마치면</p>
        <h3 id="lab-ask-title">이 실험들이 공급자에게 묻게 하는 것</h3>
        <ol>
          <li>다른 분할에서도 같은 모델이 가장 높았습니까?</li>
          <li>보여 준 설명(SHAP) 그림은 어떤 시험 자료로 학습한 모델의 것입니까?</li>
          <li>설명이 안정적이라는 것 말고, 같은 시험에서 공격 Recall은 얼마입니까?</li>
        </ol>
      </section>
      <div className="lab__actions">
        <button type="button" className="button" onClick={onBack}>{backLabel}</button>
      </div>
    </div>
  )
})

function CardHead({ no, source, id, title }: { no: number; source: string; id: string; title: string }) {
  return (
    <div className="lab-card__head">
      <span className="lab-card__badge" aria-hidden="true">{no}</span>
      <div>
        <p className="lab-card__no">실험 {no} · {source}</p>
        <h3 id={id} tabIndex={-1}>{title}</h3>
      </div>
    </div>
  )
}

function Segmented<T extends string>({ legend, name, value, options, onChange }: {
  legend: string
  name: string
  value: T
  options: readonly { value: T; label: string; hint?: string }[]
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="segmented">
      <legend className="segmented__legend">{legend}</legend>
      <div className="segmented__options">
        {options.map((o) => (
          <label key={o.value} className={`segmented__option${o.value === value ? ' is-on' : ''}`}>
            <input type="radio" name={name} value={o.value} checked={o.value === value} onChange={() => onChange(o.value)} />
            <span>{o.label}</span>
            {o.hint && <small>{o.hint}</small>}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

const SPLIT_OPTIONS = (['random', 'unseen'] as const).map((s) => ({ value: s, label: SPLIT_NAME[s].plain, hint: SPLIT_NAME[s].paper }))

function ranked(split: LabSplit, metric: Metric): ModelRow[] {
  const rows = MODEL_TABLE.filter((r) => r.split === split)
  // 오탐률은 낮을수록 앞에 둔다. 나머지는 높을수록 앞에.
  return [...rows].sort((a, b) => (metric === 'fpr' ? a[metric] - b[metric] : b[metric] - a[metric]))
}

function RankFlip() {
  const [split, setSplit] = useState<LabSplit>('random')
  const [metric, setMetric] = useState<Metric>('macroF1')
  const rows = ranked(split, metric)
  const other: LabSplit = split === 'random' ? 'unseen' : 'random'
  const otherRank = (model: LabModel) => ranked(other, metric).findIndex((r) => r.model === model) + 1
  const top = rows[0]
  const max = Math.max(...MODEL_TABLE.map((r) => r[metric]))
  return (
    <section className="lab-card" aria-labelledby="lab-rank-title">
      <CardHead no={1} source="원고 V-2" id="lab-rank-title" title="1위는 시험이 정합니다" />
      <p className="lab-card__lead">같은 자료로 학습한 세 모델입니다. 시험을 바꾸면 순위가 어떻게 되는지 보세요.</p>
      <div className="lab-card__controls">
        <Segmented legend="시험" name="rank-split" value={split} options={SPLIT_OPTIONS} onChange={setSplit} />
        <Segmented
          legend="순위 기준"
          name="rank-metric"
          value={metric}
          options={(['macroF1', 'attackRecall', 'fpr'] as const).map((m) => ({ value: m, label: METRIC_NAME[m], hint: m === 'fpr' ? '낮을수록 앞' : '높을수록 앞' }))}
          onChange={setMetric}
        />
      </div>
      <ol className="rank" aria-label={`${SPLIT_NAME[split].plain} · ${METRIC_NAME[metric]} 순위`}>
        {rows.map((r, i) => {
          const was = otherRank(r.model)
          return (
            <li key={r.model} className={`rank__row${i === 0 ? ' is-top' : ''}`}>
              <span className="rank__place">{i + 1}위</span>
              <span className="rank__model">{r.model}</span>
              <span className="rank__bar" aria-hidden="true"><span style={{ width: `${(r[metric] / max) * 100}%` }} /></span>
              <strong className="rank__value">{formatRatio(r[metric])}</strong>
              <span className={`rank__move${was === i + 1 ? '' : was > i + 1 ? ' is-down' : ' is-up'}`}>
                {split === 'random' ? '처음 보는 공격 시험' : '학습에 있던 공격 시험'}에서 {was}위
              </span>
            </li>
          )
        })}
      </ol>
      <p className="lab-card__takeaway" role="status" aria-live="polite">
        {SPLIT_NAME[split].plain}에서 {METRIC_NAME[metric]} 1위는 <strong>{top.model}</strong>({formatRatio(top[metric])})입니다.
        {top.model !== ranked(other, metric)[0].model && ` 다른 시험에서 1위였던 모델은 ${ranked(other, metric)[0].model}입니다. “최고 모델”은 시험에 따라 달라집니다.`}
      </p>
      <EvidenceDetails ids={['P11', 'P04']} />
    </section>
  )
}

function SeedCheck() {
  // 원고처럼 소수 여섯째 자리까지 보여야 시드 사이 차이가 얼마나 작은지 보인다.
  const f6 = (v: number) => v.toFixed(6)
  return (
    <section className="lab-card" aria-labelledby="lab-seed-title">
      <CardHead no={2} source="원고 V-2" id="lab-seed-title" title="운이 아니었습니다 — 세 번 학습해도 같은 결과" />
      <p className="lab-card__lead">XGBoost를 초기화만 바꿔 세 번 학습했습니다. 처음 보는 공격 시험의 붕괴는 세 번 모두 같았습니다.</p>
      <div className="table-wrap">
        <table className="lab-table">
          <caption className="visually-hidden">학습 시드별 XGBoost 성능</caption>
          <thead>
            <tr><th scope="col">학습 시드</th><th scope="col">학습에 있던 공격 · Macro F1</th><th scope="col" className="is-unseen">처음 보는 공격 · Macro F1</th><th scope="col" className="is-unseen">처음 보는 공격 · 공격 Recall</th></tr>
          </thead>
          <tbody>
            {SEED_TABLE.map((r) => (
              <tr key={r.seed}>
                <th scope="row">{r.seed}</th>
                <td>{f6(r.randomMacroF1)}</td>
                <td className="is-unseen">{f6(r.unseenMacroF1)}</td>
                <td className="is-unseen">{f6(r.unseenRecall)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <EvidenceDetails ids={['P12']} />
    </section>
  )
}

function ExplanationShift() {
  const [model, setModel] = useState<'XGBoost' | 'Random Forest'>('XGBoost')
  const [focus, setFocus] = useState<string | null>(null)
  const random = SHAP_TOP5[model].random
  const unseen = SHAP_TOP5[model].unseen
  const tagOf = (feature: string, own: readonly string[], other: readonly string[], side: LabSplit) => {
    const j = other.indexOf(feature)
    if (j < 0) return side === 'unseen' ? { cls: 'is-new', text: '새로 들어옴' } : { cls: 'is-out', text: '빠짐' }
    if (side === 'random') return null
    const move = j - own.indexOf(feature)
    return move === 0 ? { cls: '', text: '같은 순위' } : move > 0 ? { cls: 'is-up', text: `${move}계단 오름` } : { cls: 'is-down', text: `${-move}계단 내림` }
  }
  const column = (split: LabSplit, own: readonly string[], other: readonly string[]) => (
    <div className="shift__col">
      <p className="shift__title">{SPLIT_NAME[split].plain}<small>{SPLIT_NAME[split].paper}</small></p>
      <ol>
        {own.map((f) => {
          const tag = tagOf(f, own, other, split)
          return (
            <li key={f}>
              <button
                type="button"
                className={`shift__item${focus === f ? ' is-focus' : ''}${tag ? ` ${tag.cls}` : ''}`}
                aria-pressed={focus === f}
                onClick={() => setFocus(focus === f ? null : f)}
              >
                <code>{f}</code>
                <span>{FEATURE_LABEL[f] ?? f}</span>
                {tag && <em>{tag.text}</em>}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
  return (
    <section className="lab-card" aria-labelledby="lab-shift-title">
      <CardHead no={3} source="원고 V-3" id="lab-shift-title" title="“AI가 이것을 보고 판단합니다” — 그 설명도 시험을 탑니다" />
      <p className="lab-card__lead">SHAP으로 뽑은 전역 중요도 상위 5개 특징입니다. 특징을 누르면 두 시험에서 같은 특징이 함께 표시됩니다.</p>
      <div className="lab-card__controls">
        <Segmented
          legend="모델"
          name="shift-model"
          value={model}
          options={[{ value: 'XGBoost', label: 'XGBoost' }, { value: 'Random Forest', label: 'Random Forest' }]}
          onChange={(m) => { setModel(m); setFocus(null) }}
        />
      </div>
      <div className="shift">
        {column('random', random, unseen)}
        {column('unseen', unseen, random)}
      </div>
      <p className="lab-card__takeaway">
        시험이 바뀌자 상위 순서가 바뀌고 새 특징이 들어왔습니다. 공급자가 보여 준 설명 그림은 그 모델을 학습시킨 자료에서만 그렇게 나온 판단 근거일 수 있습니다.
      </p>
      <EvidenceDetails ids={['P13']} />
    </section>
  )
}

function StableButBlind() {
  const [k, setK] = useState(5)
  const sliderId = useId()
  const cards = (['random', 'unseen'] as const).map((split) => {
    const row = MODEL_TABLE.find((r) => r.split === split && r.model === 'XGBoost')!
    const step = PERMUTATION.steps[split][k]
    return { split, row, step, stability: EXPLANATION_STABILITY[split] }
  })
  return (
    <section className="lab-card" aria-labelledby="lab-blind-title">
      <CardHead no={4} source="원고 V-4 · V-5" id="lab-blind-title" title="설명이 안정적이라고, 공격을 잘 잡는 것은 아닙니다" />
      <p className="lab-card__lead">
        같은 XGBoost를 세 번 학습해 설명 상위 5개가 얼마나 같은지(Top-5 Jaccard, 1이면 완전히 같음) 쟀습니다. 그리고 상위 특징을 하나씩 지우면(학습 자료의 중앙값으로 바꾸면) 예측이 얼마나 바뀌는지 봤습니다.
      </p>
      <div className="blind__slider">
        <label htmlFor={sliderId}>지운 상위 특징 수 <strong>{k}개</strong></label>
        <input id={sliderId} type="range" min={0} max={5} step={1} value={k} onChange={(e) => setK(Number(e.currentTarget.value))} aria-valuetext={`${k}개`} />
      </div>
      <div className="blind">
        {cards.map(({ split, row, step, stability }) => (
          <article key={split} className={`blind__card blind__card--${split}`} aria-label={SPLIT_NAME[split].plain}>
            <p className="blind__title">{SPLIT_NAME[split].plain}<small>{SPLIT_NAME[split].paper} · XGBoost</small></p>
            <dl className="blind__facts">
              <div><dt>설명 안정성(Jaccard)</dt><dd>{stability.jaccard.toFixed(4)}</dd></div>
              <div><dt>시험 전체 공격 Recall</dt><dd>{formatRatio(row.attackRecall)}</dd></div>
            </dl>
            <p className="blind__flip-label">상위 {k}개를 지웠을 때 예측이 바뀐 비율</p>
            <div className="blind__bar" aria-hidden="true"><span style={{ width: `${Math.min(step.flipRate / 0.4, 1) * 100}%` }} /></div>
            <p className="blind__flip"><strong>{pct(step.flipRate)}</strong> · 표본 공격 Recall {formatRatio(step.attackRecall)}</p>
          </article>
        ))}
      </div>
      <p className="lab-card__takeaway" role="status" aria-live="polite">
        {k === 0
          ? '아직 아무 특징도 지우지 않았습니다. 막대를 옮겨 보세요.'
          : `상위 ${k}개를 지우자 학습에 있던 공격 시험의 모델은 예측 ${pct(cards[0].step.flipRate)}가 바뀌었고, 처음 보는 공격 시험의 모델은 ${pct(cards[1].step.flipRate)}만 바뀌었습니다. 뒤쪽 모델은 설명이 세 번 모두 같았지만(Jaccard 1.0000), 이미 공격을 거의 잡지 못하고 있었습니다.`}
      </p>
      <p className="lab-card__note">
        치환 실험은 분할별 고정 표본 {(PERMUTATION.sample.attack + PERMUTATION.sample.normal).toLocaleString('ko-KR')}건(공격·정상 각 {PERMUTATION.sample.attack.toLocaleString('ko-KR')}건)에서 쟀습니다. 막대의 끝은 40%입니다. 치환 결과를 인과 효과로 읽지 않습니다.
      </p>
      <EvidenceDetails ids={['P14', 'P08']} />
    </section>
  )
}
