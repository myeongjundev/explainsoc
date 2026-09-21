import { useRef, useState } from 'react'
import { questionsToClipboardText } from '../domain/review'
import { CopyIcon } from './icons'

interface Props {
  questions: readonly string[]
}

type CopyState = { kind: 'idle' } | { kind: 'done'; count: number } | { kind: 'failed' }

/**
 * 공급자에게 물을 질문. 복사하면 질문 문장만 담는다 —
 * 사용자가 적은 숫자는 공급자의 대외비일 수 있어서 담지 않는다.
 */
export function QuestionList({ questions }: Props) {
  const [copy, setCopy] = useState<CopyState>({ kind: 'idle' })
  const listRef = useRef<HTMLOListElement>(null)

  const onCopy = async () => {
    const text = questionsToClipboardText(questions)
    try {
      await navigator.clipboard.writeText(text)
      setCopy({ kind: 'done', count: questions.length })
    } catch {
      // 권한이 없거나 보안 맥락이 아니면 복사할 수 없다. 목록을 선택해 두어 직접 복사하게 한다.
      const list = listRef.current
      if (list) {
        const range = document.createRange()
        range.selectNodeContents(list)
        const selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
      setCopy({ kind: 'failed' })
    }
  }

  return (
    <section className="panel questions" aria-labelledby="questions-title">
      <h3 id="questions-title" className="panel__title">
        공급자에게 물을 질문
      </h3>
      {questions.length > 0 ? (
        <>
          <p className="questions__lead">PoC 자리에서 그대로 읽을 수 있게 적었습니다. 복사하면 질문 문장만 담깁니다.</p>
          <ol className="questions__list" ref={listRef}>
            {questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
          <button type="button" className="button button--primary questions__copy" onClick={onCopy}>
            <CopyIcon />
            질문 복사
          </button>
        </>
      ) : (
        <p className="questions__empty">
          지금 입력에서는 새로 물을 질문이 없습니다. 입력한 근거를 공급자 자료와 나란히 놓고 다시 읽어 보세요.
        </p>
      )}
      <p className="questions__status" role="status" aria-live="polite">
        {copy.kind === 'done' && `질문 ${copy.count}개를 복사했습니다. 입력한 숫자는 담지 않았습니다.`}
        {copy.kind === 'failed' && '복사하지 못했습니다. 질문 목록을 선택해 두었으니 직접 복사해 주세요.'}
      </p>
    </section>
  )
}
