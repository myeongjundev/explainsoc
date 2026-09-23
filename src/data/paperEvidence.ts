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

export type EvidenceId = 'P01' | 'P02' | 'P03' | 'P04' | 'P05' | 'P06' | 'P07' | 'P08' | 'P09' | 'P10' | 'P11' | 'P12' | 'P13' | 'P14'

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
  P11: {
    id: 'P11',
    section: '원고 V-2',
    title: '세 모델 × 두 분할',
    quotes: ['Logistic Regression은 무작위 분할에서 트리 모델보다 낮았지만 미관측 공격 분할에서는 가장 높은 Macro F1 0.6744와 공격 Recall 0.3718을 기록하였다.'],
    note: '단순한 모델이 늘 더 잘 일반화한다는 증거가 아닙니다(원고 VI-1).',
  },
  P12: {
    id: 'P12',
    section: '원고 V-2',
    title: '세 학습 시드의 XGBoost',
    quotes: ['따라서 관찰된 성능 붕괴는 특정 시드 하나의 우연한 초기화로 설명되지 않았다.'],
    note: '같은 시험 자료에서 초기화만 바꾼 민감도 분석이며, 다른 데이터셋 재현이 아닙니다.',
  },
  P13: {
    id: 'P13',
    section: '원고 V-3',
    title: '전역 SHAP Top-5 특징',
    quotes: ['이는 공격의 보편적 또는 인과적 특징이 아니라 해당 학습 분포에서 모델이 사용한 판단 근거다.'],
  },
  P14: {
    id: 'P14',
    section: '원고 V-4 · V-5 · VI-2',
    title: '설명 안정성과 특징 치환 민감도',
    quotes: [
      '설명의 반복 가능성과 탐지 유용성은 같은 개념이 아니다.',
      '즉 안정적인 SHAP 순위가 확인되더라도 모델이 유용한 공격 결정을 하고 있는지, 해당 특징 변화에 충분히 반응하는지를 별도로 확인해야 한다.',
    ],
    note: '치환 민감도는 분할별 고정 표본 2,000건(공격·정상 각 1,000건)에서 잰 값입니다. 치환 결과를 인과 효과로 읽지 않습니다(원고 VI-2).',
  },
}

/** 모든 근거 화면에 함께 붙는 연구 범위 문장 */
export const SCOPE_NOTE = '이 근거는 CICIDS2017 한 데이터셋, 2017년 합성 실험 환경의 결과입니다.'

/* ─── V9 논문 실험실 — 원고 V-2~V-5의 나머지 결과 ────────────────────
 * 원고 표에서 그대로 옮겼고, 제출 연구 artifacts/reports의 JSON과 대조했다(2026-09-24).
 * 치환 민감도의 Top-1·2·4 단계는 원고 표에 없고 prepaper-shap-perturbation.json에서 가져왔다.
 */

export type LabSplit = 'random' | 'unseen'
export type LabModel = 'Logistic Regression' | 'Random Forest' | 'XGBoost'

export interface ModelRow {
  split: LabSplit
  model: LabModel
  accuracy: number
  macroF1: number
  attackRecall: number
  normalRecall: number
  fpr: number
}

/** 원고 V-2 표 — 세 모델 × 두 분할 */
export const MODEL_TABLE: readonly ModelRow[] = [
  { split: 'random', model: 'Logistic Regression', accuracy: 0.8741, macroF1: 0.8207, attackRecall: 0.9721, normalRecall: 0.8542, fpr: 0.1458 },
  { split: 'random', model: 'Random Forest', accuracy: 0.9984, macroF1: 0.9972, attackRecall: 0.9957, normalRecall: 0.999, fpr: 0.001 },
  { split: 'random', model: 'XGBoost', accuracy: 0.9988, macroF1: 0.9979, attackRecall: 0.9974, normalRecall: 0.9991, fpr: 0.0009 },
  { split: 'unseen', model: 'Logistic Regression', accuracy: 0.7468, macroF1: 0.6744, attackRecall: 0.3718, normalRecall: 0.9672, fpr: 0.0328 },
  { split: 'unseen', model: 'Random Forest', accuracy: 0.6655, macroF1: 0.4835, attackRecall: 0.0972, normalRecall: 0.9996, fpr: 0.0004 },
  { split: 'unseen', model: 'XGBoost', accuracy: 0.6299, macroF1: 0.3871, attackRecall: 0.0007, normalRecall: 0.9998, fpr: 0.0002 },
]

