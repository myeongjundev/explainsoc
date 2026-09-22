import { useId, useMemo, useState } from 'react'
import type { FormCheck } from '../domain/form'
import { buildBriefText, type Review, type ReviewDiff } from '../domain/review'
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
  diff: ReviewDiff | null
}

/** 질문과 답변을 실제 PoC 미팅 산출물로 묶는다. 저장·전송은 하지 않는다. */
export function ReviewBrief({ check, review, responses, caseTitle, rounds, current, diff }: Props) {
  const [status, setStatus] = useState<'idle' | 'done' | 'failed'>('idle')
  const statusId = useId()
  const text = useMemo(() => buildBriefText(check.input, review, responses, { caseTitle, rounds, current, diff }), [caseTitle, check.input, current, diff, review, responses, rounds])

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
      <pre className="brief__preview" tabIndex={0} aria-label="PoC 검토표 미리보기">{text}</pre>
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
