import type { FormCheck } from '../domain/form'
import type { Review } from '../domain/review'
import type { QuestionResponse } from '../domain/types'
import type { CaseRound } from '../domain/caseFile'
import type { RoundComparison } from '../domain/review'
import { ClaimReveal } from './ClaimReveal'
import { EvaluationMap } from './EvaluationMap'
import { FindingList } from './FindingList'
import { QuestionList } from './QuestionList'
import { ReviewBrief } from './ReviewBrief'
import { SplitEvidenceFigure } from './SplitEvidenceFigure'
import { RequestPackage } from './RequestPackage'
import { RoundWorkspace, type RoundDraftMeta } from './RoundWorkspace'
import { TerminologyHelp } from './TerminologyHelp'
import { WorkbenchNav } from './WorkbenchNav'

interface Props {
  check: FormCheck
  review: Review
  onEdit: () => void
  onEditConditions: () => void
  onRestart: () => void
  responses: Readonly<Record<string, QuestionResponse>>
  onResponse: (question: string, response: QuestionResponse) => void
  caseTitle: string
  onCaseTitle: (value: string) => void
  rounds: readonly CaseRound[]
  roundMeta: RoundDraftMeta
  onRoundMeta: (value: RoundDraftMeta) => void
  comparison: RoundComparison | null
  onNextRound: () => void
  onDownload: () => void
  caseFileStatus: string
}

/**
 * 화면 D·E·F. 데스크톱에서는 숫자가 말하는 것(왼쪽)과 판독·질문(오른쪽)을 나란히 두고,
 * 모바일에서는 위에서 아래로 쌓는다.
 */
export function ResultStep({ check, review, onEdit, onEditConditions, onRestart, responses, onResponse, caseTitle, onCaseTitle, rounds, roundMeta, onRoundMeta, comparison, onNextRound, onDownload, caseFileStatus }: Props) {
  const { input } = check
  return (
    <div className="step-body">
      <WorkbenchNav />
      {caseFileStatus && <p className="workbench-file-status" role="status">{caseFileStatus}</p>}
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
          <EvaluationMap input={input} onEditConditions={onEditConditions} />
          <TerminologyHelp />
        </div>
        <div className="result__output">
          <FindingList review={review} check={check} />
          <QuestionList questions={review.questions} responses={responses} onResponse={onResponse} />
          <RequestPackage review={review} />
          <RoundWorkspace caseTitle={caseTitle} onCaseTitle={onCaseTitle} rounds={rounds} current={roundMeta} onCurrent={onRoundMeta} comparison={comparison} onNextRound={onNextRound} onDownload={onDownload} />
          <ReviewBrief check={check} review={review} responses={responses} caseTitle={caseTitle} rounds={rounds} current={{ id: `r${rounds.length + 1}`, ...roundMeta, input, responses: { ...responses } }} comparison={comparison} />
        </div>
        <div className="result__split"><SplitEvidenceFigure /></div>
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
