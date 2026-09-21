import type { FormCheck } from '../domain/form'
import type { Review } from '../domain/review'
import { ClaimReveal } from './ClaimReveal'
import { FindingList } from './FindingList'
import { QuestionList } from './QuestionList'
import { SplitEvidenceFigure } from './SplitEvidenceFigure'

interface Props {
  check: FormCheck
  review: Review
  onEdit: () => void
  onRestart: () => void
}

/**
 * 화면 D·E·F. 데스크톱에서는 숫자가 말하는 것(왼쪽)과 판독·질문(오른쪽)을 나란히 두고,
 * 모바일에서는 위에서 아래로 쌓는다.
 */
export function ResultStep({ check, review, onEdit, onRestart }: Props) {
  const { input } = check
  return (
    <div className="step-body">
      <div className="result">
        <div className="result__evidence">
          {input.matrix ? (
            <ClaimReveal matrix={input.matrix} claim={input.claim} source={input.source} />
          ) : (
            <section className="panel reveal reveal--empty" aria-labelledby="reveal-title">
              <h3 id="reveal-title" className="panel__title">
                숫자 뒤집어 보기
              </h3>
              <p>
                혼동행렬이 있을 때만 비율을 공격 개수로 바꿔 보여 줍니다. 입력한 지표 하나로 없는 개수를 추정하지 않습니다.
              </p>
            </section>
          )}
          <SplitEvidenceFigure />
        </div>
        <div className="result__output">
          <FindingList review={review} check={check} />
          <QuestionList questions={review.questions} />
        </div>
      </div>
      <div className="step-actions">
        <button type="button" className="button" onClick={onEdit}>
          입력 수정
        </button>
        <button type="button" className="button button--quiet" onClick={onRestart}>
          처음부터
        </button>
      </div>
    </div>
  )
}
