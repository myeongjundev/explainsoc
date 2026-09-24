import { Fragment } from 'react'
import { EVIDENCE, EXPLANATION_STABILITY, MODEL_TABLE, PERMUTATION, XGB_RANDOM, XGB_UNSEEN } from '../data/paperEvidence'
import { MAX_BROCHURE_CHARS, type BrochureMark, type BrochureRead } from '../domain/brochure'
import { formatCount, formatRatio, METRIC_LABEL } from '../domain/format'
import type { Finding, Review } from '../domain/review'
import type { RuleId } from '../domain/reviewRules'
import type { MetricKind } from '../domain/types'
import { LockIcon } from './icons'
import type { LabSection } from './PaperLab'

interface Props {
  text: string
  onText: (text: string) => void
  read: BrochureRead
  review: Review
  onUseExample: () => void
  onFinish: () => void
  onAnswerMissing: () => void
  onOpenLab: (section: LabSection) => void
}

type Tone = 'claim' | 'condition'

interface Note {
  tone: Tone
  label: string
  reading: string
  paper?: { text: string; verbatim: boolean; source: string }
  rules: RuleId[]
  /** 논문 실험실에서 직접 볼 수 있는 실험 */
  lab?: LabSection
}

const f = formatRatio

const PAPER_BY_METRIC: Record<MetricKind, string> = {
  accuracy: `논문에서 같은 XGBoost의 정확도는 ${XGB_RANDOM.splitLabel} ${f(XGB_RANDOM.reported.accuracy)}, ${XGB_UNSEEN.splitLabel} ${f(XGB_UNSEEN.reported.accuracy)}였습니다. 어느 시험의 숫자인지가 먼저입니다.`,
  macroF1: `논문에서 같은 XGBoost의 Macro F1은 ${XGB_RANDOM.splitLabel} ${f(XGB_RANDOM.reported.macroF1)}, ${XGB_UNSEEN.splitLabel} ${f(XGB_UNSEEN.reported.macroF1)}였습니다.`,
  fpr: `논문에서 매우 낮은 FPR ${f(XGB_UNSEEN.reported.fpr)}는 모델이 거의 모든 흐름을 정상으로 예측한 결과였습니다. 공격 Recall과 함께 읽어야 합니다.`,
  attackRecall: `논문에서 같은 XGBoost의 공격 Recall은 ${XGB_RANDOM.splitLabel} ${f(XGB_RANDOM.reported.attackRecall)}, ${XGB_UNSEEN.splitLabel} ${f(XGB_UNSEEN.reported.attackRecall)}였습니다.`,
}

const RULES_BY_METRIC: Record<MetricKind, RuleId[]> = {
  accuracy: ['R03', 'R11'],
  macroF1: ['R11'],
  fpr: ['R04', 'R10', 'R11'],
  attackRecall: ['R10', 'R11'],
}

const RANDOM_HIGH = `논문에서 무작위 분할의 XGBoost는 시험 공격 ${formatCount(XGB_RANDOM.matrix.fn + XGB_RANDOM.matrix.tp)}건 가운데 ${formatCount(XGB_RANDOM.matrix.tp)}건을 탐지했습니다. 학습에서 본 공격이 섞인 시험의 높은 점수는 처음 보는 공격의 성능으로 넓혀 읽을 수 없습니다.`

const XGB_UNSEEN_BLIND = MODEL_TABLE.find((r) => r.split === 'unseen' && r.model === 'XGBoost')!
const XAI_STABLE_BUT_BLIND = `논문에서 처음 보는 공격 시험의 XGBoost는 세 번 학습해도 설명 상위 5개가 완전히 같았지만(Jaccard ${EXPLANATION_STABILITY.unseen.jaccard.toFixed(4)}), 공격 Recall은 ${f(XGB_UNSEEN_BLIND.attackRecall)}이었습니다. 상위 5개 특징을 지워도 예측은 ${Number((PERMUTATION.steps.unseen[5].flipRate * 100).toFixed(2))}%만 바뀌었습니다.`

