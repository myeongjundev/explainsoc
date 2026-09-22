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
import { EvidenceStatusBoard } from './EvidenceStatusBoard'

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
 * V4 수사 보드. 회차를 맨 위에 두고 주장과 근거 / 판독 / 다음 행동을 세 열로 나눈다.
 */
export function ResultStep({ check, review, onEdit, onEditConditions, onRestart, responses, onResponse, caseTitle, onCaseTitle, rounds, roundMeta, onRoundMeta, comparison, onNextRound, onDownload, caseFileStatus }: Props) {
  const { input } = check
  return (
    <div className="step-body">
      <WorkbenchNav />
      {caseFileStatus && <p className="workbench-file-status" role="status">{caseFileStatus}</p>}
      <RoundWorkspace caseTitle={caseTitle} onCaseTitle={onCaseTitle} rounds={rounds} current={roundMeta} onCurrent={onRoundMeta} comparison={comparison} onNextRound={onNextRound} onDownload={onDownload} />
      <div className="result investigation-board">
        <div className="result__evidence board-column">
          <header className="board-column__head">
            <span>01</span><div><p>CLAIM &amp; EVIDENCE</p><h3>주장과 근거</h3></div>
          </header>
          <EvidenceStatusBoard input={input} roundCount={rounds.length + 1} sameTrial={roundMeta.sameTrial} />
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
        <div className="result__findings board-column">
          <header className="board-column__head">
            <span>02</span><div><p>INTERPRETATION</p><h3>판독</h3></div>
          </header>
          <FindingList review={review} check={check} />
        </div>
        <div className="result__output board-column">
          <header className="board-column__head">
            <span>03</span><div><p>NEXT ACTION</p><h3>다음 행동</h3></div>
          </header>
          <QuestionList questions={review.questions} responses={responses} onResponse={onResponse} />
          <RequestPackage review={review} />
          <ReviewBrief check={check} review={review} responses={responses} caseTitle={caseTitle} rounds={rounds} current={{ id: `r${rounds.length + 1}`, ...roundMeta, input, responses: { ...responses } }} comparison={comparison} />
        </div>
      </div>
      <div className="result__split"><SplitEvidenceFigure /></div>
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
