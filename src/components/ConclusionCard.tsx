import type { Conclusion } from '../domain/conclusion'

interface Props {
  conclusion: Conclusion
  onShowQuestions: () => void
  onOpenLab: (section: 'rank' | 'blind') => void
}

const TONE_LABEL = {
  early: '믿기 전에 확인',
  partial: '숫자 하나가 더 필요',
  shown: '숫자로 직접 판단',
} as const

/** 왜?의 두 줄은 늘 시험 조건 한 줄, 숫자 한 줄이다(domain/conclusion). */
const REASON_TAG = ['시험 조건', '받은 숫자'] as const

/** 결과 맨 위의 결론 · 왜? · 그래서? — 제품 판정이 아니라 광고 숫자를 믿을 근거가 있는지를 쉬운 말로 말한다. */
export function ConclusionCard({ conclusion, onShowQuestions, onOpenLab }: Props) {
  const { figure } = conclusion
  return (
    <section className={`conclusion conclusion--${conclusion.tone}`} aria-labelledby="conclusion-title">
      <div className="conclusion__top">
        <p className="conclusion__eyebrow">
          결론 <span className="conclusion__tone">{TONE_LABEL[conclusion.tone]}</span>
        </p>
        <h3 id="conclusion-title" className="conclusion__headline">{conclusion.headline}</h3>
      </div>

      <div className={`conclusion__body${figure ? ' has-figure' : ''}`}>
        <div className="conclusion__why">
          <p className="conclusion__label">왜?</p>
          <ul className="conclusion__reasons">
            {conclusion.reasons.map((reason, i) => (
              <li key={reason}>
                <span className="conclusion__tag">{REASON_TAG[i]}</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
        {figure && (
          <figure className="conclusion__figure">
            <figcaption className="conclusion__figure-title">{figure.title}</figcaption>
            <ul className="conclusion__bars">
              {figure.bars.map((bar) => (
                <li key={bar.label} className={bar.low ? 'is-low' : undefined}>
                  <span className="conclusion__bar-label">{bar.label}</span>
                  <strong className="conclusion__bar-value">{bar.display}</strong>
                  <span className="conclusion__bar" aria-hidden="true"><span style={{ width: `${Math.max(bar.value, 0.004) * 100}%` }} /></span>
                </li>
              ))}
            </ul>
            <p className="conclusion__figure-note">{figure.caption}</p>
          </figure>
        )}
      </div>

      <div className="conclusion__next-row">
        <div>
          <p className="conclusion__label">그래서?</p>
          <p className="conclusion__next">{conclusion.next}</p>
        </div>
        <button type="button" className="button button--primary" onClick={onShowQuestions}>
          업체에 물을 질문 보기
        </button>
      </div>

      {conclusion.lab.length > 0 && (
        <ul className="conclusion__lab" aria-label="논문 실험실에서 직접 보기">
          {conclusion.lab.map((link) => (
            <li key={link.section}>
              <button type="button" className="lab-link" onClick={() => onOpenLab(link.section)} aria-label={link.label}>
                <span className="lab-link__no">{link.no}</span>
                <span className="lab-link__title">{link.title}</span>
                <span className="lab-link__go" aria-hidden="true">논문 실험실에서 직접 보기 →</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="conclusion__boundary">이 결론은 AI 제품이 좋다·나쁘다는 판정이 아닙니다. 광고 숫자만으로 믿을 근거가 있는지를 말합니다.</p>
    </section>
  )
}
