# 인계 — 2026-09-22 저녁 (학원 PC → 집 PC)

> 집에서 이 문서 하나만 읽고 이어서 할 수 있게 적었다. 기록한 사람: Claude · 2026-09-22 17:10 무렵
> 아침 인계 문서는 [`HANDOFF-2026-09-22.md`](HANDOFF-2026-09-22.md)(Codex가 V5 기준으로 갱신)다.
> 이 문서가 더 최신이다.

## 0. 한 줄 상태

**V5까지 구현·배포·검증이 끝났다. 남은 것은 사람만 할 수 있는 두 가지(처음 보는 사람 시험, 제출문 ②)와 제출이다.**
V5는 기능을 늘리지 않고 결과 첫 화면에 Decision Brief를 두고 모바일 결과를 장면별로 나눴다.

| 무엇 | 값 (2026-09-22 V5 확인) |
|---|---|
| V5 구현 커밋 | `7d0a105` feat: 결과를 먼저 읽는 V5 브리핑으로 재구성한다 |
| CI | [run 35728715004](https://github.com/myeongjundev/explainsoc/actions/runs/35728715004) 검사·Pages 배포 성공 |
| 공개 주소 | https://myeongjundev.github.io/explainsoc/ — 자산 `index-WXO94w-9.js`, `index-i0wfD4Ar.css` (V5) |
| 제출 ZIP | `explainsoc-7d0a105.zip` · 140,605 bytes · 63개 파일 · SHA-256 `1b2854d4a847a5606711b4ba020adc6595ca698f5aefc96a0bdc668f7c21fe92` |
| ZIP 위치 | 현재 PC `release/`에만 있다(`.gitignore`). 다른 PC에서는 2절 명령으로 다시 만든다 |
| 검증 수 | 안전 검사 11 · Vitest 92 · Playwright 26(증거 캡처 9 제외). 공개 주소는 26개와 캡처 9개 통과 |
| 12번 저장소(about) | `e53e2c3` — V5 Decision Brief 카드, T12 검사·Pages 성공 |
| 제출 자료 | [`evidence/card-5.md`](../evidence/card-5.md) 맨 위 "V5 대표 앱 제출본" 표와 "짧은 확인 방법" |

## 1. 오늘 한 일 (시간순)

| 시각 | 커밋 | 누가 | 무엇 |
|---|---|---|---|
| 09시 | `06b4ef8` | Claude | 학원 PC에서 V1 ZIP(`9d71d39`) 해시가 집 PC와 같음을 기록 |
| 10시 | `720dc76` `b09fb8b` | Codex | **V2** — PoC 검토 작업대, 평가 근거 지도, 질문 상태·메모, 검토표 복사·인쇄, R11~R13 |
| 10시 | `a445fbf` | Claude | V2 AI 페르소나 사전 시험([`evidence/persona-pretest-2026-09-22.md`](../evidence/persona-pretest-2026-09-22.md)) — **BRB-C11 증거 아님** |
| 11시 | `74abf7f` | Claude | V2 리뷰와 V3 아이디어([`CLAUDE-V3-IDEAS.md`](CLAUDE-V3-IDEAS.md)) |
| 12시 | `8696eb9` `0a4c531` | Codex | **V3** — 회차별 사례, 같은 시험 예/아니오/모름, R14, 사례 JSON 저장·열기, 자료 요청서 |
| 12시 | `5642f50` | Claude | V3 독립 최종 리뷰([`CLAUDE-V3-REVIEW.md`](CLAUDE-V3-REVIEW.md)) — 조건부 제출 가능, 막힘 1·권장 5·나중 3 |
| 16시 | `679add3` `2de42f4` | Codex | 리뷰 R1~R5·L1~L3 반영(설계 25절). "아니오"는 별도 시험 분기, 이전 회차 메모 이어받기, 코드에 제목 붙이기 등 |
| 16~17시 | `3220867` `454f75d` | Codex | **V4** — 첫 화면 Claim Autopsy(99.88% → 두 시험 → 220,788건 중 160건), 결과 3열 수사 보드, 6항목 근거 지도, 회차 분기 타임라인, Decision Dossier, 인쇄 회귀 검사. 12번 카드 V4로 갱신(about `5584650`) |
| 21~22시 | `7d0a105` | Codex | **V5** — 결과 우선 Decision Brief, 독립 3열 카드, 모바일 장면 전환, 회차 입력 펼침. 공개본·격리 ZIP 검증 뒤 12번 카드도 `e53e2c3`으로 갱신 |

설계 근거: [`DESIGN.md`](DESIGN.md) 23절(V2) · 24절(V3) · 25절(V3 리뷰 반영) · 26절(V4) · 27절(V5).
22절 다섯 결정(제품명, 첫 화면 제목, `성능표에 없는 질문`, 9종 대 3종 그림, URL+ZIP)은 유지된 상태다.
V4 첫 화면 제목도 코드상 `그 99%, 무엇을 시험한 점수입니까?` 그대로다(`src/components/Hero.tsx`).

## 2. 집에서 처음 할 일 (15분)

```bash
git -C t13-explainsoc pull --ff-only
```

```bash
git -C t12-about pull --ff-only
```

```bash
npm --prefix t13-explainsoc ci
```

```bash
npm --prefix t13-explainsoc run verify
```

기대: 안전 검사 11 · Vitest 92 · 빌드 · Playwright 26 통과.
집 PC는 광고 차단 프로그램의 스크립트 삽입이 있었다([`../TROUBLESHOOTING.md`](../TROUBLESHOOTING.md) 1번). fixture 덕분에 테스트는 통과해야 한다.

**제출 ZIP 다시 만들기 — 커밋을 반드시 적는다.**

```bash
npm --prefix t13-explainsoc run release:zip -- 7d0a105
```

- SHA-256이 `1b2854d4…21fe92`(위 표 전체 값)와 **같으면** 그 파일을 낸다.
- **다르면** 새 해시를 card-5에 적고, 아침 인계 문서 5절대로 새 빈 폴더에서 `npm ci → build → preview → check → test → test:e2e`를 한 번 돌린다.

## 3. 남은 일 — 사람만 할 수 있음

### 3-1. 처음 보는 사람 한 명 (BRB-C11, 필수)

- 오늘 한 페르소나 시험은 **V2 화면 기준 AI 사전 시험**이라 BRB-C11 증거가 아니다. 결과 구조가 바뀌었으므로 **공개 V5로 사람 시험을 한다.**
- 공개 주소만 주고, 설명·도움 없이 옆에서 본다. 시계를 켠다.
- 적을 것([`card-5.md`](../evidence/card-5.md) "처음 보는 동료 한 명"·"사람이 잰 60초" 양식):
  - 1분 안에 "누구를 돕는 앱인지" 말하는가(몇 초)
  - 세 행동을 혼자 끝내는가 — V5 기준: 숫자·근거 입력(또는 논문 예시) → Decision Brief와 빠진 조건 검토 → 질문 상태·메모 남기고 검토표 복사·인쇄
  - 막힌 곳(본 그대로)
  - 논문 예시로 핵심 장면(99.88% 해부 → 160건 탐지 → 공급자 질문)까지 몇 초
  - 마지막 "한 줄로 말하면?" — **이름 없이** 그대로
- 특히 볼 곳(오늘 리뷰에서 나온 것):
  1. "논문 예시로 60초 검토"를 시간 제한으로 읽는지
  2. 질문 상태·메모를 스스로 찾는지, "질문만 복사"에서 멈추는지 Decision Dossier까지 가는지
  3. "다음 답변 추가" 뒤 무엇을 적어야 하는지 아는지, "아니오 — 별도 시험" 분기를 어떻게 읽는지
- 끝나면 card-5에 붙이고 [`IMPLEMENTATION-CHECKLIST.md`](IMPLEMENTATION-CHECKLIST.md) BRB-C11(102행)을 `[x]`로.

### 3-2. 제출문 ② "내가 직접 판단한 일" (BRB-C14, 필수, 본인만)

- ①(AI에게 맡긴 일)·③(따르지 않은 제안)은 card-5에 초안이 있다. 본인 말로 다듬는다.
- ②는 비어 있다. 본인이 쓴다. 오늘 본인이 내린 판단 후보(사실만):
  - V2 → V3 → V4로 "과제 제출용 앱"을 "포트폴리오 대표 앱"으로 키우기로 한 결정
  - V3 파일 저장·다시 열기(업로드 금지·새로 고침 소멸 결정을 여는 일)를 허용한 결정
  - V3 리뷰 결과(R1~R5)를 반영한 뒤 V4 구조 개편으로 넘어간 결정
  - AI 페르소나 시험을 BRB-C11 증거로 쓰지 않기로 한 것
- 다 쓰면 card-5 ② 자리에 붙이고 체크리스트 BRB-C14(105행)를 `[x]`로.

### 3-3. 제출

1. 결과물 URL: https://myeongjundev.github.io/explainsoc/
2. 실행 묶음: `explainsoc-7d0a105.zip` (2절에서 만든 파일)
3. 짧은 확인 방법: card-5 "짧은 확인 방법" 코드 블록 그대로(V5 값: ZIP 7d0a105, R01~R14, 92/26)
4. 세 줄: ①·③ 다듬은 것 + ② 본인 글

내기 직전에 새 시크릿 창에서 URL이 로그인 없이 열리는지 본다(BRB-C15). 낸 뒤 [`STATUS.md`](STATUS.md) 맨 위에 "제출" 항목(날짜·시각, 커밋, ZIP 이름·SHA-256)을 쓴다.

## 4. 주의

- **앱을 또 고치면 ZIP이 바뀐다.** 제출 전 추가 개선은 하지 않는 것을 권한다. 고치면 새 커밋으로 ZIP·card-5·12번 카드 테스트 수까지 다시 맞춘다(아침 인계 문서 5·7절).
- **card-5 뒷부분의 옛 기록.** V1~V4 절은 이력으로 남겨 둔 것이다. 제출문을 다듬을 때 현재 사실(R01~R14, V5)과 맞는지 본다.
- 12번 저장소(about)에 09-21부터 남아 있던 `planning/T12-POST-SUBMISSION-REVIEW.md`(Codex의 T12 제출 후 리뷰)와 README 연결 한 줄을 `5c6da83`으로 올렸다. 개선 항목(P1~P3)은 제출 뒤 과제다.
- 공개 주소는 Pages 캐시(`max-age=600`) 때문에 배포 뒤 최대 10분 이전 화면이 보일 수 있다.
- 제출물 어디에도 본인 외 실명·연락처·비밀값을 두지 않는다. 사람 시험 기록도 이름 없이.

## 5. 참고 문서

- 제출 자료·양식: [`evidence/card-5.md`](../evidence/card-5.md)
- 진행 기록: [`STATUS.md`](STATUS.md) 맨 위(V5 → V4 → V3 리뷰 반영 → V3)
- 설계: [`DESIGN.md`](DESIGN.md) 22~27절
- 리뷰: [`CLAUDE-V3-IDEAS.md`](CLAUDE-V3-IDEAS.md) · [`CLAUDE-V3-REVIEW.md`](CLAUDE-V3-REVIEW.md) · [`../evidence/persona-pretest-2026-09-22.md`](../evidence/persona-pretest-2026-09-22.md)
- V5 증거 화면: `evidence/v5-investigation-board-desktop.png`, `evidence/v5-separate-branch-desktop.png`, `evidence/v5-briefing-mobile.png`, 공개본은 `evidence/screenshots/live/`
- 트러블슈팅: [`../TROUBLESHOOTING.md`](../TROUBLESHOOTING.md)
