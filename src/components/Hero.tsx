import { forwardRef } from 'react'
import { PAPER, XGB_RANDOM, XGB_UNSEEN } from '../data/paperEvidence'
import { formatRatio } from '../domain/format'
import { ExternalIcon, LockIcon } from './icons'

interface Props {
  onStartExample: () => void
  onStartOwn: () => void
  onOpenCase: (file: File) => void
  caseFileStatus: string
}

/** 화면 A — 누구를 어떻게 돕는지 10초 안에 전달한다. 입력 폼과 긴 연구 한계는 아직 보이지 않는다. */
export const Hero = forwardRef<HTMLHeadingElement, Props>(function Hero({ onStartExample, onStartOwn, onOpenCase, caseFileStatus }, headingRef) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__copy">
        <p className="hero__kicker"><span>CLAIM INVESTIGATION</span> · EVIDENCE-LED POC REVIEW</p>
        <h1 id="hero-title" className="hero__title" tabIndex={-1} ref={headingRef}>
          그 99%, 무엇을 시험한 점수입니까?
        </h1>
        <p className="hero__help">
          보안 AI 도입을 처음 맡은 담당자가 성능표에서 빠진 평가 조건을 찾고, 공급자에게 물을 질문을 논문 근거와 함께 준비하도록
          돕습니다.
        </p>
        <ol className="hero__story" aria-label="ExplainSOC가 하는 세 가지">
          <li><span>01</span><strong>주장을 해부하고</strong></li>
          <li><span>02</span><strong>시험 출처를 추적해</strong></li>
          <li><span>03</span><strong>다음 질문을 남깁니다</strong></li>
        </ol>
        <div className="hero__actions">
          <button type="button" className="button button--primary button--large" onClick={onStartExample}>
            논문 예시로 60초 검토
          </button>
          <button type="button" className="button button--large" onClick={onStartOwn}>
            내 성능표 검토
          </button>
        </div>
        <p className="hero__example-note">논문 값이 채워진 예시로 결과부터 봅니다.</p>
      </div>

      <figure className="hero__figure claim-autopsy">
        <figcaption className="hero__figure-title"><span>CLAIM AUTOPSY</span> 같은 모델, 다른 시험</figcaption>
        <div className="claim-autopsy__claim">
          <span>공급자 성능 주장</span>
          <strong>99.88%</strong>
          <small>정확도 하나만으로는 알 수 없는 것</small>
        </div>
        <div className="claim-autopsy__fork" aria-hidden="true"><span>시험 조건을 열면</span></div>
        <div className="claim-autopsy__trials">
          <HeroBar index="A" label={XGB_RANDOM.splitLabel} value={XGB_RANDOM.reported.macroF1} tone="high" />
          <HeroBar index="B" label={XGB_UNSEEN.splitLabel} value={XGB_UNSEEN.reported.macroF1} tone="low" />
        </div>
        <div className="claim-autopsy__impact">
          <span>미관측 공격 시험의 운영 의미</span>
          <strong>220,788건 중 160건 탐지</strong>
          <small>낮은 오탐률과 공격 탐지 능력은 같은 말이 아닙니다.</small>
        </div>
        <p className="hero__figure-note">Macro F1 · 0부터 1까지의 같은 축 · 원고 V-2</p>
        <p className="hero__figure-ask">받은 99%는 어느 시험의 숫자입니까?</p>
      </figure>

      <div className="hero__meta">
        <div className="hero__case-file">
          <label className="button button--quiet" htmlFor="case-file">검토 파일 열기</label>
          <input
            id="case-file"
            type="file"
            accept=".json,application/json"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              if (file) onOpenCase(file)
              event.currentTarget.value = ''
            }}
          />
          <span>이전에 내려받은 ExplainSOC JSON</span>
        </div>
        <p className="hero__file-status" role="status" aria-live="polite">{caseFileStatus}</p>
        <p className="hero__privacy">
          <LockIcon />
          입력한 성능 자료는 브라우저 메모리에서만 계산됩니다. 파일 저장은 사용자가 눌렀을 때만 이 기기에 내려받습니다.
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
    </section>
  )
})

function HeroBar({ index, label, value, tone }: { index: string; label: string; value: number; tone: 'high' | 'low' }) {
  return (
    <div className={`hero-bar hero-bar--${tone}`}>
      <span className="hero-bar__index">{index}</span>
      <p className="hero-bar__label">
        {label} <strong>{formatRatio(value)}</strong>
      </p>
      <span className="hero-bar__track" aria-hidden="true">
        <span className="hero-bar__fill" style={{ width: `${value * 100}%` }} />
      </span>
    </div>
  )
}
