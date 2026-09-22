import { useId, useState } from 'react'
import { PAPER, UNSEEN_TEST_COMPOSITION, XGB_RANDOM, XGB_UNSEEN } from '../data/paperEvidence'
import { computeMetrics } from '../domain/metrics'
import { formatComputed, formatCount, formatRatio, METRIC_SHORT } from '../domain/format'
import { METRIC_KINDS, type ConfusionMatrix, type InputSource, type ReviewInput } from '../domain/types'
import { EvidenceDetails } from './EvidenceDetails'
import { FlipIcon } from './icons'

interface Props {
  matrix: ConfusionMatrix
  claim: ReviewInput['claim']
  source: InputSource
}

/**
 * 화면 D — 숫자를 운영의 말로 바꾸는 장면.
 * 받은 주장(비율) → 공격 개수 → 항상 정상 기준선 → 범위 문장.
 * 사용자 입력에는 혼동행렬이 있을 때만 이 화면을 연다. 없는 개수를 추정하지 않는다.
 */
export function ClaimReveal({ matrix, claim, source }: Props) {
  const [flipped, setFlipped] = useState(false)
  const liveId = useId()
  const m = computeMetrics(matrix)
  const isA = source === 'exampleA'
  const isB = source === 'exampleB'

  const claimed = METRIC_KINDS.filter((k) => claim[k] !== undefined)
  const frontItems =
    claimed.length > 0
      ? claimed.map((k) => ({ label: METRIC_SHORT[k], value: formatRatio(claim[k] as number) }))
      : [
          { label: '정확도', value: formatComputed(m.accuracy) },
          { label: '오탐률', value: formatComputed(m.fpr) },
        ]
  const frontCaption = isA
    ? '겉으로는 무난해 보이는 성능 주장'
    : claimed.length > 0
      ? '받은 주장'
      : '혼동행렬에서 계산한 두 값'

  const backText = `공격 ${formatCount(m.attacks)}건 가운데 탐지 ${formatCount(matrix.tp)}건 · 미탐 ${formatCount(matrix.fn)}건`

  // 논문 예시 A는 원고 IV-3의 시험 구성 원수로 계산하고, 계산식에도 그 원수를 보인다.
  const baselineNumerator = isA ? UNSEEN_TEST_COMPOSITION.normal : m.normals
  const baselineDenominator = isA ? UNSEEN_TEST_COMPOSITION.total : m.total
  const accuracy = m.accuracy.kind === 'value' ? m.accuracy.value : null
  const baseline = m.alwaysNormalAccuracy.kind === 'value' ? m.alwaysNormalAccuracy.value : null

  const scope = isA
    ? `이 비교는 ${PAPER.dataset} ${XGB_UNSEEN.splitLabel}의 시험 구성에 한정됩니다.`
    : isB
      ? `이 비교는 ${PAPER.dataset} ${XGB_RANDOM.splitLabel}의 시험 구성에 한정됩니다.`
      : '입력한 혼동행렬로 계산했습니다. 이 입력에 한정된 비교입니다.'

  return (
    <section className="panel reveal" aria-labelledby="reveal-title">
      <h3 id="reveal-title" className="panel__title">
        숫자 뒤집어 보기
      </h3>

      <div className={`flip${flipped ? ' is-flipped' : ''}`}>
        <div className="flip__inner">
          <div className="flip__face flip__face--front" aria-hidden={flipped}>
            <p className="flip__eyebrow">{frontCaption}</p>
            <p className="flip__numbers">
              {frontItems.map((it, i) => (
                <span key={it.label}>
                  {i > 0 && <span className="flip__dot" aria-hidden="true"> · </span>}
                  {it.label} <strong>{it.value}</strong>
                </span>
              ))}
            </p>
          </div>
          <div className="flip__face flip__face--back" aria-hidden={!flipped}>
            <p className="flip__eyebrow">공격 기준으로 보면</p>
            <p className="flip__numbers">
              공격 <strong>{formatCount(m.attacks)}</strong>건 가운데 탐지 <strong>{formatCount(matrix.tp)}</strong>건
            </p>
            <p className="flip__sub">
              미탐 {formatCount(matrix.fn)}건 · 오탐 {formatCount(matrix.fp)}건 (정상 {formatCount(m.normals)}건 가운데)
            </p>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="button button--primary reveal__flip"
        aria-pressed={flipped}
        aria-describedby={liveId}
        onClick={() => setFlipped((f) => !f)}
      >
        <FlipIcon />
        {flipped ? '받은 주장 다시 보기' : '공격 기준으로 뒤집기'}
      </button>
      <p id={liveId} className="visually-hidden" aria-live="polite">
        {flipped ? backText : `${frontCaption}: ${frontItems.map((it) => `${it.label} ${it.value}`).join(', ')}`}
      </p>

      {accuracy !== null && baseline !== null && (
        <figure className="baseline">
          <figcaption className="baseline__title">모든 흐름을 정상으로만 예측했다면</figcaption>
          <div
            className="baseline__chart"
            role="img"
            aria-label={`0부터 1까지의 같은 축. 정확도 ${formatRatio(accuracy)}, 항상 정상 기준선 약 ${formatRatio(baseline)}.`}
          >
            <Bar label="정확도" value={accuracy} display={formatRatio(accuracy)} tone="ink" />
            <Bar label="항상 정상 기준선" value={baseline} display={`약 ${formatRatio(baseline)}`} tone="muted" />
            <div className="baseline__axis" aria-hidden="true">
              <span>0</span>
              <span>0.5</span>
              <span>1</span>
            </div>
          </div>
          <p className="baseline__formula">
            항상 정상 기준선 = 시험 정상 {formatCount(baselineNumerator)}건 ÷ 시험 전량 {formatCount(baselineDenominator)}건
          </p>
          <p className="baseline__note">
            {isA
              ? `같은 시험 자료에서 모든 흐름을 정상으로만 예측한 경우의 정확도는 약 ${formatRatio(baseline)}입니다. XGBoost의 ${formatRatio(accuracy)}와 거의 같아 보이는 이유를 이해하기 위한 비교이며, 다른 데이터셋의 기준이나 합격선이 아닙니다.`
              : `모든 흐름을 정상으로만 예측했다면 정확도는 약 ${formatRatio(baseline)}입니다. 판정 기준이 아니라 정확도를 읽기 위한 비교입니다.`}
          </p>
          {isA && (
            <p className="baseline__delta">
              정확도가 항상 정상 기준선을 앞선 분량은 전체 {formatCount(m.total)}건 가운데{' '}
              <strong>{formatCount(matrix.tp - matrix.fp)}건</strong>(탐지 {formatCount(matrix.tp)} − 오탐 {formatCount(matrix.fp)})입니다.
            </p>
          )}
        </figure>
      )}

      <p className="reveal__scope">{scope}</p>

      {isA && (
        <div className="reveal__ask">
          <p className="reveal__ask-label">이 논문 예시가 답해 주는 핵심 평가 조건</p>
          <p className="reveal__ask-q">“시험에 학습 때 없던 공격이 들어 있었습니까?”</p>
        </div>
      )}

      <EvidenceDetails ids={isA ? ['P03', 'P09', 'P10'] : isB ? ['P03', 'P09'] : ['P02', 'P06']} />
    </section>
  )
}

function Bar({ label, value, display, tone }: { label: string; value: number; display: string; tone: 'ink' | 'muted' }) {
  // 축은 0부터 시작한다. 작은 차이를 키워 보이게 자르지 않는다.
  const width = `${Math.max(0, Math.min(1, value)) * 100}%`
  return (
    <div className="bar" aria-hidden="true">
      <span className="bar__label">{label}</span>
      <span className="bar__track">
        <span className={`bar__fill bar__fill--${tone}`} style={{ width }} />
      </span>
      <span className="bar__value">{display}</span>
    </div>
  )
}
