import { forwardRef } from 'react'
import { PAPER, UNSEEN_TEST_COMPOSITION, XGB_RANDOM, XGB_UNSEEN } from '../data/paperEvidence'
import { formatCount } from '../domain/format'
import { ExternalIcon, LockIcon } from './icons'

interface Props {
  onStartExample: () => void
  onStartOwn: () => void
  onStartBrochure: () => void
  onOpenCase: (file: File) => void
  caseFileStatus: string
}

/**
 * 화면 A — 누구를 어떻게 돕는지 10초 안에 전달한다. 입력 폼과 긴 연구 한계는 아직 보이지 않는다.
 * V9: 비전공자도 알아듣게 시험 공부에 빗댄다. 첫 화면에는 분할·지표 같은 전문 용어를 두지 않고,
 * 점수는 논문 Macro F1을 100점 만점으로 옮긴 값임을 그림 아래에 밝힌다(설계 31절).
 */
export const Hero = forwardRef<HTMLHeadingElement, Props>(function Hero({ onStartExample, onStartOwn, onStartBrochure, onOpenCase, caseFileStatus }, headingRef) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__copy">
        <p className="hero__kicker"><span>보안 AI 광고 숫자 확인</span> · 판매 업체에 물을 질문 만들기</p>
        <h1 id="hero-title" className="hero__title" tabIndex={-1} ref={headingRef}>
          <span className="hero__title-line">보안 AI의 99점,</span>{' '}
          <span className="hero__title-line">처음 보는 공격에서도</span>{' '}
          <span className="hero__title-line">99점일까요?</span>
        </h1>
        <p className="hero__help">
          광고의 <strong>“정확도 99%”</strong>는 AI가 <strong>이미 배운 종류의 공격</strong>으로 치른 시험 점수일 수 있습니다.
          시험 공부로 치면 <strong>연습문제를 그대로 낸 시험</strong>입니다.
        </p>
        <p className="hero__scenario"><strong>이 사이트가 하는 일.</strong> 받은 광고 숫자가 어떤 시험의 점수인지 확인하고,
          판매 업체에 물어볼 질문을 만들어 줍니다. 회사에서 보안 AI 제품 자료를 받았을 때 씁니다.</p>
        <ol className="hero__story" aria-label="ExplainSOC가 하는 세 가지">
          <li><span>01</span><strong>받은 광고 문장이나 숫자를 넣고</strong></li>
          <li><span>02</span><strong>모르는 시험 조건에 답하면</strong></li>
          <li><span>03</span><strong>업체에 물을 질문이 완성됩니다</strong></li>
        </ol>
        <div className="hero__actions">
          <button type="button" className="button button--primary button--large" onClick={onStartExample}>
            예시로 바로 보기
          </button>
        </div>
        <p className="hero__example-note">숫자를 준비하지 않아도 됩니다. 논문 속 실제 시험 결과로 한 번 보여 줍니다.</p>
        <div className="hero__own">
          <span>내 자료로 해 보기</span>
          <button type="button" className="button button--quiet" onClick={onStartBrochure}>
            소개서 문장 붙여 넣기
          </button>
          <button type="button" className="button button--quiet" onClick={onStartOwn}>
            숫자로 직접 입력
          </button>
        </div>
      </div>

      <figure className="hero__figure claim-autopsy">
        <figcaption className="hero__figure-title">같은 AI, 두 번의 시험</figcaption>
        <div className="claim-autopsy__claim">
          <span>광고에 적힌 숫자 (예)</span>
          <strong>{percent(XGB_RANDOM.reported.accuracy)}</strong>
          <small>어떤 시험의 점수인지는 적혀 있지 않습니다</small>
        </div>
        <div className="claim-autopsy__fork" aria-hidden="true"><span>어떤 시험이었는지 열어 보면</span></div>
        <div className="claim-autopsy__trials">
          <HeroBar index="A" label="이미 배운 종류의 공격으로 시험" hint="연습문제를 그대로 낸 시험" value={XGB_RANDOM.reported.macroF1} tone="high" />
          <HeroBar index="B" label="처음 보는 종류의 공격으로 시험" hint="처음 보는 문제를 낸 시험" value={XGB_UNSEEN.reported.macroF1} tone="low" />
        </div>
        <div className="claim-autopsy__impact">
          <span>처음 보는 공격 시험에서</span>
          <strong>공격 {formatCount(UNSEEN_TEST_COMPOSITION.attack)}건 중 {formatCount(XGB_UNSEEN.matrix.tp)}건만 잡았습니다</strong>
          <small>정상 흐름을 공격으로 잘못 알린 일은 적었지만, 공격도 거의 다 놓쳤습니다.</small>
        </div>
        <p className="hero__figure-note">
          점수는 논문(원고 V-2)의 Macro F1(0~1)을 100점 만점으로 옮긴 값입니다. {percent(XGB_RANDOM.reported.accuracy)}는 A 시험의 정확도입니다.
        </p>
        <p className="hero__figure-ask">받은 99%는 어느 시험의 점수입니까?</p>
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

/** 0부터 1 사이 비율을 백분율로. 논문 숫자에만 쓴다. */
const percent = (v: number) => `${Number((v * 100).toFixed(2))}%`

/** 100점 만점으로 옮긴 점수. 소수 첫째 자리까지. */
const score = (v: number) => `${(v * 100).toFixed(1)}점`

function HeroBar({ index, label, hint, value, tone }: { index: string; label: string; hint: string; value: number; tone: 'high' | 'low' }) {
  return (
    <div className={`hero-bar hero-bar--${tone}`}>
      <span className="hero-bar__index">{index}</span>
      <p className="hero-bar__label">
        {label} <small className="hero-bar__hint">{hint}</small> <strong>{score(value)}</strong>
      </p>
      <span className="hero-bar__track" aria-hidden="true">
        <span className="hero-bar__fill" style={{ width: `${value * 100}%` }} />
      </span>
    </div>
  )
}
