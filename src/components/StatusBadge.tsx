import type { FindingStatus } from '../domain/types'
import { CautionIcon, DocumentIcon, QuestionIcon } from './icons'

/** 상태 이름은 셋뿐이다. 어느 것도 모델 품질을 보증하지 않는다. */
export const STATUS_LABEL: Record<FindingStatus, string> = {
  check: '확인 필요',
  caution: '해석 주의',
  input: '입력한 근거',
}

export const STATUS_HINT: Record<FindingStatus, string> = {
  check: '정보가 없거나 모름이라고 답했습니다',
  caution: '숫자는 있지만 그것만으로 읽으면 위험합니다',
  input: '사용자가 제공한 값입니다. 앱은 이 값을 검증하지 않습니다',
}

const ICON = { check: QuestionIcon, caution: CautionIcon, input: DocumentIcon }

/** 색, 아이콘, 글자를 함께 쓴다 — 색만으로 뜻을 전하지 않는다. */
export function StatusBadge({ status }: { status: FindingStatus }) {
  const Icon = ICON[status]
  return (
    <span className={`badge badge--${status}`}>
      <Icon className="badge__icon" />
      {STATUS_LABEL[status]}
    </span>
  )
}
