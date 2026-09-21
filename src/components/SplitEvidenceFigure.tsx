import { TEST_ATTACKS, TRAIN_ATTACKS, XGB_UNSEEN } from '../data/paperEvidence'
import { formatCount } from '../domain/format'
import { EvidenceDetails } from './EvidenceDetails'

/**
 * 화면 E — 논문의 실제 분할을 그린다. 사용자의 분할을 판정하는 도구가 아니다.
 * 공격 이름은 원고 IV-3 원문 그대로다.
 */
export function SplitEvidenceFigure() {
  const detected = XGB_UNSEEN.matrix.tp
  const attacks = XGB_UNSEEN.matrix.tp + XGB_UNSEEN.matrix.fn
  return (
    <section className="panel split" aria-labelledby="split-title">
      <h3 id="split-title" className="panel__title">
        논문이 시험한 분할
      </h3>
      <figure className="split__figure">
        <div className="split__grid">
          <div className="split__side">
            <p className="split__heading">
              월~목 학습 공격 <strong>9종</strong>
            </p>
            <ul className="split__list">
              {TRAIN_ATTACKS.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <div className="split__middle">
            <p className="split__overlap">
              공격 유형 겹침 <strong>0</strong>
            </p>
          </div>
          <div className="split__side split__side--test">
            <p className="split__heading">
              금요일 시험 공격 <strong>3종</strong>
            </p>
            <ul className="split__list">
              {TEST_ATTACKS.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
        <figcaption className="split__caption">
          수집 날짜와 공격 유형 변화가 함께 바뀌었으므로 순수 시간 일반화가 아니라 미관측 공격 스트레스 테스트입니다. 이 시험에서
          XGBoost는 공격 {formatCount(attacks)}건 가운데 {formatCount(detected)}건을 탐지했습니다.
        </figcaption>
      </figure>
      <p className="split__disclaimer">이 그림은 논문의 분할입니다. 입력한 성능표의 분할을 판정하지 않습니다.</p>
      <EvidenceDetails ids={['P01', 'P07']} />
    </section>
  )
}
