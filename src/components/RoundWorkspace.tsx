import type { CaseRound, RoundSourceKind } from '../domain/caseFile'
import type { Finding, ReviewDiff, RoundComparison } from '../domain/review'
import type { TriAnswer } from '../domain/types'

export interface RoundDraftMeta {
  label: string
  sourceKind: RoundSourceKind
  sourceNote: string
  sameTrial: TriAnswer | null
}

interface Props {
  caseTitle: string
  onCaseTitle: (value: string) => void
  rounds: readonly CaseRound[]
  current: RoundDraftMeta
  onCurrent: (value: RoundDraftMeta) => void
  comparison: RoundComparison | null
  onNextRound: () => void
  onDownload: () => void
}

const SOURCE_OPTIONS: { value: RoundSourceKind; label: string }[] = [
  { value: 'proposal', label: '최초 제안서' },
  { value: 'vendor-response', label: '공급자 답변' },
  { value: 'additional-test', label: '추가 시험' },
  { value: 'other', label: '기타' },
]

export function RoundWorkspace({ caseTitle, onCaseTitle, rounds, current, onCurrent, comparison, onNextRound, onDownload }: Props) {
  const followup = rounds.length > 0
  return (
    <section className="panel rounds" id="round-comparison" aria-labelledby="rounds-title">
      <div className="brief__head">
        <div>
          <p className="brief__eyebrow">EVIDENCE TIMELINE · 회차별 근거</p>
          <h3 id="rounds-title" className="panel__title">주장이 어떻게 바뀌었습니까?</h3>
        </div>
        <span className="brief__privacy">로컬 파일로만 저장</span>
      </div>

      <div className="rounds__case">
        <label className="rounds__label" htmlFor="case-title">사례 이름</label>
        <input id="case-title" value={caseTitle} maxLength={200} onChange={(e) => onCaseTitle(e.target.value)} />
      </div>

      <ol className="rounds__timeline" aria-label="검토 회차">
        {rounds.map((round) => (
          <li key={round.id}>
            <span>{round.id.replace('r', '')}</span>
            <strong>{round.label}</strong>
            <small>{SOURCE_OPTIONS.find((item) => item.value === round.sourceKind)?.label}</small>
          </li>
        ))}
        <li className={`is-current${followup ? ` is-${current.sameTrial ?? 'unknown'}` : ''}`}>
          <span>{rounds.length + 1}</span>
          <strong>{current.label || `회차 ${rounds.length + 1}`}</strong>
          <small>현재 작성 중</small>
          {followup && <em className="rounds__branch-label">{current.sameTrial === 'yes' ? '같은 시험 병합' : current.sameTrial === 'no' ? '별도 시험 분기' : '출처 확인 전 임시 연결'}</em>}
        </li>
      </ol>

      <div className="rounds__meta">
        <div>
          <label htmlFor="round-label">회차 이름</label>
          <input id="round-label" value={current.label} maxLength={120} onChange={(e) => onCurrent({ ...current, label: e.target.value })} />
        </div>
        <div>
          <label htmlFor="round-source">자료 출처</label>
          <select id="round-source" value={current.sourceKind} onChange={(e) => onCurrent({ ...current, sourceKind: e.target.value as RoundSourceKind })}>
            {SOURCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        {followup && (
          <div className="rounds__same-trial">
            <label htmlFor="same-trial">기존 주장과 같은 시험입니까?</label>
            <select id="same-trial" value={current.sameTrial ?? 'unknown'} onChange={(e) => onCurrent({ ...current, sameTrial: e.target.value as TriAnswer })}>
              <option value="yes">예 — 같은 시험으로 합쳐 보기</option>
              <option value="no">아니오 — 별도 시험</option>
              <option value="unknown">모름 — 임시 비교 후 출처 확인</option>
            </select>
          </div>
        )}
        <div className="rounds__note">
          <label htmlFor="source-note">출처 메모</label>
          <textarea id="source-note" rows={3} maxLength={1000} value={current.sourceNote} placeholder="예: 9월 22일 공급자 회신, 시험 ID는 아직 확인 중" onChange={(e) => onCurrent({ ...current, sourceNote: e.target.value })} />
        </div>
      </div>

      {comparison?.kind === 'separate'
        ? <SeparateTrialView previous={comparison.previous} current={comparison.current} />
        : comparison && <DiffView diff={comparison.diff} provisional={comparison.kind === 'provisional'} />}

      <p className="rounds__privacy">내려받는 JSON에 입력한 숫자와 답변 메모가 포함됩니다. 앱은 자동 저장하거나 전송하지 않습니다.</p>
      <div className="brief__actions">
        <button type="button" className="button button--primary" onClick={onNextRound} disabled={rounds.length >= 19}>현재 회차 저장 · 다음 답변 추가</button>
        <button type="button" className="button" onClick={onDownload}>사례 JSON 내려받기</button>
      </div>
      {rounds.length >= 19 && <p className="rounds__limit">한 사례에는 회차를 최대 20개까지 담을 수 있습니다.</p>}
    </section>
  )
}

function FindingItems({ items }: { items: Finding[] }) {
  return items.length > 0
    ? <ul>{items.map((item) => <li key={item.ruleId}><strong>{item.ruleId}</strong> {item.title}</li>)}</ul>
    : <p>해당 없음</p>
}

function SeparateTrialView({ previous, current }: { previous: Finding[]; current: Finding[] }) {
  return (
    <div className="round-diff round-diff--separate">
      <div className="round-diff__head">
        <h4>별도 시험 판독</h4>
        <span>이전 판독은 해결된 것으로 보지 않습니다</span>
      </div>
      <p className="round-diff__separate-note">이번 자료는 기존 주장과 다른 시험입니다. 두 시험의 판독을 따로 확인하세요.</p>
      <div className="round-diff__grid round-diff__grid--separate">
        <section className="round-diff__group round-diff__group--previous">
          <h5>이전 시험 판독 <span>{previous.length}개</span></h5>
          <FindingItems items={previous} />
        </section>
        <section className="round-diff__group round-diff__group--current">
          <h5>이번 별도 시험 판독 <span>{current.length}개</span></h5>
          <FindingItems items={current} />
        </section>
      </div>
    </div>
  )
}

function DiffView({ diff, provisional }: { diff: ReviewDiff; provisional: boolean }) {
  const groups = [
    { key: 'resolved', title: '해결됨', items: diff.resolved },
    { key: 'remaining', title: '남음', items: diff.remaining },
    { key: 'added', title: '새로 생김', items: diff.added },
  ] as const
  return (
    <div className="round-diff">
      <div className="round-diff__head">
        <h4>이전 회차와 비교</h4>
        {provisional && <span>출처 확인 전 임시 비교</span>}
      </div>
      <div className="round-diff__grid">
        {groups.map((group) => (
          <section key={group.key} className={`round-diff__group round-diff__group--${group.key}`}>
            <h5>{group.title} <span>{group.items.length}개</span></h5>
            <FindingItems items={group.items} />
          </section>
        ))}
      </div>
    </div>
  )
}
