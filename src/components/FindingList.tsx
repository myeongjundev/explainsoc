import type { FormCheck } from '../domain/form'
import { computeMetrics } from '../domain/metrics'
import { formatComputed, formatCount, formatRatio, METRIC_LABEL, SPLIT_LABEL, TRI_LABEL } from '../domain/format'
import { STATUS_ORDER, type Finding, type Review } from '../domain/review'
import { METRIC_KINDS, type FindingStatus } from '../domain/types'
import { EvidenceDetails } from './EvidenceDetails'
import { STATUS_HINT, STATUS_LABEL, StatusBadge } from './StatusBadge'

interface Props {
  review: Review
  check: FormCheck
}

/** 화면 F의 판독 목록. 확인 필요 → 해석 주의 → 입력한 근거. 점수나 등급은 없다. */
export function FindingList({ review, check }: Props) {
  return (
    <section className="panel findings" aria-labelledby="findings-title">
      <h3 id="findings-title" className="panel__title" tabIndex={-1}>
        숫자가 말하는 것과 말하지 않는 것
      </h3>
      <p className="findings__disclaimer">어느 상태도 모델이 좋다거나 나쁘다는 판정이 아닙니다.</p>
      {STATUS_ORDER.map((status) => (
        <StatusGroup key={status} status={status} findings={review.byStatus[status]} check={check} />
      ))}
    </section>
  )
}

function StatusGroup({ status, findings, check }: { status: FindingStatus; findings: Finding[]; check: FormCheck }) {
  const headingId = `group-${status}`
  return (
    <div className={`group group--${status}`}>
      <h4 id={headingId} className="group__title">
        <StatusBadge status={status} />
        <span className="group__count">{findings.length}개</span>
      </h4>
      <p className="group__hint">{STATUS_HINT[status]}</p>
      {findings.length > 0 ? (
        <ul className="group__list" aria-labelledby={headingId}>
          {findings.map((f) => (
            <FindingItem key={f.ruleId} finding={f} />
          ))}
        </ul>
      ) : (
        <p className="group__empty">이 입력에서는 {STATUS_LABEL[status]} 항목이 없습니다.</p>
      )}
      {status === 'input' && <InputSummary check={check} />}
    </div>
  )
}

function FindingItem({ finding }: { finding: Finding }) {
  return (
    <li className={`finding finding--${finding.status}`}>
      <p className="finding__title">
        <span className="finding__id">{finding.ruleId}</span> {finding.title}
      </p>
      <p className="finding__guidance">{finding.guidance}</p>
      {finding.asked ? (
        <p className="finding__question">
          <span className="finding__question-label">공급자 질문</span> {finding.question}
        </p>
      ) : (
        <p className="finding__note">혼동행렬을 이미 입력했으므로 이 질문은 목록에 넣지 않았습니다.</p>
      )}
      <EvidenceDetails ids={finding.evidenceIds} why={finding.guidance} />
    </li>
  )
}

/** 입력한 값을 그대로 보여 준다. 앱은 이 값을 검증하지 않는다. */
function InputSummary({ check }: { check: FormCheck }) {
  const { input } = check
  const claimed = METRIC_KINDS.filter((k) => input.claim[k] !== undefined)
  const m = input.matrix ? computeMetrics(input.matrix) : null
  const tri = (v: typeof input.unseenIncluded) => (v ? TRI_LABEL[v] : '고르지 않음 (모름으로 읽음)')

  return (
    <div className="summary">
      <p className="summary__title">입력한 값</p>
      <dl className="summary__list">
        {claimed.map((k) => (
          <div key={k}>
            <dt>{METRIC_LABEL[k]}</dt>
            <dd>{formatRatio(input.claim[k] as number)}</dd>
          </div>
        ))}
        {claimed.length === 0 && (
          <div>
            <dt>받은 성능 숫자</dt>
            <dd>적지 않음</dd>
          </div>
        )}
        {input.matrix && m && (
          <>
            <div>
              <dt>혼동행렬</dt>
              <dd>
                TN {formatCount(input.matrix.tn)} · FP {formatCount(input.matrix.fp)} · FN {formatCount(input.matrix.fn)} · TP{' '}
                {formatCount(input.matrix.tp)}
              </dd>
            </div>
            <div>
              <dt>혼동행렬에서 계산</dt>
              <dd>
                Accuracy {formatComputed(m.accuracy)} · 공격 Recall {formatComputed(m.attackRecall)} · 정상 Recall{' '}
                {formatComputed(m.normalRecall)} · FPR {formatComputed(m.fpr)} · Macro F1 {formatComputed(m.macroF1)}
              </dd>
            </div>
          </>
        )}
        <div>
          <dt>가장 좋은 모델이라는 소개</dt>
          <dd>{input.claimedBest ? TRI_LABEL[input.claimedBest] : '고르지 않음'}</dd>
        </div>
        <div>
          <dt>시험 자료를 나눈 방식</dt>
          <dd>{input.split ? SPLIT_LABEL[input.split] : '고르지 않음 (모름으로 읽음)'}</dd>
        </div>
        <div>
          <dt>학습 때 없던 공격의 시험</dt>
          <dd>{tri(input.unseenIncluded)}</dd>
        </div>
        <div>
          <dt>중복 제거</dt>
          <dd>{tri(input.deduplicated)}</dd>
        </div>
      </dl>
      {check.errorCount > 0 && (
        <p className="summary__errors">
          잘못 적은 칸 {check.errorCount}개는 계산에서 뺐습니다. 입력 수정에서 고칠 수 있습니다.
        </p>
      )}
    </div>
  )
}
