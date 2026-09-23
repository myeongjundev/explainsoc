import { useId, type ReactNode } from 'react'

interface Option<T extends string> {
  value: T
  label: string
  /** 큰 선택지에서만 보이는 한 줄 설명. */
  description?: string
}

interface Props<T extends string> {
  legend: ReactNode
  name: string
  options: readonly Option<T>[]
  value: T | null
  onChange: (value: T) => void
  help?: ReactNode
  context?: ReactNode
  /** large: 한 화면에 질문 하나씩, 큰 카드. row: 한 장짜리 폼, 붙은 단추와 짧은 설명. */
  size?: 'default' | 'large' | 'row'
}

/**
 * 예 / 아니오 / 모름 같은 선택. 기본 라디오라서 화살표 키로 고를 수 있다.
 * 도움말은 옆에 두되 읽기를 강요하지 않는다 (설계 6-C).
 */
export function ChoiceGroup<T extends string>({ legend, name, options, value, onChange, help, context, size = 'default' }: Props<T>) {
  const helpId = useId()
  const contextId = useId()
  const describedBy = [context ? contextId : '', help ? helpId : ''].filter(Boolean).join(' ') || undefined
  return (
    <fieldset className={`choice${size === 'default' ? '' : ` choice--${size}`}`} aria-describedby={describedBy}>
      <legend className="choice__legend">{legend}</legend>
      {context && <div className="choice__context" id={contextId}>{context}</div>}
      <div className="choice__options">
        {options.map((o) => (
          <label key={o.value} className={`choice__option${o.value === 'unknown' ? ' choice__option--unknown' : ''}`}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span className="choice__text">
              <span className="choice__label">{o.label}</span>
              {size === 'large' && o.description && <span className="choice__desc">{o.description}</span>}
            </span>
          </label>
        ))}
      </div>
      {help && (
        size === 'large' ? (
          <div className="choice__why" id={helpId}>{help}</div>
        ) : size === 'row' ? (
          <div className="choice__note" id={helpId}>{help}</div>
        ) : (
          <details className="choice__help" id={helpId}>
            <summary>용어 도움말</summary>
            <div>{help}</div>
          </details>
        )
      )}
    </fieldset>
  )
}
