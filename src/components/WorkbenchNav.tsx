export type WorkbenchChapter = 'evidence' | 'findings' | 'output'

interface Props {
  active: WorkbenchChapter
  onSelect: (chapter: WorkbenchChapter) => void
}

const CHAPTERS: { id: WorkbenchChapter; target: string; number: string; label: string }[] = [
  { id: 'evidence', target: 'evidence-column', number: '01', label: '주장·근거' },
  { id: 'findings', target: 'findings-title', number: '02', label: '판독' },
  { id: 'output', target: 'questions-title', number: '03', label: '다음 행동' },
]

export function WorkbenchNav({ active, onSelect }: Props) {
  const select = (chapter: WorkbenchChapter, target: string) => {
    onSelect(chapter)
    window.requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ block: 'start' }))
  }

  return (
    <nav className="workbench-nav" aria-label="PoC 작업대 바로 가기">
      <span className="workbench-nav__label">REVIEW MAP</span>
      {CHAPTERS.map((chapter) => (
        <button
          key={chapter.id}
          type="button"
          aria-pressed={active === chapter.id}
          onClick={() => select(chapter.id, chapter.target)}
        >
          <span>{chapter.number}</span> {chapter.label}
        </button>
      ))}
      <a href="#round-comparison"><span>04</span> 회차 기록</a>
      <a href="#brief-title"><span>05</span> 최종 산출물</a>
    </nav>
  )
}
