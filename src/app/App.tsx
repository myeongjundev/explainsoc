import { useEffect, useMemo, useRef, useState } from 'react'
import { ClaimStep } from '../components/ClaimStep'
import { EvaluationQuestions } from '../components/EvaluationQuestions'
import { Hero } from '../components/Hero'
import { ResearchScope } from '../components/ResearchScope'
import { ResultStep } from '../components/ResultStep'
import { STEP_TITLES, Stepper, type StepNumber } from '../components/Stepper'
import { EXAMPLE_A, EXAMPLE_B } from '../data/examples'
import { checkForm, emptyForm, formFromExample, formFromReviewInput, type FormState } from '../domain/form'
import { caseFileToText, combineRoundInput, makeCaseFile, MAX_CASE_FILE_BYTES, parseCaseFileText, resolveRoundInputs, type CaseRound } from '../domain/caseFile'
import { buildReview, buildRoundComparison } from '../domain/review'
import type { QuestionResponse } from '../domain/types'
import type { RoundDraftMeta } from '../components/RoundWorkspace'

type View = 'home' | StepNumber

const STEP_HEADINGS: Record<StepNumber, string> = {
  1: '1. 받은 숫자를 적어 주세요',
  2: '2. 평가 조건에 답해 주세요',
  3: '3. PoC 검토 작업대',
}

const SOURCE_NOTE: Record<FormState['source'], string | null> = {
  exampleA: '논문 예시 A — 숫자와 세 평가 조건을 논문 값으로 미리 채웠습니다. 숫자를 바꾸면 내 입력으로 바뀝니다.',
  exampleB: '논문 예시 B — 숫자와 세 평가 조건을 논문 값으로 미리 채웠습니다. 숫자를 바꾸면 내 입력으로 바뀝니다.',
  user: null,
}

/**
 * 한 페이지 안의 단계형 작업대. 입력은 이 컴포넌트의 메모리에만 있다 —
 * URL, 쿠키, 브라우저 저장소에 넣지 않고, 새로 고치면 사라진다. (scripts/check-safety.mjs가 검사한다)
 */
