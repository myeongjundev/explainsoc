const TERMS = [
  ['TN', '정상 흐름을 정상으로 맞게 본 건수'],
  ['FP', '정상 흐름을 공격으로 본 오탐 건수'],
  ['FN', '공격을 정상으로 놓친 미탐 건수'],
  ['TP', '공격을 공격으로 탐지한 건수'],
  ['공격 Recall', '실제 공격 가운데 탐지한 비율'],
  ['FPR', '실제 정상 가운데 공격으로 오탐한 비율'],
  ['Macro F1', '정상과 공격의 F1을 같은 비중으로 평균한 값'],
] as const

export function TerminologyHelp() {
  return (
    <details className="panel terminology">
      <summary>숫자와 용어 풀이</summary>
      <dl>{TERMS.map(([term, meaning]) => <div key={term}><dt>{term}</dt><dd>{meaning}</dd></div>)}</dl>
    </details>
  )
}
