# 학원 인계 — 2026-09-23

> 이 문서를 먼저 읽는다. 2026-09-22의 이전 인계 문서는 V1~V5 이력 확인용이고, 현재 제출 기준은 이 문서의 V6다.
> 저장소: `myeongjundev/explainsoc` · 12번 포트폴리오: `myeongjundev/about`

## 0. 한 줄 상태

**ExplainSOC V6 구현·배포·자동 검증·격리 ZIP 검증·T12 대표작 반영까지 끝났다. 남은 필수 작업은 새로운 처음 보는 사람 재시험, 제출문 ② 직접 작성, 최종 제출이다.**

| 항목 | 현재 값 |
|---|---|
| 공개 앱 | https://myeongjundev.github.io/explainsoc/ |
| V6 구현 커밋 | `b5384eee193add96acbacd1f59d2dbf5d06a9577` |
| 최신 증거 문서 커밋 | `1374b48` · 이 인계 문서 커밋은 그 뒤에 생긴다 |
| T12 대표 카드 | https://myeongjundev.github.io/about/#work-t13-app · `about` 커밋 `64945b4` |
| 제출 ZIP | `explainsoc-b5384ee.zip` · 140,962 bytes · 63개 파일 |
| ZIP SHA-256 | `5cda7ec171d36a352dd3cd33f5b17a1092453a8356288862d4200bd189b8c87b` |
| 검증 | 안전 11 · Vitest 92 · Playwright 기능·품질 26 · 증거 캡처 9 |
| 제출 자료 | [`../evidence/card-5.md`](../evidence/card-5.md) |

제출 ZIP은 `.gitignore` 때문에 GitHub에 없다. 집 PC에는 `release/explainsoc-b5384ee.zip`으로 있고,
학원 PC에서는 아래 명령으로 같은 구현 커밋에서 다시 만든다.

---

## 1. V5와 V6에서 바꾼 것

### V5 — 결과를 먼저 읽게 함

- 결과 맨 앞에 `Decision Brief`를 두어 현재 회차, 확인 필요·해석 주의·다음 질문 수와 첫 질문을 먼저 보여 준다.
- 데스크톱 결과는 `주장·근거 / 판독 / 다음 행동` 독립 3열 카드로 정리했다.
- 모바일은 세 열을 길게 쌓지 않고 한 장씩 전환한다.
- 회차 입력은 결과 뒤 펼침 영역으로 옮겼다.
- R01~R14, P01~P10, JSON, 계산식, 개인정보·CSP 경계는 유지했다.

### 첫 사람 관찰 — 실패를 숨기지 않음

사용자가 앱을 처음 본 비전공자 한 명에게 공개 주소를 보여 줬다. 받은 결과는 **무엇을 하는 사이트인지
잘 모르겠다는 것**이었다. 시간·기기·세 행동 완주 여부와 직접 인용을 받지 못했으므로 BRB-C11 완료로
처리하지 않았다. 기록은 `evidence/card-5.md`의 `첫 관찰 — 목적 전달 실패`에 있다.

### V6 — 첫 10초를 쉬운 말로 바꿈

- 제목: `보안 AI의 99%, 무엇을 시험한 점수일까요?`
- 설명: `“정확도 99%” 같은 광고 숫자가 실제로 무엇을 시험한 결과인지 확인하고, 판매 업체에 물어볼 질문을 만들어 주는 도구`
- 사용 상황: 회사에서 AI 제품 자료를 받았지만 어떤 공격을 시험했는지, 처음 보는 공격도 잡는지 모를 때
- 세 단계: `성능 숫자 입력 → 모르는 시험 조건 답변 → 업체 질문 완성`
- 기능·수치·논문 근거·판독 규칙은 바꾸지 않았다.

설계 근거는 [`DESIGN.md`](DESIGN.md) 27절(V5)과 28절(V6)이다.

---

## 2. 학원 PC에서 시작할 때

상위 폴더 `C:\gov\project\skt aleph`에서 실행한다.

