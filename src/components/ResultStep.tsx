import { useState } from 'react'
import type { FormCheck } from '../domain/form'
import type { Review } from '../domain/review'
import type { QuestionResponse } from '../domain/types'
import type { CaseRound } from '../domain/caseFile'
import type { RoundComparison } from '../domain/review'
import { ClaimReveal } from './ClaimReveal'
import { FindingList } from './FindingList'
import { QuestionList } from './QuestionList'
import { ReviewBrief } from './ReviewBrief'
import { SplitEvidenceFigure } from './SplitEvidenceFigure'
import { RequestPackage } from './RequestPackage'
import { RoundWorkspace, type RoundDraftMeta } from './RoundWorkspace'
import { TerminologyHelp } from './TerminologyHelp'
import { WorkbenchNav, type WorkbenchChapter } from './WorkbenchNav'
import { EvidenceStatusBoard } from './EvidenceStatusBoard'
import { ConclusionCard } from './ConclusionCard'
import { buildConclusion } from '../domain/conclusion'
import { InvestigationBrief } from './InvestigationBrief'

interface Props {
  check: FormCheck
  review: Review
  onEdit: () => void
  onEditConditions: () => void
  /** 소개서로 시작했을 때만 있다 */
  onEditBrochure?: () => void
  onOpenLab: () => void
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
export function ResultStep({ check, review, onEdit, onEditConditions, onEditBrochure, onOpenLab, onRestart, responses, onResponse, caseTitle, onCaseTitle, rounds, roundMeta, onRoundMeta, comparison, onNextRound, onDownload, caseFileStatus }: Props) {
  const { input } = check
  const [chapter, setChapter] = useState<WorkbenchChapter>('evidence')
  const [roundsOpen, setRoundsOpen] = useState(rounds.length > 0)
  const showChapter = (next: WorkbenchChapter) => {
    setChapter(next)
    const target = next === 'evidence' ? 'evidence-column' : next === 'findings' ? 'findings-title' : 'questions-title'
    // scrollIntoView가 없는 환경(테스트 등)에서도 장 전환 자체는 이어진다.
    window.requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView?.({ block: 'start' }))
  }
  return (
    <div className="step-body result-step">
      <ConclusionCard conclusion={buildConclusion(input, review)} onShowQuestions={() => showChapter('output')} />
      <WorkbenchNav active={chapter} onSelect={setChapter} />
      {caseFileStatus && <p className="workbench-file-status" role="status">{caseFileStatus}</p>}
      <InvestigationBrief review={review} roundNumber={rounds.length + 1} caseTitle={caseTitle} errorCount={check.errorCount} onShowQuestions={() => showChapter('output')} />
      <div className="result investigation-board">
        <div className={`result__evidence board-column${chapter === 'evidence' ? ' is-active' : ''}`} id="evidence-column">
          <header className="board-column__head">
            <span>1</span><div><h3>주장과 근거</h3><p>받은 숫자가 실제로 말하는 것</p></div>
          </header>
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
          <EvidenceStatusBoard input={input} roundCount={rounds.length + 1} sameTrial={roundMeta.sameTrial} onEditConditions={onEditConditions} />
          <TerminologyHelp />
        </div>
        <div className={`result__findings board-column${chapter === 'findings' ? ' is-active' : ''}`}>
          <header className="board-column__head">
            <span>2</span><div><h3>판독</h3><p>논문 결과로 읽은 해석과 주의</p></div>
          </header>
          <FindingList review={review} check={check} />
        </div>
        <div className={`result__output board-column${chapter === 'output' ? ' is-active' : ''}`}>
          <header className="board-column__head">
            <span>3</span><div><h3>다음 행동</h3><p>공급자에게 물을 질문과 검토표</p></div>
          </header>
          <QuestionList questions={review.questions} responses={responses} onResponse={onResponse} />
          <RequestPackage review={review} />
          <ReviewBrief check={check} review={review} responses={responses} caseTitle={caseTitle} rounds={rounds} current={{ id: `r${rounds.length + 1}`, ...roundMeta, input, responses: { ...responses } }} comparison={comparison} />
        </div>
      </div>
      <ChapterPager chapter={chapter} onGo={showChapter} />
      <div className="result__split"><SplitEvidenceFigure /></div>
      <section className="lab-teaser" aria-labelledby="lab-teaser-title">
        <div>
          <h3 id="lab-teaser-title">논문 실험실</h3>
          <p>같은 자료로 학습한 세 모델의 1위가 시험마다 바뀌고, 설명(SHAP)이 안정적인 모델이 공격을 거의 못 잡은 실험을 직접 바꿔 봅니다.</p>
        </div>
        <button type="button" className="button" onClick={onOpenLab}>논문 실험실 열기</button>
      </section>
      <details
        className="rounds-disclosure"
        id="round-comparison"
        open={roundsOpen}
        onToggle={(event) => setRoundsOpen(event.currentTarget.open)}
      >
        <summary>
          <span aria-hidden="true">+</span>
          <strong>회차 기록과 다음 답변 관리</strong>
          <em>{rounds.length + 1}회차 · 브라우저 안에서만 작업</em>
        </summary>
        <RoundWorkspace caseTitle={caseTitle} onCaseTitle={onCaseTitle} rounds={rounds} current={roundMeta} onCurrent={onRoundMeta} comparison={comparison} onNextRound={onNextRound} onDownload={onDownload} />
      </details>
      <div className="step-actions">
        {onEditBrochure && (
          <button type="button" className="button" onClick={onEditBrochure}>
            소개서 다시 보기
          </button>
        )}
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

const CHAPTER_ORDER: { id: WorkbenchChapter; label: string }[] = [
  { id: 'evidence', label: '주장과 근거' },
  { id: 'findings', label: '판독' },
  { id: 'output', label: '다음 행동' },
]

/** 한 장을 다 읽은 자리에서 다음 장으로 갈 수 있게 둔다. 위쪽 결과 목차를 찾지 못해도 순서가 이어진다. */
function ChapterPager({ chapter, onGo }: { chapter: WorkbenchChapter; onGo: (next: WorkbenchChapter) => void }) {
  const index = CHAPTER_ORDER.findIndex((item) => item.id === chapter)
  const previous = index > 0 ? CHAPTER_ORDER[index - 1] : null
  const next = index < CHAPTER_ORDER.length - 1 ? CHAPTER_ORDER[index + 1] : null

  return (
    <nav className="chapter-pager" aria-label="검토 단계 이동">
      <p className="chapter-pager__where">{index + 1} / {CHAPTER_ORDER.length} · {CHAPTER_ORDER[index].label}</p>
      <div className="chapter-pager__buttons">
        {previous && (
          <button type="button" className="button" onClick={() => onGo(previous.id)}>
            이전: {previous.label}
          </button>
        )}
        {next && (
          <button type="button" className="button button--primary" onClick={() => onGo(next.id)}>
            다음: {next.label}
          </button>
        )}
      </div>
    </nav>
  )
}
