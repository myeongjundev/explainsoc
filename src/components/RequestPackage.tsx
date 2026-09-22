import { useMemo, useState } from 'react'
import { buildRequestText, type Review } from '../domain/review'
import { CopyIcon, DocumentIcon } from './icons'

export function RequestPackage({ review }: { review: Review }) {
  const [status, setStatus] = useState<'idle' | 'done' | 'failed'>('idle')
  const text = useMemo(() => buildRequestText(review), [review])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('done')
    } catch {
      setStatus('failed')
    }
  }
  return (
    <section className="panel request-package" aria-labelledby="request-package-title">
      <p className="brief__eyebrow"><DocumentIcon /> 회의 다음 행동</p>
      <h3 id="request-package-title" className="panel__title">공급자 자료 요청서</h3>
      <p className="brief__lead">질문만 보내지 않고, 받아야 할 자료와 이유·논문 근거를 함께 전달합니다.</p>
      <pre className="brief__preview" tabIndex={0} aria-label="공급자 자료 요청서 미리보기">{text}</pre>
      <button type="button" className="button" onClick={copy}><CopyIcon /> 자료 요청서 복사</button>
      <p className="questions__status" role="status" aria-live="polite">
        {status === 'done' && '자료 요청서를 복사했습니다.'}
        {status === 'failed' && '복사하지 못했습니다. 미리보기에서 직접 복사해 주세요.'}
      </p>
    </section>
  )
}