```powershell
git -C t13-explainsoc pull --ff-only
git -C t13-explainsoc status -sb
git -C t12-about pull --ff-only
git -C t12-about status -sb
```

두 저장소 모두 `main...origin/main`이고 변경 파일이 없어야 한다. 그다음 13번을 검증한다.

```powershell
node -v
npm --prefix t13-explainsoc ci
npm --prefix t13-explainsoc run verify
```

기대 결과:

- 안전 검사 11개
- 단위·컴포넌트 테스트 92개
- 프로덕션 빌드
- 실제 브라우저 테스트 26개 통과, 증거 전용 9개 제외

제출 ZIP을 같은 구현 커밋에서 다시 만든다.

```powershell
npm --prefix t13-explainsoc run release:zip -- b5384ee
```

출력 파일과 SHA-256이 이 문서 0절과 같으면 그대로 사용한다. 다르면 제출하지 말고 Git 버전·HEAD·파일 수를
먼저 확인한다. ZIP을 다른 내용으로 다시 만들었다면 `evidence/card-5.md`와 `planning/STATUS.md`도 함께 고친다.

---

## 3. 학원에서 반드시 할 일 1 — 새로운 사람 재시험

첫 참가자는 이미 화면을 봤으므로 BRB-C11의 `처음 보는 사람` 재시험 대상이 아니다. **새 사람 한 명**에게
설명 없이 아래 공개 주소만 준다.

https://myeongjundev.github.io/explainsoc/

옆에서 도와주지 말고 시계를 켠다. 아래 항목을 빠짐없이 기록한다.

```text
날짜: 2026-__-__
기기·브라우저: ____________________
1분 안에 누구를 어떻게 돕는 앱인지 말했나: 예 / 아니오 (__초)
세 행동을 도움 없이 끝냈나:
  ① 숫자 적기 또는 예시 선택: 예 / 아니오
  ② 시험 조건에 답하기: 예 / 아니오
  ③ 질문 복사: 예 / 아니오
막힌 곳: ____________________
이름 없는 정확한 한 줄: "____________________"
논문 예시 시작 → 공격 기준으로 뒤집기 → 질문 복사: __초
"공격 220,788건 가운데 탐지 160건"의 뜻을 말했나: 예 / 아니오
```

끝나면 `evidence/card-5.md`의 BRB-C11과 사람이 잰 60초 절에 그대로 옮긴다. 이름·학교·연락처는 적지 않는다.
모든 항목이 실제로 확인된 뒤에만 `planning/IMPLEMENTATION-CHECKLIST.md`의 BRB-C11과 V6 재시험을 `[x]`로 바꾼다.

막히면 성공한 것처럼 다듬지 않는다. 관찰을 먼저 적고, 수정이 필요하면 설계 범위 안인지 판단한다. 코드를
고치면 새 구현 커밋, CI, 공개 검사, 새 ZIP, card-5, STATUS, T12 카드까지 다시 맞춰야 한다.

---

## 4. 학원에서 반드시 할 일 2 — 제출문 ②

`evidence/card-5.md`의 제출문 세 줄에서 ①과 ③은 기록에 근거한 초안이 있다. **② `내가 직접 판단한 일`은
사용자가 직접 쓴다. AI가 대신 작성하지 않는다.**

판단 근거를 찾을 위치:

- `evidence/card-1.md` — 제품 방향 승인
- `planning/DESIGN.md` 22절 — 카드 1 결정
- `planning/DESIGN.md` 24~28절 — V3~V6 확장 판단
- `planning/STATUS.md` — 날짜별 실제 결정과 검증
- `evidence/card-5.md` — AI에게 맡긴 일과 따르지 않은 제안 후보

직접 쓴 문장을 card-5의 ②에 붙이고, BRB-C14를 `[x]`로 바꾼다.

---

## 5. 제출 직전 순서

