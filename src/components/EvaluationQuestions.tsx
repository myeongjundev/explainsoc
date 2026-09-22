import { SPLIT_LABEL, TRI_LABEL } from '../domain/format'
import type { FormState } from '../domain/form'
import type { ReviewInput, SplitAnswer, TriAnswer } from '../domain/types'
import { ChoiceGroup } from './ChoiceGroup'

interface Props {
  form: FormState
  onSplit: (v: SplitAnswer) => void
  onUnseen: (v: TriAnswer) => void
  onDedup: (v: TriAnswer) => void
  previous?: ReviewInput | null
}

const TRI_OPTIONS = (['yes', 'no', 'unknown'] as const).map((v) => ({ value: v, label: TRI_LABEL[v] }))
const SPLIT_OPTIONS = (['random', 'unseen', 'other', 'unknown'] as const).map((v) => ({ value: v, label: SPLIT_LABEL[v] }))

/** 화면 C — 논문이 발견한 핵심 조건을 사용자의 말로 묻는다. 고르지 않아도 다음으로 갈 수 있다. */
export function EvaluationQuestions({ form, onSplit, onUnseen, onDedup, previous }: Props) {
  const previousContext = (current: string | null, before: string | null, beforeLabel: string) => previous && (
    <>
      <p>이전 값: <strong>{beforeLabel}</strong> · 선택하지 않으면 이 값을 이어 씁니다.</p>
      {current === 'unknown' && before && before !== 'unknown' && <p><strong>변경:</strong> 이전 값을 ‘{beforeLabel}’에서 ‘모름’으로 바꿉니다.</p>}
    </>
  )
  return (
    <div className="step-body">
      <p className="step-lead">
        모르면 <strong>모름</strong>을 고르세요. 이 앱에서는 모름이 가장 중요한 답입니다 — 공급자에게 물을 질문으로 바뀝니다.
      </p>

      <section className="panel">
        <ChoiceGroup
          legend="1. 시험 자료는 어떻게 나눴습니까?"
          name="split"
          options={SPLIT_OPTIONS}
          value={form.split}
          onChange={onSplit}
          context={previousContext(form.split, previous?.split ?? null, previous?.split ? SPLIT_LABEL[previous.split] : '모름')}
          help={
            <p>
              무작위 분할은 모은 흐름을 섞어 학습과 시험으로 나눕니다. 학습 때 본 공격이 시험에도 함께 들어갑니다. 학습에 없던 공격을
              따로 시험하면, 처음 보는 공격을 잡는지 볼 수 있습니다.
            </p>
          }
        />
      </section>

      <section className="panel">
        <ChoiceGroup
          legend="2. 시험에 학습 때 없던 공격이 들어 있었습니까?"
          name="unseen"
          options={TRI_OPTIONS}
          value={form.unseenIncluded}
          onChange={onUnseen}
          context={previousContext(form.unseenIncluded, previous?.unseenIncluded ?? null, previous?.unseenIncluded ? TRI_LABEL[previous.unseenIncluded] : '모름')}
          help={<p>학습 때 한 번도 보지 못한 공격 유형이 시험에만 있었는지 묻습니다.</p>}
        />
      </section>

      <section className="panel">
        <ChoiceGroup
          legend="3. 중복과 학습·시험 사이의 같은 행을 제거했습니까?"
          name="dedup"
          options={TRI_OPTIONS}
          value={form.deduplicated}
          onChange={onDedup}
          context={previousContext(form.deduplicated, previous?.deduplicated ?? null, previous?.deduplicated ? TRI_LABEL[previous.deduplicated] : '모름')}
          help={<p>같은 흐름이 여러 번 들어 있거나 학습과 시험에 함께 들어 있으면, 평가가 실제보다 낙관적으로 나올 수 있습니다.</p>}
        />
      </section>
    </div>
  )
}