const UNSEEN_DROP = `논문에서는 학습에 없던 공격을 따로 시험하자 같은 모델의 Macro F1이 ${f(XGB_RANDOM.reported.macroF1)}에서 ${f(XGB_UNSEEN.reported.macroF1)}로 떨어졌고, 공격 ${formatCount(XGB_UNSEEN.matrix.fn + XGB_UNSEEN.matrix.tp)}건 가운데 ${formatCount(XGB_UNSEEN.matrix.tp)}건만 탐지했습니다.`

function noteFor(mark: BrochureMark, read: BrochureRead): Note {
  switch (mark.kind) {
    case 'metric': {
      const metric = mark.metric!
      const extra = [
        mark.assumed === 'percentWithoutSign' ? '백분율 기호가 없어 백분율로 읽었습니다.' : '',
        mark.assumed === 'f1AsMacro' ? 'F1을 Macro F1로 읽었습니다. 다른 F1이면 입력 수정에서 고치세요.' : '',
        mark.repeated ? '같은 지표를 앞에서 이미 읽어 이 값은 판독에 쓰지 않았습니다.' : '',
      ].filter(Boolean).join(' ')
      return {
        tone: 'claim',
        label: '성능 주장',
        reading: `읽은 값 · ${METRIC_LABEL[metric]} = ${f(mark.value!)}${extra ? ` · ${extra}` : ''}`,
        paper: { text: PAPER_BY_METRIC[metric], verbatim: false, source: '원고 V-2' },
        rules: mark.repeated ? [] : RULES_BY_METRIC[metric],
      }
    }
    case 'best':
      return {
        tone: 'claim',
        label: '최고 성능 주장',
        reading: '가장 좋은 모델이라는 주장입니다. 한 시험에서 고른 결과일 수 있습니다.',
        paper: { text: EVIDENCE.P04.quotes[0], verbatim: true, source: EVIDENCE.P04.section },
        rules: ['R05'],
        lab: 'rank',
      }
    case 'unseenClaim': {
      const tested = read.marks.some((m) => m.kind === 'unseenTest')
      return {
        tone: 'claim',
        label: '새 공격 탐지 주장',
        reading: tested
          ? '처음 보는 공격을 잡는다는 능력 주장입니다. 학습에 없던 공격으로 시험했다는 문장도 따로 있습니다.'
          : '처음 보는 공격을 잡는다는 능력 주장입니다. 그렇게 시험했다는 문장은 없습니다.',
        paper: { text: UNSEEN_DROP, verbatim: false, source: '원고 V-2' },
        rules: ['R09', 'R08', 'R12'],
      }
    }
    case 'unseenTest':
      return {
        tone: 'condition',
        label: '시험 조건',
        reading: '학습에 없던 공격을 따로 시험했다고 읽었습니다. 이 앱이 가장 먼저 확인하려는 조건입니다.',
        paper: { text: UNSEEN_DROP, verbatim: false, source: '원고 V-2' },
        rules: ['R12'],
      }
    case 'split':
      return mark.split === 'random'
        ? {
            tone: 'condition',
            label: '시험 조건',
            reading: '무작위로 나눈 시험으로 읽었습니다. 학습에서 본 공격이 시험에도 섞여 있을 수 있습니다.',
            paper: { text: RANDOM_HIGH, verbatim: false, source: '원고 V-2' },
            rules: ['R01'],
            lab: 'rank',
          }
        : {
            tone: 'condition',
            label: '시험 조건',
            reading: '무작위가 아닌 다른 기준으로 나눴다고 읽었습니다. 그 기준만으로는 학습과 시험의 관계를 알 수 없습니다.',
            rules: ['R13'],
          }
    case 'xaiClaim':
      return {
        tone: 'claim',
        label: '설명 가능 AI 주장',
        reading: '탐지 근거를 설명해 준다는 주장입니다. 설명이 있다는 것과 공격을 잘 잡는다는 것은 다른 이야기입니다.',
        paper: { text: XAI_STABLE_BUT_BLIND, verbatim: false, source: '원고 V-4 · V-5' },
        rules: ['R15'],
        lab: 'blind',
      }
    case 'dedup':
      return {
        tone: 'condition',
        label: '시험 조건',
        reading: mark.dedup === 'no' ? '중복을 제거하지 않았다고 읽었습니다.' : '중복을 제거했다고 읽었습니다.',
        rules: mark.dedup === 'no' ? ['R06'] : [],
      }
  }
}