1. 새 시크릿 창에서 https://myeongjundev.github.io/explainsoc/ 이 로그인 없이 열리는지 본다.
2. 첫 화면 제목이 `보안 AI의 99%, 무엇을 시험한 점수일까요?`인지 본다.
3. `논문 예시로 60초 검토`를 눌러 Decision Brief와 첫 질문이 나오는지 본다.
4. 제출 ZIP의 이름·크기·SHA-256을 0절과 대조한다.
5. 양식에 다음 네 가지를 낸다.
   - 결과물 URL
   - `explainsoc-b5384ee.zip`
   - `evidence/card-5.md`의 `짧은 확인 방법`
   - 제출문 ①·②·③
6. 제출 뒤 `planning/STATUS.md` 맨 위에 제출 시각, 제출 커밋, ZIP 이름·SHA-256, 실제 제출 문안을 기록하고 커밋·푸시한다.

---

## 6. 검증된 현재 사실

### 13번 ExplainSOC

- 구현 CI: https://github.com/myeongjundev/explainsoc/actions/runs/35732418454 — 성공
- 최신 문서 CI: https://github.com/myeongjundev/explainsoc/actions/runs/35733647235 — 성공
- 공개 주소에서 기능·품질 26개와 증거 캡처 9개, 합계 35개 통과
- 공개 JS `index-CRXUGNHw.js`, CSS `index-BHoV4po4.css`가 로컬 빌드와 SHA-256 일치
- 저장소 밖 새 임시 폴더에서 `npm ci → check → test → build → check → preview HTTP 200 → test:e2e` 통과

### 12번 포트폴리오

- 커밋 `64945b4` — 쉬운 한 문장 반영
- T12 checks: https://github.com/myeongjundev/about/actions/runs/35732677557 — 성공
- Pages: https://github.com/myeongjundev/about/actions/runs/35732676543 — 성공
- 단위 검사 20개, 반복 생성, 외부 URL 포함 릴리스 검사, 제출 ZIP 생성 통과
- V5 Decision Brief 대표 그림과 92개·26개 검증 문장은 유지

---

## 7. 중요한 파일

| 목적 | 파일 |
|---|---|
| 현재 제출 사실·사람 시험 양식·세 줄 | `evidence/card-5.md` |
| 제품 설계와 V5·V6 결정 | `planning/DESIGN.md` 27~28절 |
| 완료 여부 | `planning/IMPLEMENTATION-CHECKLIST.md` 9~10절 |
| 날짜별 작업 기록 | `planning/STATUS.md` 맨 위 |
| 첫 화면 | `src/components/Hero.tsx`, `src/styles/app.css` |
| 결과 브리핑 | `src/components/InvestigationBrief.tsx`, `src/components/ResultStep.tsx` |
| 제출 ZIP 생성 | `scripts/make-release-zip.mjs` |
| 공개·접근성·보안 회귀 | `tests/e2e/` |
| V6 첫 화면 증거 | `evidence/screenshots/a-first-screen-desktop.png`, `a-first-screen-mobile.png` |

---

## 8. 지켜야 할 경계

- 사람의 평가, 시간, 행동 결과를 지어내지 않는다.
- 자동 판정·합격 점수·위험 등급을 추가하지 않는다. 앱은 빠진 근거와 다음 질문을 보여 주는 도구다.
- 입력 자료를 서버·브라우저 저장소로 보내거나 자동 저장하지 않는다.
- 제출물에 본인 외 실명·연락처·비밀값을 넣지 않는다.
- 10번 논문 저장소는 제출본이므로 읽기만 한다.
- 12번 저장소는 `t13-app` 카드와 관련 기록 외에는 건드리지 않는다.
- 다른 변경이 보이면 덮어쓰지 말고 먼저 `git status -sb`와 diff를 확인한다.

## 9. 완료 판정

- [x] V6 구현·검증·배포
- [x] V6 재현 가능한 ZIP과 격리 실행
- [x] 첫 비전공자 실패 관찰 기록
- [x] T12 대표 카드 쉬운 설명 반영
- [ ] 새로운 처음 보는 사람 재시험과 60초 측정
- [ ] 제출문 ② 직접 작성
- [ ] 시크릿 창 최종 확인과 제출
