export type WorkbenchChapter = 'evidence' | 'findings' | 'output'

interface Props {
  active: WorkbenchChapter
  onSelect: (chapter: WorkbenchChapter) => void
}

const CHAPTERS: { id: WorkbenchChapter; target: string; number: string; label: string }[] = [
  { id: 'evidence', target: 'evidence-column', number: '1', label: '주장과 근거' },
  { id: 'findings', target: 'findings-title', number: '2', label: '판독' },
  { id: 'output', target: 'questions-title', number: '3', label: '다음 행동' },
]

export function WorkbenchNav({ active, onSelect }: Props) {
  const select = (chapter: WorkbenchChapter, target: string) => {
    onSelect(chapter)
    window.requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView?.({ block: 'start' }))
  }

  return (
    <nav className="workbench-nav" aria-label="결과 목차">
      {CHAPTERS.map((chapter) => (
        <button
          key={chapter.id}
          type="button"
          aria-pressed={active === chapter.id}
          onClick={() => select(chapter.id, chapter.target)}
        >
          <span className="workbench-nav__n" aria-hidden="true">{chapter.number}</span>
          {chapter.label}
        </button>
      ))}
      <span className="workbench-nav__spacer" aria-hidden="true" />
      <a href="#round-comparison">회차 기록</a>
      <a href="#brief-title">검토표</a>
    </nav>
  )
}
