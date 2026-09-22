import { SPLIT_LABEL, TRI_LABEL } from '../domain/format'
import type { ReviewInput } from '../domain/types'
import { DocumentIcon, QuestionIcon } from './icons'

interface Props {
  input: ReviewInput
  onEditConditions: () => void
}

/** 입력한 근거가 숫자·시험 설계·데이터 감사의 어디까지 채워졌는지 한눈에 보여 준다. */
export function EvaluationMap({ input, onEditConditions }: Props) {
  const metricCount = Object.values(input.claim).filter((v) => v !== undefined).length
  const unseen = input.unseenIncluded ? TRI_LABEL[input.unseenIncluded] : '모름'
  const dedup = input.deduplicated ? TRI_LABEL[input.deduplicated] : '모름'
  const split = input.split ? SPLIT_LABEL[input.split] : '모름'
  const contradiction = input.split === 'unseen' && input.unseenIncluded === 'no'

  return (
    <section className="panel eval-map" aria-labelledby="eval-map-title">
      <div className="panel__head">
        <div>
          <p className="eval-map__eyebrow">검토 진행 지도</p>
          <h3 id="eval-map-title" className="panel__title">어떤 근거까지 가지고 있습니까?</h3>
        </div>
        <button type="button" className="button button--quiet" onClick={onEditConditions}>
          평가 조건 확인
        </button>
      </div>
      <ol className="eval-map__steps">
        <MapItem
          title="성능 근거"
          value={`${metricCount}개 지표 · 혼동행렬 ${input.matrix ? '있음' : '없음'}`}
          known={metricCount > 0 || input.matrix !== null}
        />
        <MapItem title="시험 설계" value={`${split} · 미관측 공격 ${unseen}`} known={input.split !== null && input.unseenIncluded !== null} alert={contradiction} />
        <MapItem title="데이터 감사" value={`중복 제거 ${dedup}`} known={input.deduplicated !== null} />
      </ol>
      {contradiction && <p className="eval-map__alert" role="status">시험 설계의 두 답이 서로 다르게 읽힙니다. 결과의 R12에서 확인할 질문을 만들었습니다.</p>}
      <p className="eval-map__note">모름은 실패가 아닙니다. 비어 있는 근거는 공급자에게 물을 질문이 됩니다.</p>
    </section>
  )
}

function MapItem({ title, value, known, alert = false }: { title: string; value: string; known: boolean; alert?: boolean }) {
  const Icon = known && !alert ? DocumentIcon : QuestionIcon
  return (
    <li className={`eval-map__item${known ? ' is-known' : ''}${alert ? ' is-alert' : ''}`}>
      <span className="eval-map__icon"><Icon /></span>
      <span>
        <strong>{title}</strong>
        <span>{value}</span>
      </span>
    </li>
  )
}
