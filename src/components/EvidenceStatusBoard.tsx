import { METRIC_KINDS, type ReviewInput, type TriAnswer } from '../domain/types'

type EvidenceState = 'received' | 'needed' | 'separate' | 'na'

interface Item {
  label: string
  value: string
  state: EvidenceState
}

export function EvidenceStatusBoard({ input, roundCount, sameTrial }: { input: ReviewInput; roundCount: number; sameTrial: TriAnswer | null }) {
  const metricCount = METRIC_KINDS.filter((kind) => input.claim[kind] !== undefined).length
  const known = (value: string | null) => value !== null && value !== 'unknown'
  const trial: Item = roundCount === 1
    ? { label: '시험 연결', value: '첫 회차', state: 'na' }
    : sameTrial === 'yes'
      ? { label: '시험 연결', value: '같은 시험 확인', state: 'received' }
      : sameTrial === 'no'
        ? { label: '시험 연결', value: '별도 시험 분기', state: 'separate' }
        : { label: '시험 연결', value: '출처 확인 필요', state: 'needed' }

  const items: Item[] = [
    { label: '성능 지표', value: metricCount > 0 ? `${metricCount}개 받음` : '확인 필요', state: metricCount > 0 ? 'received' : 'needed' },
    { label: '혼동행렬', value: input.matrix ? '원수치 받음' : '확인 필요', state: input.matrix ? 'received' : 'needed' },
    { label: '분할 정의', value: known(input.split) ? '받음' : '확인 필요', state: known(input.split) ? 'received' : 'needed' },
    { label: '미관측 공격', value: known(input.unseenIncluded) ? '받음' : '확인 필요', state: known(input.unseenIncluded) ? 'received' : 'needed' },
    { label: '중복 감사', value: known(input.deduplicated) ? '받음' : '확인 필요', state: known(input.deduplicated) ? 'received' : 'needed' },
    trial,
  ]

  return (
    <section className="panel evidence-status" aria-labelledby="evidence-status-title">
      <p className="board-column__eyebrow">EVIDENCE MAP</p>
      <h3 id="evidence-status-title" className="panel__title">주장을 읽는 데 필요한 근거</h3>
      <ul className="evidence-status__grid">
        {items.map((item) => (
          <li key={item.label} className={`evidence-status__item evidence-status__item--${item.state}`}>
            <span aria-hidden="true" />
            <strong>{item.label}</strong>
            <small>{item.value}</small>
          </li>
        ))}
      </ul>
      <p className="evidence-status__note">완성도 점수가 아닙니다. 받은 근거와 다음에 확인할 근거를 구분합니다.</p>
    </section>
  )
}
