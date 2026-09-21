/**
 * 10번 과제 논문에서 가져온 근거. 화면과 판독 규칙은 이 파일의 ID로만 논문을 참조한다.
 *
 * - 원문 인용(`quotes`)은 제출된 원고 `explainsoc-research/paper/MANUSCRIPT-KO.md`에서
 *   글자 그대로 옮겼다. 고치지 않는다.
 * - 숫자는 원고 V-2 표와 제출 연구의 `docs/DAY-2-REPORT.md`에서 옮겼다. 반올림된 비율에서
 *   혼동행렬을 거꾸로 계산하지 않는다.
 */

import type { ConfusionMatrix } from '../domain/types'

export const PAPER = {
  title: '데이터 분할 방식에 따른 XAI 기반 네트워크 침입 탐지 성능과 설명 안정성 분석',
  submittedOn: '2026-09-13',
  dataset: 'CICIDS2017',
  repoUrl: 'https://github.com/myeongjundev/explainsoc-research',
  pdfUrl: 'https://github.com/myeongjundev/explainsoc-research/blob/main/output/pdf/T10-research-paper.pdf',
  /**
   * 원고 참고문헌 [1] — 데이터셋 인용. 제출물에 본인 외 다른 사람의 실명을 넣지 않는다는 과제 기준
   * (BRB-C12)에 따라 저자 이름은 빼고, 논문을 하나로 가리키는 제목·학회·쪽·연도·DOI만 둔다.
   */
  datasetCitation:
    '“Toward Generating a New Intrusion Detection Dataset and Intrusion Traffic Characterization,” Proc. ICISSP, pp. 108–116, 2018. doi: 10.5220/0006639801080116. 저자를 포함한 전체 인용은 논문 참고문헌 [1]에 있습니다.',
} as const

/** 원고 IV-3 — 날짜 기반 분할의 학습 공격과 시험 공격. 두 집합은 겹치지 않는다. */
export const TRAIN_ATTACKS = [
  'DoS Hulk',
  'DoS GoldenEye',
  'FTP-Patator',
  'SSH-Patator',
  'DoS slowloris',
  'DoS Slowhttptest',
  'Web Attack',
  'Infiltration',
  'Heartbleed',
] as const

export const TEST_ATTACKS = ['DDoS', 'PortScan', 'Bot'] as const

export interface ReportedMetrics {
  accuracy: number
  macroF1: number
  attackRecall: number
  fpr: number
}

export interface PaperResult {
  /** 화면에 쓰는 분할 이름. 원고 용어를 따른다. */
  splitLabel: string
  model: 'XGBoost'
  /** DAY-2-REPORT의 `[[TN, FP], [FN, TP]]` 원수치 */
  matrix: ConfusionMatrix
  /** 원고 V-2 표의 반올림 값 */
  reported: ReportedMetrics
}

/** 원고 V-2 · DAY-2-REPORT — 계층화 무작위 분할의 XGBoost */
export const XGB_RANDOM: PaperResult = {
  splitLabel: '계층화 무작위 분할',
  model: 'XGBoost',
  matrix: { tn: 418_934, fp: 362, fn: 220, tp: 84_955 },
  reported: { accuracy: 0.9988, macroF1: 0.9979, attackRecall: 0.9974, fpr: 0.0009 },
}

/**
 * 원고 V-2 · DAY-2-REPORT — 미관측 공격 스트레스 테스트의 XGBoost.
 * DAY-2 보고서는 이 분할을 다른 이름으로 불렀지만 화면에서는 원고 용어만 쓴다.
 */
export const XGB_UNSEEN: PaperResult = {
  splitLabel: '미관측 공격 스트레스 테스트',
  model: 'XGBoost',
  matrix: { tn: 375_432, fp: 86, fn: 220_628, tp: 160 },
  reported: { accuracy: 0.6299, macroF1: 0.3871, attackRecall: 0.0007, fpr: 0.0002 },
}

/**
 * 원고 IV-3 표 — 미관측 공격 스트레스 테스트의 시험 구성.
 * 항상 정상 기준선은 이 원수에서 화면이 계산한다. 반올림값 0.6297을 따로 저장하지 않는다.
 */
export const UNSEEN_TEST_COMPOSITION = {
  total: 596_306,
  normal: 375_518,
  attack: 220_788,
} as const

export type EvidenceId = 'P01' | 'P02' | 'P03' | 'P04' | 'P05' | 'P06' | 'P07' | 'P08' | 'P09' | 'P10'

export interface Evidence {
  id: EvidenceId
  /** 출처. 원고의 절이면 '원고 V-2'처럼, 제출 연구의 다른 문서면 그 이름을 쓴다. */
  section: string
  title: string
  /** 원고 원문. 글자 그대로다. */
  quotes: readonly string[]
  /** 원문을 옮긴 것이 아니라 화면이 계산하거나 정리한 근거면 그 설명 */
  note?: string
}

