export type StepNumber = 1 | 2 | 3

export const STEP_TITLES: Record<StepNumber, string> = {
  1: '받은 숫자',
  2: '평가 조건',
  3: '결과와 질문',
}

interface Props {
  current: StepNumber
  onGo: (step: StepNumber) => void
}

/** 현재 단계와 전체 세 단계를 늘 보여 준다. 어느 단계로든 돌아가도 입력은 그대로다. */
export function Stepper({ current, onGo }: Props) {
  return (
    <nav className="stepper" aria-label="검토 단계">
      <ol className="stepper__list">
        {([1, 2, 3] as const).map((n) => (
          <li key={n} className={`stepper__item${n === current ? ' is-current' : ''}${n < current ? ' is-done' : ''}`}>
            <button
              type="button"
              className="stepper__button"
              aria-current={n === current ? 'step' : undefined}
              onClick={() => onGo(n)}
            >
              <span className="stepper__number" aria-hidden="true">
                {n}
              </span>
              <span className="stepper__label">
                <span className="visually-hidden">{n}단계 </span>
                {STEP_TITLES[n]}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
