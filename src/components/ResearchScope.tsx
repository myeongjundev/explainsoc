import { EVIDENCE, PAPER, XGB_RANDOM, XGB_UNSEEN, type EvidenceId } from '../data/paperEvidence'
import { formatCount, formatRatio } from '../domain/format'
import { ExternalIcon } from './icons'

const ALL_IDS = Object.keys(EVIDENCE) as EvidenceId[]

/** 화면 G — 긴 설명은 핵심 흐름 밖에서 펼쳐 본다. */
export function ResearchScope() {
  const rows = [XGB_RANDOM, XGB_UNSEEN]
  return (
    <details className="scope" id="research-scope">
      <summary>연구 범위와 근거 — 이 앱이 하는 말과 하지 않는 말</summary>
      <div className="scope__body">
        <section aria-labelledby="scope-numbers">
          <h3 id="scope-numbers">앱이 쓰는 논문 수치 (원고 V-2)</h3>
          <div className="table-wrap">
            <table className="scope__table">
              <caption className="visually-hidden">XGBoost의 두 분할 결과</caption>
              <thead>
                <tr>
                  <th scope="col">분할</th>
                  <th scope="col">Accuracy</th>
                  <th scope="col">Macro F1</th>
                  <th scope="col">공격 Recall</th>
                  <th scope="col">FPR</th>
                  <th scope="col">공격 탐지</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.splitLabel}>
                    <th scope="row">{r.splitLabel}</th>
                    <td>{formatRatio(r.reported.accuracy)}</td>
                    <td>{formatRatio(r.reported.macroF1)}</td>
                    <td>{formatRatio(r.reported.attackRecall)}</td>
                    <td>{formatRatio(r.reported.fpr)}</td>
                    <td>
                      {formatCount(r.matrix.tp + r.matrix.fn)}건 중 {formatCount(r.matrix.tp)}건
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="scope-say" className="scope__say">
          <div>
            <h3 id="scope-say">이 앱이 하는 말</h3>
            <ul>
              <li>받은 숫자가 말하지 않는 평가 조건</li>
              <li>공급자에게 물을 질문</li>
              <li>각 질문이 나온 논문의 절과 원문</li>
            </ul>
          </div>
          <div>
            <h3>하지 않는 말</h3>
            <ul>
              <li>모델이 좋다거나 나쁘다는 판정</li>
              <li>신뢰 점수, 등급, 합격선</li>
              <li>입력한 숫자와 논문 숫자의 우열 비교</li>
              <li>다른 데이터셋이나 실제 조직망에 대한 일반화</li>
            </ul>
          </div>
        </section>

        <section aria-labelledby="scope-limits">
          <h3 id="scope-limits">이 연구의 한계</h3>
          <ul>
            <li>결과는 2017년 합성 실험 환경에서 수집한 CICIDS2017 한 데이터셋에 한정됩니다.</li>
            <li>날짜와 공격 유형이 함께 바뀌어 둘의 효과를 나누지 못했습니다. 그래서 순수 시간 일반화가 아니라 미관측 공격 스트레스 테스트라고 부릅니다.</li>
            <li>미관측 공격에서 Logistic Regression이 가장 높았던 것은 단순한 모델이 늘 더 잘 일반화한다는 증거가 아닙니다.</li>
            <li>SHAP은 공격의 원인이 아니라 모델 내부 판단의 기여도입니다. 안정적인 설명은 정확하거나 유용한 탐지를 보증하지 않습니다.</li>
            <li>실제 SOC 분석가를 대상으로 한 평가나 사용성 연구는 하지 않았습니다.</li>
          </ul>
        </section>

        <section aria-labelledby="scope-evidence">
          <h3 id="scope-evidence">근거 P01~P10</h3>
          <ol className="scope__evidence">
            {ALL_IDS.map((id) => {
              const e = EVIDENCE[id]
              return (
                <li key={id}>
                  <p className="evidence__source">
                    <span className="evidence__id">{e.id}</span> {e.section} · {e.title}
                  </p>
                  {e.quotes.map((q) => (
                    <blockquote key={q} className="evidence__quote" data-verbatim="true">
                      {q}
                    </blockquote>
                  ))}
                  {e.note && <p className="evidence__note">{e.note}</p>}
                </li>
              )
            })}
          </ol>
        </section>

        <section aria-labelledby="scope-source">
          <h3 id="scope-source">출처</h3>
          <p>
            {PAPER.title} ({PAPER.submittedOn} 제출)
          </p>
          <p className="hero__links">
            <a href={PAPER.repoUrl} target="_blank" rel="noopener noreferrer">
              논문 저장소{' '}<span className="visually-hidden">(외부 링크, 새 탭)</span>
              <ExternalIcon />
            </a>
            <a href={PAPER.pdfUrl} target="_blank" rel="noopener noreferrer">
              논문 PDF{' '}<span className="visually-hidden">(외부 링크, 새 탭)</span>
              <ExternalIcon />
            </a>
          </p>
          <p className="scope__citation">데이터셋: {PAPER.datasetCitation}</p>
        </section>
      </div>
    </details>
  )
}
