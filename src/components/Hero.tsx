import { forwardRef } from 'react'
import { PAPER, XGB_RANDOM, XGB_UNSEEN } from '../data/paperEvidence'
import { formatRatio } from '../domain/format'
import { ExternalIcon, LockIcon } from './icons'

interface Props {
  onStartExample: () => void
  onStartOwn: () => void
}

/** 화면 A — 누구를 어떻게 돕는지 10초 안에 전달한다. 입력 폼과 긴 연구 한계는 아직 보이지 않는다. */
export const Hero = forwardRef<HTMLHeadingElement, Props>(function Hero({ onStartExample, onStartOwn }, headingRef) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__copy">
        <h1 id="hero-title" className="hero__title" tabIndex={-1} ref={headingRef}>
          그 99%, 무엇을 시험한 점수입니까?
        </h1>
        <p className="hero__help">
          보안 AI 도입을 처음 맡은 담당자가 성능표에서 빠진 평가 조건을 찾고, 공급자에게 물을 질문을 논문 근거와 함께 준비하도록
          돕습니다.
        </p>
        <div className="hero__actions">
          <button type="button" className="button button--primary button--large" onClick={onStartExample}>
            논문 예시로 60초 검토
          </button>
          <button type="button" className="button button--large" onClick={onStartOwn}>
            내 성능표 검토
          </button>
        </div>
        <p className="hero__privacy">
          <LockIcon />
          입력한 성능 자료는 이 브라우저 안에서만 계산되며 저장하거나 전송하지 않습니다.
        </p>
        <div className="hero__paper">
          <p>
            <span className="hero__paper-label">반영한 논문</span> · {PAPER.title}
          </p>
          <p className="hero__links">
            <a href={PAPER.repoUrl} target="_blank" rel="noopener noreferrer">
              논문 저장소
              {' '}<span className="visually-hidden">(외부 링크, 새 탭)</span>
              <ExternalIcon />
            </a>
            <a href={PAPER.pdfUrl} target="_blank" rel="noopener noreferrer">
              논문 PDF
              {' '}<span className="visually-hidden">(외부 링크, 새 탭)</span>
              <ExternalIcon />
            </a>
          </p>
        </div>
      </div>

      <figure className="hero__figure">
        <figcaption className="hero__figure-title">같은 XGBoost, 다른 시험</figcaption>
        <HeroBar label={XGB_RANDOM.splitLabel} value={XGB_RANDOM.reported.macroF1} />
        <HeroBar label={XGB_UNSEEN.splitLabel} value={XGB_UNSEEN.reported.macroF1} />
        <p className="hero__figure-note">Macro F1 · 0부터 1까지의 같은 축 · 원고 V-2</p>
        <p className="hero__figure-ask">받은 99%는 어느 쪽을 시험한 점수입니까?</p>
      </figure>
    </section>
  )
})

function HeroBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="hero-bar">
      <p className="hero-bar__label">
        {label} <strong>{formatRatio(value)}</strong>
      </p>
      <span className="hero-bar__track" aria-hidden="true">
        <span className="hero-bar__fill" style={{ width: `${value * 100}%` }} />
      </span>
    </div>
  )
}
