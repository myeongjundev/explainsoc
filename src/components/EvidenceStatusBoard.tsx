import { METRIC_KINDS, type ReviewInput, type TriAnswer } from '../domain/types'

type EvidenceState = 'received' | 'needed' | 'separate' | 'na' | 'alert'

interface Item {
  label: string
  value: string
  state: EvidenceState
}

interface Props {
  input: ReviewInput
  roundCount: number
  sameTrial: TriAnswer | null
  onEditConditions: () => void
}

/**
 * 받은 근거와 다음에 확인할 근거를 한 표로 보인다.
 * V8에서 옛 평가 근거 지도(3칸)를 합쳤다: 평가 조건으로 돌아가는 단추와 시험 설계 모순 안내(R12)가 여기로 왔다.
 */
export function EvidenceStatusBoard({ input, roundCount, sameTrial, onEditConditions }: Props) {
  const metricCount = METRIC_KINDS.filter((kind) => input.claim[kind] !== undefined).length
  const known = (value: string | null) => value !== null && value !== 'unknown'
  const contradiction = input.split === 'unseen' && input.unseenIncluded === 'no'
  const trial: Item = roundCount === 1
    ? { label: '시험 연결', value: '첫 회차', state: 'na' }
    : sameTrial === 'yes'
      ? { label: '시험 연결', value: '같은 시험 확인', state: 'received' }
      : sameTrial === 'no'
        ? { label: '시험 연결', value: '별도 시험 분기', state: 'separate' }
        : { label: '시험 연결', value: '출처 확인 필요', state: 'needed' }
  const answered = (value: string | null): EvidenceState => (contradiction ? 'alert' : known(value) ? 'received' : 'needed')

  const items: Item[] = [
    { label: '성능 지표', value: metricCount > 0 ? `${metricCount}개 받음` : '확인 필요', state: metricCount > 0 ? 'received' : 'needed' },
    { label: '혼동행렬', value: input.matrix ? '원수치 받음' : '확인 필요', state: input.matrix ? 'received' : 'needed' },
    { label: '분할 정의', value: known(input.split) ? '받음' : '확인 필요', state: answered(input.split) },
    { label: '미관측 공격', value: known(input.unseenIncluded) ? '받음' : '확인 필요', state: answered(input.unseenIncluded) },
    { label: '중복 감사', value: known(input.deduplicated) ? '받음' : '확인 필요', state: known(input.deduplicated) ? 'received' : 'needed' },
    trial,
  ]

  return (
    <section className="panel evidence-status" aria-labelledby="evidence-status-title">
      <div className="panel__head">
        <div>
          <p className="board-column__eyebrow">근거 확인표</p>
          <h3 id="evidence-status-title" className="panel__title">주장을 읽는 데 필요한 근거</h3>
        </div>
        <button type="button" className="button button--quiet" onClick={onEditConditions}>
          평가 조건 확인
        </button>
      </div>
      <ul className="evidence-status__grid">
        {items.map((item) => (
          <li key={item.label} className={`evidence-status__item evidence-status__item--${item.state}`}>
            <span aria-hidden="true" />
            <strong>{item.label}</strong>
            <small>{item.value}</small>
          </li>
        ))}
      </ul>
      {contradiction && (
        <p className="evidence-status__alert" role="status">
          시험 설계의 두 답이 서로 다르게 읽힙니다. 결과의 R12에서 확인할 질문을 만들었습니다.
        </p>
      )}
      <p className="evidence-status__note">
        완성도 점수가 아닙니다. 받은 근거와 다음에 확인할 근거를 구분합니다. 모름은 실패가 아니라 공급자에게 물을 질문이 됩니다.
      </p>
    </section>
  )
}
