import type { Review } from '../domain/review'

interface Props {
  review: Review
  roundNumber: number
  caseTitle: string
  onShowQuestions: () => void
}

/** 결과에 들어온 직후 긴 목록보다 먼저 읽는 현재 회차 브리핑. 점수나 합격 판정은 만들지 않는다. */
export function InvestigationBrief({ review, roundNumber, caseTitle, onShowQuestions }: Props) {
  const checks = review.byStatus.check.length
  const cautions = review.byStatus.caution.length
  const questions = review.questions.length
  const headline = checks > 0
    ? `${checks}개의 평가 조건을 먼저 확인해야 합니다`
    : cautions > 0
      ? `${cautions}개의 해석 주의를 먼저 읽어야 합니다`
      : questions > 0
        ? `${questions}개의 질문을 다음 회의로 가져가세요`
        : '받은 근거와 평가 조건을 한 장에 정리했습니다'

  return (
    <section className="investigation-brief" aria-labelledby="investigation-brief-title">
      <div className="investigation-brief__lead">
        <p className="investigation-brief__eyebrow">DECISION BRIEF · ROUND {String(roundNumber).padStart(2, '0')}</p>
        <p className="investigation-brief__case">{caseTitle}</p>
        <h3 id="investigation-brief-title">{headline}</h3>
        <p>숫자의 좋고 나쁨을 판정하지 않고, 지금 받은 근거에서 다음에 확인할 일을 앞에 둡니다.</p>
      </div>
      <dl className="investigation-brief__metrics" aria-label="현재 회차 판독 요약">
        <div><dt>확인 필요</dt><dd>{checks}</dd></div>
        <div><dt>해석 주의</dt><dd>{cautions}</dd></div>
        <div><dt>다음 질문</dt><dd>{questions}</dd></div>
      </dl>
      <div className="investigation-brief__next">
        <span>FIRST QUESTION</span>
        <strong>{review.questions[0] ?? '현재 입력에서 추가로 물을 질문이 없습니다.'}</strong>
        {questions > 0 && <button type="button" onClick={onShowQuestions}>질문과 답변으로 이동</button>}
      </div>
      <span className="investigation-brief__boundary">판정 아님 · 근거 확인</span>
    </section>
  )
}