/** 원고 V-2 — 세 학습 시드의 XGBoost */
export const SEED_TABLE = [
  { seed: 42, randomMacroF1: 0.997946, randomRecall: 0.997417, unseenMacroF1: 0.387139, unseenRecall: 0.000725 },
  { seed: 314, randomMacroF1: 0.997939, randomRecall: 0.99737, unseenMacroF1: 0.387191, unseenRecall: 0.000774 },
  { seed: 2026, randomMacroF1: 0.997897, randomRecall: 0.997558, unseenMacroF1: 0.387241, unseenRecall: 0.00082 },
] as const

/** 원고 V-3 — 전역 SHAP 중요도 Top-5 */
export const SHAP_TOP5: Record<'XGBoost' | 'Random Forest', Record<LabSplit, readonly string[]>> = {
  XGBoost: {
    random: ['bwd_packet_length_std', 'init_win_bytes_forward', 'init_win_bytes_backward', 'bwd_packet_length_mean', 'average_packet_size'],
    unseen: ['init_win_bytes_backward', 'bwd_packet_length_std', 'init_win_bytes_forward', 'min_packet_length', 'min_seg_size_forward'],
  },
  'Random Forest': {
    random: ['bwd_packet_length_std', 'packet_length_std', 'bwd_packet_length_mean', 'packet_length_variance', 'average_packet_size'],
    unseen: ['init_win_bytes_backward', 'bwd_packet_length_std', 'packet_length_std', 'bwd_packet_length_mean', 'fwd_packet_length_max'],
  },
}

/** CICIDS2017(CICFlowMeter) 흐름 특징의 뜻. 정방향은 연결을 시작한 쪽에서, 역방향은 그 반대쪽에서 보낸 패킷이다. */
export const FEATURE_LABEL: Record<string, string> = {
  bwd_packet_length_std: '역방향 패킷 길이의 표준편차',
  bwd_packet_length_mean: '역방향 패킷 길이의 평균',
  init_win_bytes_forward: '정방향 첫 TCP 윈도 크기',
  init_win_bytes_backward: '역방향 첫 TCP 윈도 크기',
  average_packet_size: '평균 패킷 크기',
  min_packet_length: '가장 짧은 패킷 길이',
  min_seg_size_forward: '정방향 최소 세그먼트 크기',
  packet_length_std: '패킷 길이의 표준편차',
  packet_length_variance: '패킷 길이의 분산',
  fwd_packet_length_max: '정방향 가장 긴 패킷 길이',
}

/** 원고 V-4 — XGBoost 세 시드의 설명 안정성 */
export const EXPLANATION_STABILITY: Record<LabSplit, { jaccard: number; rankCorrelation: number }> = {
  random: { jaccard: 0.7778, rankCorrelation: 0.9619 },
  unseen: { jaccard: 1, rankCorrelation: 0.9333 },
}

export interface PermutationStep {
  /** 상위 몇 개 특징을 학습 분할 중앙값으로 바꿨는지. 0은 기준 */
  topK: number
  macroF1: number
  attackRecall: number
  /** 예측이 바뀐 비율 */
  flipRate: number
}

/** 원고 V-5(기준·Top-3·Top-5)와 prepaper-shap-perturbation.json(Top-1·2·4) — XGBoost 시드 42, 분할별 고정 표본 */
export const PERMUTATION: { sample: { attack: number; normal: number }; steps: Record<LabSplit, readonly PermutationStep[]> } = {
  sample: { attack: 1000, normal: 1000 },
  steps: {
    random: [
      { topK: 0, macroF1: 1, attackRecall: 1, flipRate: 0 },
      { topK: 1, macroF1: 0.9985, attackRecall: 0.997, flipRate: 0.0015 },
      { topK: 2, macroF1: 0.988, attackRecall: 0.995, flipRate: 0.012 },
      { topK: 3, macroF1: 0.8231, attackRecall: 0.679, flipRate: 0.173 },
      { topK: 4, macroF1: 0.6461, attackRecall: 0.367, flipRate: 0.319 },
      { topK: 5, macroF1: 0.5941, attackRecall: 0.291, flipRate: 0.355 },
    ],
    unseen: [
      { topK: 0, macroF1: 0.3344, attackRecall: 0.001, flipRate: 0 },
      { topK: 1, macroF1: 0.3344, attackRecall: 0.001, flipRate: 0 },
      { topK: 2, macroF1: 0.3344, attackRecall: 0.001, flipRate: 0 },
      { topK: 3, macroF1: 0.3351, attackRecall: 0.002, flipRate: 0.0015 },
      { topK: 4, macroF1: 0.3331, attackRecall: 0, flipRate: 0.001 },
      { topK: 5, macroF1: 0.3331, attackRecall: 0, flipRate: 0.001 },
    ],
  },
}
