# 진행 기록

## 2026-09-21 — 저장소 생성

- 과제 원문을 `planning/T13-ASSIGNMENT.md`에 그대로 옮겼다. 통과 기준은 BRB-C01~C15와
  BRB-C22이고, BRB-C16~C21은 원문에 없다.
- 공개 저장소 `myeongjundev/explainsoc`를 만들었다. 논문 저장소 `explainsoc-research`와
  짝이다. GitHub Pages로 올리면 주소는 https://myeongjundev.github.io/explainsoc/ 가 된다.
- 선행 조건인 마지막 과제 A(12번 사이트)는 2026-09-21에 제출됐다.
- 작업 문서는 `docs/`가 아니라 `planning/`에 둔다. 나중에 `docs/`를 Pages 루트로 쓰면
  작업 문서가 공개 사이트에 섞이기 때문이다.
- 비밀값이 올라가지 않도록 `.gitignore`에서 `.env`를 처음부터 막았다. 예시 파일
  `.env.example`만 올릴 수 있다.

## 2026-09-21 — Claude 의견 정리

- 카드 1 후보와 설계에 넘길 조건을 `planning/CLAUDE-OPINION.md`에 적었다. **결정 문서가 아니다.**
- 요지: 논문의 숫자를 보여 주는 앱이 아니라, 논문이 찾은 "점수 착시" 규칙으로 **사용자가 가져온
  평가 숫자를 점검해 주는 판독기**(후보 A). 낮은 오탐의 함정(B)과 설명 안정성(C)은 A의 판독 항목으로.
- 10번 저장소에 이 과제로 이월된 ExplainSOC 대시보드가 있다(D-003). 결과 열람용이고 FastAPI
  백엔드가 있어 그대로 내기보다 안전선과 문구를 가져오자는 의견을 적었다.
- 설계는 Codex가 맡는다. 작업 요청문은 `planning/CODEX-HANDOFF.md`. 이번 요청은 **설계까지**이고,
  `planning/DESIGN.md`를 쓴 뒤 멈춰 사용자 검토를 받는다. 구현은 승인 뒤다.

## 2026-09-21 — Codex 두 후보에 대한 Claude 답

- Codex가 카드 1 후보로 Evidence Gate와 SplitLens를 내고 Claude 검토를 요청했다
  (`planning/CLAUDE-CARD1-REVIEW.md`). 답은 `planning/CLAUDE-CARD1-ANSWER.md`. **결정 문서가 아니다.**
- 요지: Evidence Gate를 앱으로 두고, SplitLens는 사용자 입력 도구가 아니라 **논문의 실제 분할 그림**
  (원고 IV-3의 학습 공격 9종 대 시험 공격 3종, 겹침 0)으로만 넣는다. "확인됨"은 앱이 보증하는 것처럼
  읽혀 이름을 바꾼다.
- 예시 숫자에서 걸린 것: 미관측 분할 혼동행렬을 원고의 반올림된 오탐률로 역산하면 오탐이 약 75건인데
  `DAY-2-REPORT.md`의 정확한 값은 86건이다. 예시는 그 표에서 가져온다. 또 그 보고서의 "시간" 분할은
  앱에서 원고 용어 "미관측 공격 스트레스 테스트"로 쓴다.
- Codex 요청문에 **과제 원문을 처음부터 끝까지 읽으라**고 적었다. 검토 요청서가 통과 기준 번호만
  기준으로 삼았는데, 원문의 증거 보관 기준("기술의 난이도는 보지 않습니다"), 완주 체크리스트, 카드마다
  막히는 지점과 남길 것이 설계를 가른다. 설계 문서에도 체크리스트와 남길 것을 어떻게 채울지 넣게 했다.

## 다음 할 일 — 카드 1

논문 결론에서 결과 하나를 골라 "○○인 사람이 △△할 때 이 앱이 □□을 해 준다"로 쓰고,
그 사람이 앱에서 할 일 세 가지를 정한다(BRB-C01·C02). **본인이 고른다.**

순서: 본인이 문장을 고른다 → Codex가 설계한다. 참고 문서는 `planning/CLAUDE-OPINION.md`.

- 논문 원문: `explainsoc-research/output/pdf/T10-research-paper.pdf`
- 결과 요약: `explainsoc-research/README.md`의 "주요 결과", "설명이 안정적이어도 탐지가
  유용한 것은 아니다"

## 12번 사이트와 잇는 자리

`t12-about/content/approved.json`의 `works[]` 가운데 `t13-app`이 지금 `planned` 상태로
비어 있다. 앱을 공개하면 `published`로 바꾸고 링크와 "이 앱이 누구를 어떻게 돕는가" 한
문장을 넣는다(BRB-C10). 12번은 이미 제출됐으므로 그때 바꾼 것은 제출 뒤 갱신이다.
