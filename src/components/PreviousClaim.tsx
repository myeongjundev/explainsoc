import { formatCount, formatRatio, METRIC_LABEL } from '../domain/format'
import { METRIC_KINDS, type ReviewInput } from '../domain/types'

/** 2회차부터 — 비워 두면 이어 쓰는 이전 회차의 성능 자료. */
export function PreviousClaim({ input }: { input: ReviewInput }) {
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

/** 2회차부터 — 평가 조건 하나의 이전 값과, 이번에 ‘모름’으로 되돌렸다면 그 변경을 함께 알린다. */
export function previousAnswer(previous: ReviewInput | null | undefined, current: string | null, before: string | null, beforeLabel: string | null) {
  if (!previous) return undefined
  return (
    <>
      <p>이전 값: <strong>{beforeLabel ?? '모름'}</strong> · 선택하지 않으면 이 값을 이어 씁니다.</p>
      {current === 'unknown' && before && before !== 'unknown' && <p><strong>변경:</strong> 이전 값을 ‘{beforeLabel}’에서 ‘모름’으로 바꿉니다.</p>}
    </>
  )
}
