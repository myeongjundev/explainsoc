import { useId, type ReactNode } from 'react'

interface Option<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  legend: string
  name: string
  options: readonly Option<T>[]
  value: T | null
  onChange: (value: T) => void
  help?: ReactNode
  context?: ReactNode
}

/**
 * 예 / 아니오 / 모름 같은 선택. 기본 라디오라서 화살표 키로 고를 수 있다.
 * 도움말은 옆에 두되 읽기를 강요하지 않는다 (설계 6-C).
 */
export function ChoiceGroup<T extends string>({ legend, name, options, value, onChange, help, context }: Props<T>) {
  const helpId = useId()
  const contextId = useId()
  const describedBy = [context ? contextId : '', help ? helpId : ''].filter(Boolean).join(' ') || undefined
  return (
    <fieldset className="choice" aria-describedby={describedBy}>
      <legend className="choice__legend">{legend}</legend>
      {context && <div className="choice__context" id={contextId}>{context}</div>}
      <div className="choice__options">
        {options.map((o) => (
          <label key={o.value} className="choice__option">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      {help && (
        <details className="choice__help" id={helpId}>
          <summary>용어 도움말</summary>
          <div>{help}</div>
        </details>
      )}
    </fieldset>
  )
}