export function App() {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [view, setView] = useState<View>('home')
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({})
  const [caseTitle, setCaseTitle] = useState('이름 없는 PoC 검토')
  const [rounds, setRounds] = useState<CaseRound[]>([])
  const [roundMeta, setRoundMeta] = useState<RoundDraftMeta>({ label: '1회차 · 최초 주장', sourceKind: 'proposal', sourceNote: '', sameTrial: null })
  const [caseFileStatus, setCaseFileStatus] = useState('')
  const rawCheck = useMemo(() => checkForm(form), [form])
  const previousInput = useMemo(() => resolveRoundInputs(rounds), [rounds])
  const effectiveInput = useMemo(
    () => combineRoundInput(previousInput, rawCheck.input, roundMeta.sameTrial),
    [previousInput, rawCheck.input, roundMeta.sameTrial],
  )
  const check = useMemo(() => ({ ...rawCheck, input: effectiveInput }), [effectiveInput, rawCheck])
  const context = useMemo(() => ({
    isFollowup: rounds.length > 0,
    sameTrial: roundMeta.sameTrial,
    hasReceivedEvidence: Object.keys(rawCheck.input.claim).length > 0 || Boolean(rawCheck.input.matrix),
  }), [rawCheck.input, roundMeta.sameTrial, rounds.length])
  const review = useMemo(() => buildReview(effectiveInput, context), [context, effectiveInput])
  const previousReview = useMemo(() => {
    const previous = rounds.at(-1)
    if (!previous || !previousInput) return null
    return buildReview(previousInput, {
      isFollowup: rounds.length > 1,
      sameTrial: previous.sameTrial,
      hasReceivedEvidence: Object.keys(previous.input.claim).length > 0 || Boolean(previous.input.matrix),
    })
  }, [previousInput, rounds])
  const comparison = useMemo(
    () => previousReview ? buildRoundComparison(previousReview, review, roundMeta.sameTrial) : null,
    [previousReview, review, roundMeta.sameTrial],
  )

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

  const resetCase = (nextForm: FormState = emptyForm()) => {
    setForm(nextForm)
    setResponses({})
    setRounds([])
    setCaseTitle('이름 없는 PoC 검토')
    setCaseFileStatus('')
    setRoundMeta({ label: '1회차 · 최초 주장', sourceKind: 'proposal', sourceNote: '', sameTrial: null })
  }

  const currentRound = (): CaseRound => ({
    id: `r${rounds.length + 1}`,
    label: roundMeta.label.trim() || `${rounds.length + 1}회차`,
    sourceKind: roundMeta.sourceKind,
    sourceNote: roundMeta.sourceNote,
    sameTrial: roundMeta.sameTrial,
    input: rawCheck.input,
    responses: { ...responses },
  })

  const nextRound = () => {
    const saved = currentRound()
    setRounds((current) => [...current, saved])
    setForm(emptyForm())
    setResponses({ ...saved.responses })
    setRoundMeta({ label: `${rounds.length + 2}회차 · 공급자 답변`, sourceKind: 'vendor-response', sourceNote: '', sameTrial: 'unknown' })
    go(1)
  }

  const downloadCase = () => {
    const blob = new Blob([caseFileToText(makeCaseFile(caseTitle, [...rounds, currentRound()]))], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'explainsoc-case.json'
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const openCase = async (file: File) => {
    if (file.size > MAX_CASE_FILE_BYTES) {
      setCaseFileStatus('사례 파일은 1 MiB 이하여야 합니다.')
      return
    }
    let text: string
    try {
      text = await file.text()
    } catch {
      setCaseFileStatus('파일을 읽지 못했습니다. 다시 선택해 주세요.')
      return
    }
    const parsed = parseCaseFileText(text)
    if (parsed.kind === 'error') {
      setCaseFileStatus(parsed.message)
      return
    }
    const current = parsed.value.rounds.at(-1)!
    setCaseTitle(parsed.value.title)
    setRounds(parsed.value.rounds.slice(0, -1))
    setRoundMeta({ label: current.label, sourceKind: current.sourceKind, sourceNote: current.sourceNote, sameTrial: current.sameTrial })
    setForm(formFromReviewInput(current.input))
    setResponses(current.responses)
    setCaseFileStatus(`‘${parsed.value.title}’ 파일을 열었습니다.`)
    go(3)
  }

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
              resetCase(formFromExample(EXAMPLE_A))
              setCaseTitle('논문 예시 검토')
              go(3)
            }}
            onStartOwn={() => {
              resetCase()
              go(1)
            }}
            onOpenCase={openCase}
            caseFileStatus={caseFileStatus}
          />
        ) : (
          <div className="workbench">
            <Stepper current={view} onGo={go} />
            <div className="step-head">
              <h2 className="step-title" tabIndex={-1} ref={stepHeading}>
                {STEP_HEADINGS[view]}
              </h2>
              {SOURCE_NOTE[form.source] && <p className="step-source">{SOURCE_NOTE[form.source]}</p>}
              {rounds.length > 0 && view !== 3 && (
                <p className="followup-banner">
                  <strong>{rounds.length + 1}회차</strong> · 이번에 새로 받은 자료만 적으세요. 비운 칸은 이전 회차 값을 이어 씁니다.
                </p>
              )}
            </div>

            {view === 1 && (
              <>
                <ClaimStep
                  form={form}
                  check={rawCheck}
                  onRowsChange={(metricRows) => editNumbers({ metricRows })}
                  onMatrixOpen={(matrixOpen) => editConditions({ matrixOpen })}
                  onMatrixChange={(matrix) => editNumbers({ matrix })}
                  onClaimedBest={(claimedBest) => editConditions({ claimedBest })}
                  onFillExampleB={() => setForm(formFromExample(EXAMPLE_B))}
                  previous={previousInput}
                />
                <p className="visually-hidden" role="status">
                  {rawCheck.errorCount > 0 ? `잘못 적은 칸 ${rawCheck.errorCount}개는 계산에서 뺍니다.` : ''}
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
                  previous={previousInput}
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
                onEditConditions={() => go(2)}
                responses={responses}
                onResponse={(question, response) => setResponses((current) => ({ ...current, [question]: response }))}
                caseTitle={caseTitle}
                onCaseTitle={setCaseTitle}
                rounds={rounds}
                roundMeta={roundMeta}
                onRoundMeta={setRoundMeta}
                comparison={comparison}
                onNextRound={nextRound}
                onDownload={downloadCase}
                caseFileStatus={caseFileStatus}
                onRestart={() => {
                  resetCase()
                  go('home')
                }}
              />
            )}
          </div>
        )}

        {view !== 'home' && <ResearchScope />}
      </main>

      <footer className="site-footer">
        <p>ExplainSOC · SKT ALEPH 마지막 과제 B · 입력한 값은 외부 서버로 전송되지 않습니다.</p>
        <p>
          <a href="https://github.com/myeongjundev/explainsoc" target="_blank" rel="noopener noreferrer">
            앱 소스 저장소{' '}<span className="visually-hidden">(외부 링크, 새 탭)</span>
          </a>
        </p>
      </footer>
    </div>
  )
}
