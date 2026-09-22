import { useId, useMemo, useState } from 'react'
import type { FormCheck } from '../domain/form'
import { buildBriefText, type Review, type RoundComparison } from '../domain/review'
import type { CaseRound } from '../domain/caseFile'
import type { QuestionResponse } from '../domain/types'
import { CopyIcon, DocumentIcon } from './icons'

interface Props {
  check: FormCheck
  review: Review
  responses: Readonly<Record<string, QuestionResponse>>
  caseTitle: string
  rounds: readonly CaseRound[]
  current: CaseRound
  comparison: RoundComparison | null
}

/** 질문과 답변을 실제 PoC 미팅 산출물로 묶는다. 저장·전송은 하지 않는다. */
export function ReviewBrief({ check, review, responses, caseTitle, rounds, current, comparison }: Props) {
  const [status, setStatus] = useState<'idle' | 'done' | 'failed'>('idle')
  const statusId = useId()
  const text = useMemo(() => buildBriefText(check.input, review, responses, { caseTitle, rounds, current, comparison }), [caseTitle, check.input, comparison, current, review, responses, rounds])
  const comparisonLabel = comparison?.kind === 'confirmed'
    ? '같은 시험 · 확정 비교'
    : comparison?.kind === 'provisional'
      ? '출처 확인 전 · 임시 비교'
      : comparison?.kind === 'separate'
        ? '별도 시험 · 분리 판독'
        : '최초 주장 검토'

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('done')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <section className="panel brief" aria-labelledby="brief-title">
      <div className="brief__head">
        <div>
          <p className="brief__eyebrow"><DocumentIcon /> 최종 산출물</p>
          <h3 id="brief-title" className="panel__title">PoC 성능 주장 검토표</h3>
        </div>
        <span className="brief__privacy">브라우저 메모리에서만 작성</span>
      </div>
      <p className="brief__lead">받은 주장, 빠진 근거, 공급자 답변을 한 장으로 가져갑니다. 모델 품질 판정표가 아닙니다.</p>
      <div className="dossier__cover">
        <p className="dossier__case">{caseTitle}</p>
        <div className="dossier__metrics">
          <div><strong>{rounds.length + 1}</strong><span>현재 회차</span></div>
          <div><strong>{review.findings.length}</strong><span>판독 항목</span></div>
          <div><strong>{review.questions.length}</strong><span>다음 질문</span></div>
        </div>
        <p className="dossier__state">{comparisonLabel}</p>
        <div className="dossier__next">
          <strong>다음 회의에서 확인할 것</strong>
          {review.questions.length > 0
            ? <ol>{review.questions.slice(0, 3).map((question) => <li key={question}>{question}</li>)}</ol>
            : <p>현재 입력에서 추가로 물을 질문이 없습니다.</p>}
        </div>
      </div>
      <details className="dossier__record">
        <summary>전체 회차·근거 기록 펼치기</summary>
        <pre className="brief__preview" tabIndex={0} aria-label="PoC 검토표 미리보기">{text}</pre>
      </details>
      <pre className="brief__preview brief__print-preview" aria-hidden="true">{text}</pre>
      <div className="brief__actions">
        <button type="button" className="button button--primary" onClick={copyAll} aria-describedby={statusId}>
          <CopyIcon /> 검토표 전체 복사
        </button>
        <button type="button" className="button" onClick={() => window.print()}>
          검토표 인쇄·PDF 저장
        </button>
      </div>
      <p id={statusId} className="questions__status" role="status" aria-live="polite">
        {status === 'done' && 'PoC 검토표 전체를 복사했습니다. 답변 메모가 포함됩니다.'}
        {status === 'failed' && '검토표를 복사하지 못했습니다. 인쇄·PDF 저장을 이용해 주세요.'}
      </p>
    </section>
  )
}
