import { EVIDENCE, SCOPE_NOTE, type EvidenceId } from '../data/paperEvidence'

interface Props {
  ids: readonly EvidenceId[]
  /** 왜 묻는지. 판독 항목의 안내 문장을 넘긴다. */
  why?: string
  summary?: string
}

/**
 * 논문 근거 보기 — 왜 묻는가 → 논문 원문 → 이 연구의 한계 (설계 3-6).
 * 모달 대신 제자리에서 펼친다.
 */
export function EvidenceDetails({ ids, why, summary = '논문 근거 보기' }: Props) {
  return (
    <details className="evidence">
      <summary>{summary}</summary>
      <div className="evidence__body">
        {why && (
          <p className="evidence__why">
            <strong>왜 묻는가</strong> {why}
          </p>
        )}
        {ids.map((id) => {
          const e = EVIDENCE[id]
          return (
            <div key={id} className="evidence__item">
              <p className="evidence__source">
                <span className="evidence__id">{e.id}</span> {e.section} · {e.title}
              </p>
              {e.quotes.map((q) => (
                <blockquote key={q} className="evidence__quote" data-verbatim="true" lang="ko">
                  {q}
                </blockquote>
              ))}
              {e.note && <p className="evidence__note">{e.note}</p>}
            </div>
          )
        })}
        <p className="evidence__scope">
          <strong>이 연구의 한계</strong> {SCOPE_NOTE}
        </p>
      </div>
    </details>
  )
}