/** 화면 B′ — 받은 소개서 문장을 붙여 넣으면 그 문장 위에 판독 표시와 논문 근거를 붙인다(설계 31절). */
export function BrochureReader({ text, onText, read, review, onUseExample, onFinish, onAnswerMissing, onOpenLab }: Props) {
  const findingById = new Map(review.findings.map((finding) => [finding.ruleId, finding]))
  const notes = read.marks.map((mark) => noteFor(mark, read))
  const linked = new Set(notes.flatMap((note) => note.rules))
  const unlinked = review.findings.filter((finding) => finding.asked && !linked.has(finding.ruleId))
  const shown = text.slice(0, MAX_BROCHURE_CHARS)

  return (
    <div className="reader">
      <section className="reader__input" aria-label="소개서 붙여 넣기">
        <div className="reader__input-head">
          <label htmlFor="brochure-text">받은 소개서·제안서 문장</label>
          <button type="button" className="link-button" onClick={onUseExample}>가상의 예시 소개서 넣기</button>
        </div>
        <textarea
          id="brochure-text"
          className="reader__textarea"
          value={text}
          maxLength={MAX_BROCHURE_CHARS}
          rows={5}
          placeholder="예: 당사 AI는 정확도 99.8%로 알려지지 않은 신종 공격까지 탐지합니다."
          onChange={(event) => onText(event.currentTarget.value)}
          aria-describedby="reader-privacy reader-count"
        />
        <div className="reader__input-foot">
          <p id="reader-privacy" className="reader__privacy">
            <LockIcon />
            붙여 넣은 글은 이 브라우저 메모리에서만 읽습니다. 저장하거나 보내지 않습니다.
          </p>
          <p id="reader-count" className="reader__count">{text.length.toLocaleString('ko-KR')} / {MAX_BROCHURE_CHARS.toLocaleString('ko-KR')}자</p>
        </div>
      </section>

      <section className="reader__review" aria-labelledby="reader-review-title">
        <div className="reader__review-head">
          <h3 id="reader-review-title">소개서 판독</h3>
          <p role="status" aria-live="polite">
            표시 <strong>{read.marks.length}</strong>곳 · 공급자에게 물을 질문 <strong>{review.questions.length}</strong>개
          </p>
          <p className="reader__legend">
            <span className="reader__key reader__key--claim">공급자 주장</span>
            <span className="reader__key reader__key--condition">시험 조건</span>
          </p>
        </div>

        {shown.trim() === '' ? (
          <div className="reader__empty">
            <p>소개서 문장을 붙여 넣으면 이 자리에 문장이 다시 나오고, 성능 숫자와 주장 위에 표시가 붙습니다.</p>
            <button type="button" className="button" onClick={onUseExample}>가상의 예시 소개서 넣기</button>
          </div>
        ) : (
          <div className="reader__grid">
            <article className="reader__sheet" aria-label="표시를 붙인 소개서">
              <p>
                {segments(shown, read.marks).map((segment, i) =>
                  segment.mark === null ? (
                    <Fragment key={i}>{segment.text}</Fragment>
                  ) : (
                    <mark key={i} className={`reader__mark reader__mark--${notes[segment.mark].tone}`}>
                      <MarkText no={segment.mark + 1} text={segment.text} />
                      <span className="visually-hidden"> (표시 {segment.mark + 1})</span>
                    </mark>
                  ),
                )}
              </p>
              {read.marks.length === 0 && (
                <p className="reader__none">판독할 표현을 찾지 못했습니다. 성능 숫자나 시험 조건이 문장에 없으면 모두 공급자에게 물을 질문이 됩니다.</p>
              )}
            </article>

            {notes.length > 0 && (
              <ol className="reader__notes" aria-label="표시별 판독">
                {notes.map((note, i) => (
                  <li key={i} className={`reader-note reader-note--${note.tone}`}>
                    <p className="reader-note__head">
                      <span className="reader-note__no" aria-hidden="true">{i + 1}</span>
                      <span className="reader-note__label">{note.label}</span>
                      <q className="reader-note__quote">{read.marks[i].text}</q>
                    </p>
                    <p>{note.reading}</p>
                    {note.paper && (
                      <p className="reader-note__paper">
                        <span>논문 근거 · {note.paper.source}</span>
                        {note.paper.verbatim ? <q data-verbatim="true">{note.paper.text}</q> : note.paper.text}
                      </p>
                    )}
                    <RuleQuestions ids={note.rules} findingById={findingById} />
                    {note.lab && (
                      <button type="button" className="link-button reader-note__lab" onClick={() => onOpenLab(note.lab!)}>
                        논문 실험실에서 직접 보기 →
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {shown.trim() !== '' && unlinked.length > 0 && (
          <section className="reader__missing" aria-labelledby="reader-missing-title">
            <h4 id="reader-missing-title">소개서에 없어 질문이 된 것</h4>
            <ul>
              {unlinked.map((finding) => (
                <li key={finding.ruleId}>
                  <strong>{finding.title}</strong>
                  <span>{finding.question}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="reader__honest">
          정해 둔 표현만 규칙으로 찾습니다. 놓친 숫자나 조건은 아래 ‘빠진 조건 직접 답하기’나 결과의 ‘입력 수정’에서 고칠 수 있습니다.
        </p>
      </section>

      <div className="reader__actions">
        <button type="button" className="button" onClick={onAnswerMissing}>빠진 조건 직접 답하기</button>
        <button type="button" className="button button--primary" onClick={onFinish}>
          결과 보기 · 질문 {review.questions.length}개
        </button>
      </div>
    </div>
  )
}

/** 번호와 첫 낱말이 줄바꿈으로 떨어지지 않게 묶는다. */
function MarkText({ no, text }: { no: number; text: string }) {
  const cut = text.search(/\s/)
  const lead = cut < 0 ? text : text.slice(0, cut)
  return (
    <>
      <span className="reader__mark-lead"><sup aria-hidden="true">{no}</sup>{lead}</span>
      {cut < 0 ? '' : text.slice(cut)}
    </>
  )
}

function RuleQuestions({ ids, findingById }: { ids: RuleId[]; findingById: Map<RuleId, Finding> }) {
  const asked = ids.map((id) => findingById.get(id)).filter((finding): finding is Finding => Boolean(finding?.asked))
  if (asked.length === 0) return null
  return (
    <ul className="reader-note__questions" aria-label="이 표시로 생긴 질문">
      {asked.map((finding) => (
        <li key={finding.ruleId}>
          <span className="reader-note__rule">{finding.ruleId}</span>
          {finding.question}
        </li>
      ))}
    </ul>
  )
}

function segments(text: string, marks: readonly BrochureMark[]): { text: string; mark: number | null }[] {
  const out: { text: string; mark: number | null }[] = []
  let at = 0
  marks.forEach((mark, i) => {
    if (mark.start > at) out.push({ text: text.slice(at, mark.start), mark: null })
    out.push({ text: text.slice(mark.start, mark.end), mark: i })
    at = mark.end
  })
  if (at < text.length) out.push({ text: text.slice(at), mark: null })
  return out
}
