import type { Review } from '../domain/review'

interface Props {
  review: Review
  roundNumber: number
  caseTitle: string
  /** 계산에서 뺀 칸 수. 판독 장을 열지 않아도 이 사실을 먼저 알린다. */
  errorCount: number
}

/**
 * 결과 목차 위의 검토 요약 한 줄. 점수나 합격 판정은 만들지 않는다.
 * V10: 결론과 첫 질문은 결론 카드가 말하므로, 여기서는 회차와 판독 개수, 계산에서 뺀 칸만 알린다(설계 32절).
 */
export function InvestigationBrief({ review, roundNumber, caseTitle, errorCount }: Props) {
  return (
    <section className="investigation-brief" aria-label="검토 요약">
      <p className="investigation-brief__eyebrow">
        검토 요약 · {roundNumber}회차 · <span className="investigation-brief__case">{caseTitle}</span>
      </p>
      <dl className="investigation-brief__metrics" aria-label="현재 회차 판독 요약">
        <div><dt>확인 필요</dt><dd>{review.byStatus.check.length}</dd></div>
        <div><dt>해석 주의</dt><dd>{review.byStatus.caution.length}</dd></div>
        <div><dt>다음 질문</dt><dd>{review.questions.length}</dd></div>
      </dl>
      <span className="investigation-brief__boundary">판정 아님 · 근거 확인</span>
      {errorCount > 0 && (
        <p className="investigation-brief__warn">
          잘못 적은 칸 {errorCount}개는 계산에서 뺐습니다. 아래 ‘입력 수정’에서 고칠 수 있습니다.
        </p>
      )}
    </section>
  )
}
