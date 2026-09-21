import { useEffect, useMemo, useRef, useState } from 'react'
import { ClaimStep } from '../components/ClaimStep'
import { EvaluationQuestions } from '../components/EvaluationQuestions'
import { Hero } from '../components/Hero'
import { ResearchScope } from '../components/ResearchScope'
import { ResultStep } from '../components/ResultStep'
import { STEP_TITLES, Stepper, type StepNumber } from '../components/Stepper'
import { EXAMPLE_A, EXAMPLE_B } from '../data/examples'
import { checkForm, emptyForm, formFromExample, type FormState } from '../domain/form'
import { buildReview } from '../domain/review'

type View = 'home' | StepNumber

const STEP_HEADINGS: Record<StepNumber, string> = {
  1: '1. 받은 숫자를 적어 주세요',
  2: '2. 평가 조건에 답해 주세요',
  3: '3. 결과와 질문',
}

const SOURCE_NOTE: Record<FormState['source'], string | null> = {
  exampleA: '논문 예시 A — 미관측 공격 스트레스 테스트의 XGBoost 값으로 채웠습니다. 숫자를 바꾸면 내 입력으로 바뀝니다.',
  exampleB: '논문 예시 B — 계층화 무작위 분할의 XGBoost 값으로 채웠습니다. 숫자를 바꾸면 내 입력으로 바뀝니다.',
  user: null,
}

/**
 * 한 페이지 안의 단계형 작업대. 입력은 이 컴포넌트의 메모리에만 있다 —
 * URL, 쿠키, localStorage에 넣지 않고, 새로 고치면 사라진다.
 */
export function App() {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [view, setView] = useState<View>('home')
  const check = useMemo(() => checkForm(form), [form])
  const review = useMemo(() => buildReview(check.input), [check])

  const heroHeading = useRef<HTMLHeadingElement>(null)
  const stepHeading = useRef<HTMLHeadingElement>(null)
  const focusAfterNavigate = useRef(false)

  useEffect(() => {
    if (!focusAfterNavigate.current) return
    focusAfterNavigate.current = false
    window.scrollTo({ top: 0 })
    ;(view === 'home' ? heroHeading.current : stepHeading.current)?.focus()
  }, [view])

  const go = (next: View) => {
    focusAfterNavigate.current = true
    setView(next)
  }

  // 숫자를 고치면 더는 논문 예시가 아니다. 평가 조건만 바꾸면 숫자는 여전히 논문의 것이다.
  const editNumbers = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch, source: 'user' }))
  const editConditions = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        본문으로 바로 가기
      </a>
      <header className="site-header">
        <p className="site-header__brand">
          <span className="site-header__name">ExplainSOC</span>
          <span className="site-header__tag">성능표에 없는 질문</span>
        </p>
      </header>

      <main id="main" className="site-main">
        {view === 'home' ? (
          <Hero
            ref={heroHeading}
            onStartExample={() => {
              setForm(formFromExample(EXAMPLE_A))
              go(3)
            }}
            onStartOwn={() => go(1)}
          />
        ) : (
          <div className="workbench">
            <Stepper current={view} onGo={go} />
            <div className="step-head">
              <h2 className="step-title" tabIndex={-1} ref={stepHeading}>
                {STEP_HEADINGS[view]}
              </h2>
              {SOURCE_NOTE[form.source] && <p className="step-source">{SOURCE_NOTE[form.source]}</p>}
            </div>

            {view === 1 && (
              <>
                <ClaimStep
                  form={form}
                  check={check}
                  onRowsChange={(metricRows) => editNumbers({ metricRows })}
                  onMatrixOpen={(matrixOpen) => editNumbers({ matrixOpen })}
                  onMatrixChange={(matrix) => editNumbers({ matrix })}
                  onClaimedBest={(claimedBest) => editConditions({ claimedBest })}
                  onFillExampleB={() => setForm(formFromExample(EXAMPLE_B))}
                />
                <p className="visually-hidden" role="status">
                  {check.errorCount > 0 ? `잘못 적은 칸 ${check.errorCount}개는 계산에서 뺍니다.` : ''}
                </p>
                <div className="step-actions">
                  <button type="button" className="button button--primary" onClick={() => go(2)}>
                    다음: {STEP_TITLES[2]}
                  </button>
                </div>
              </>
            )}

            {view === 2 && (
              <>
                <EvaluationQuestions
                  form={form}
                  onSplit={(split) => editConditions({ split })}
                  onUnseen={(unseenIncluded) => editConditions({ unseenIncluded })}
                  onDedup={(deduplicated) => editConditions({ deduplicated })}
                />
                <div className="step-actions">
                  <button type="button" className="button" onClick={() => go(1)}>
                    이전
                  </button>
                  <button type="button" className="button button--primary" onClick={() => go(3)}>
                    결과 보기
                  </button>
                </div>
              </>
            )}

            {view === 3 && (
              <ResultStep
                check={check}
                review={review}
                onEdit={() => go(1)}
                onRestart={() => {
                  setForm(emptyForm())
                  go('home')
                }}
              />
            )}
          </div>
        )}

        {view !== 'home' && <ResearchScope />}
      </main>

      <footer className="site-footer">
        <p>ExplainSOC · SKT ALEPH 마지막 과제 B · 입력한 값은 이 브라우저 밖으로 나가지 않습니다.</p>
        <p>
          <a href="https://github.com/myeongjundev/explainsoc" target="_blank" rel="noopener noreferrer">
            앱 소스 저장소{' '}<span className="visually-hidden">(외부 링크, 새 탭)</span>
          </a>
        </p>
      </footer>
    </div>
  )
}