export const EVIDENCE: Record<EvidenceId, Evidence> = {
  P01: {
    id: 'P01',
    section: '원고 IV-3',
    title: '분할 정의와 공격 유형',
    quotes: [
      '날짜 기반 분할에서 월~목 학습 공격은 DoS Hulk, DoS GoldenEye, FTP-Patator, SSH-Patator, DoS slowloris, DoS Slowhttptest, Web Attack, Infiltration, Heartbleed다. 금요일 시험 공격은 DDoS, PortScan, Bot이며 두 집합은 겹치지 않는다.',
      '따라서 이 분할은 동일 공격의 미래 성능을 측정하는 순수 시간 분할이 아니라, 수집 날짜와 공격 유형 변화가 결합된 미관측 공격 스트레스 테스트다.',
    ],
  },
  P02: {
    id: 'P02',
    section: '원고 IV-4',
    title: '평가 지표를 함께 본 이유',
    quotes: [
      'Accuracy와 함께 클래스 불균형의 영향을 줄이기 위해 Macro F1을 주 지표로 사용하였다. 운영 관점의 실패를 확인하기 위해 공격 Recall, 정상 Recall, 오탐률(FPR), 혼동행렬도 함께 기록하였다. FPR은 `FP/(FP+TN)`으로 계산하였다.',
    ],
  },
  P03: {
    id: 'P03',
    section: '원고 V-2',
    title: '무작위와 미관측 공격의 XGBoost',
    quotes: [
      '무작위 분할에서는 두 트리 모델의 Macro F1이 0.997을 넘었다. 특히 XGBoost는 시험 공격 85,175건 중 84,955건을 탐지하고 정상 419,296건 중 362건을 오탐하였다. 반면 미관측 공격 분할에서 XGBoost는 공격 220,788건 중 160건만 탐지하였다. 매우 낮은 FPR 0.0002는 좋은 결과처럼 보이지만, 이는 모델이 거의 모든 흐름을 정상으로 예측한 결과이므로 공격 Recall과 함께 읽어야 한다.',
    ],
  },
  P04: {
    id: 'P04',
    section: '원고 V-2',
    title: '모델 순위 변화',
    quotes: ['또한 분할 방식에 따라 모델 순위도 달라졌다.'],
    note: 'Logistic Regression이 미관측 공격에서 가장 높았던 것은 단순한 모델이 늘 더 잘 일반화한다는 증거가 아닙니다(원고 VI-1).',
  },
  P05: {
    id: 'P05',
    section: '원고 V-1 · IV-3',
    title: '중복 감사',
    quotes: [
      '완전 중복은 308,381건으로 전체의 10.894%였으며, 제거 후 BENIGN 2,096,484건과 ATTACK 425,878건이 남았다.',
      '월~목에도 나타난 금요일 고유 행 19,588건은 시험에서 추가 제거하였다. 최종 학습·시험 `row_id` 교집합은 0건이다.',
    ],
    note: '10.894%는 CICIDS2017의 값입니다. 다른 데이터셋의 기준으로 쓰지 않습니다.',
  },
  P06: {
    id: 'P06',
    section: '원고 VI-3',
    title: '운영적 확인 방법',
    quotes: ['운영자는 전체 정확도만 보지 않고 공격 Recall과 혼동행렬을 함께 확인해야 한다.'],
  },
  P07: {
    id: 'P07',
    section: '원고 VII',
    title: '결론',
    quotes: ['이 결과는 한 가지 무작위 분할의 높은 성능만으로 미관측 공격 탐지 능력을 판단해서는 안 됨을 보여 주며'],
  },
  P08: {
    id: 'P08',
    section: '원고 VI-2 · VII',
    title: '설명 안정성의 경계',
    quotes: ['따라서 안정적인 설명은 정확하거나 유용한 탐지의 보증이 아니다.'],
  },
  P09: {
    id: 'P09',
    section: '제출 연구 DAY-2 보고서',
    title: '정확한 예시 혼동행렬',
    quotes: [],
    note: '제출 연구의 DAY-2 보고서에 있는 원수치입니다. 원고의 반올림 비율에서 거꾸로 계산하지 않았습니다.',
  },
  P10: {
    id: 'P10',
    section: '원고 IV-3에서 계산',
    title: '항상 정상 기준선',
    quotes: [],
    note: '원고 IV-3 표의 시험 정상 375,518건을 시험 전량 596,306건으로 나눈 화면 설명용 비교입니다. 논문의 새 결과나 합격선이 아닙니다.',
  },
}

/** 모든 근거 화면에 함께 붙는 연구 범위 문장 */
export const SCOPE_NOTE = '이 근거는 CICIDS2017 한 데이터셋, 2017년 합성 실험 환경의 결과입니다.'
