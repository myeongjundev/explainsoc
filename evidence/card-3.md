# 카드 3 증거 — 데이터와 비밀값

> 통과 기준: BRB-C06 · BRB-C07 (BRB-C12는 카드 5에서 전체 제출물로 다시 확인)
> 기록일: 2026-09-22 · 기록한 사람: Claude(구현 담당)

## 데이터는 두 파일에만 있다

논문 근거와 예시 숫자를 화면 컴포넌트에 흩어 쓰지 않는다. 화면과 판독 규칙은 이 두 파일의 이름으로만
논문을 참조한다. 카드 3에서 규칙 R04의 논문 예시 문구와 주장 뒤집기의 범위 문장에 남아 있던 `0.0002`,
`CICIDS2017` 두 곳도 데이터 모듈에서 가져오도록 바꿨다.

| 파일 | 담은 것 |
|---|---|
| `src/data/paperEvidence.ts` | 논문 제목·저장소·PDF·데이터셋 인용, 학습 공격 9종·시험 공격 3종, 두 XGBoost의 혼동행렬 원수치와 원고 반올림 지표, 시험 구성 원수, 근거 P01~P10(원문 인용 10개) |
| `src/data/examples.ts` | 예시 A·B — 위 파일의 값을 폼 문자열로 옮긴 것 |

## 예시 데이터의 출처와 필드 — BRB-C06

| 필드 | 예시 A (60초 검토) | 예시 B (높은 무작위 점수) | 출처 |
|---|---|---|---|
| 주장 지표 | Accuracy 0.6299, FPR 0.0002 | Accuracy 0.9988, Macro F1 0.9979, 공격 Recall 0.9974, FPR 0.0009 | 원고 V-2 표 |
| 혼동행렬 TN·FP·FN·TP | 375,432 · 86 · 220,628 · 160 | 418,934 · 362 · 220 · 84,955 | 제출 연구 DAY-2 보고서 (P09) |
| 시험 자료를 나눈 방식 | 학습에 없던 공격을 따로 시험 | 무작위 | 원고 IV-3 |
| 학습 때 없던 공격의 시험 | 예 | 아니오 | 원고 IV-3 |
| 중복 제거 | 예 | 예 | 원고 V-1·IV-3 |
| 가장 좋은 모델이라는 소개 | 비워 둠 | 비워 둠 | — |

그 밖의 고정값:

| 값 | 출처 |
|---|---|
| 시험 전량 596,306 · 시험 정상 375,518 · 시험 공격 220,788 (항상 정상 기준선의 원수) | 원고 IV-3 표 |
| 학습 공격 9종, 시험 공격 3종 | 원고 IV-3 원문 |
| 원문 인용 10개 | 원고 IV-3·IV-4·V-1·V-2·VI-2·VI-3·VII — 원고와 글자 하나까지 같음을 대조했다 |

**데이터에 없는 것:** 원자료 행, IP 주소, 사용자 이름, 실제 조직 자료, 회사·제품 이름. 앱에 들어 있는
숫자는 공개 데이터셋 CICIDS2017을 쓴 10번 논문의 **집계 결과**뿐이다. 사용자가 적는 값은 앱에 저장되지
않는다.

## 비밀값 — BRB-C07

런타임 의존성은 `react`와 `react-dom` 둘뿐이다. 런타임 AI 서비스, 백엔드, 분석 도구, 광고, 추적 스크립트,
외부 글꼴, 외부 이미지를 쓰지 않으므로 API 키나 비밀값이 필요한 곳 자체가 없다.

README의 문구:

> **필요한 환경 변수 없음.** 앱은 런타임 AI 서비스, 백엔드, 분석 도구를 쓰지 않아 API 키나 비밀값이
> 필요 없습니다. `.env` 파일은 `.gitignore`로 막혀 있습니다.

`.gitignore`는 저장소를 연 날부터 `.env`, `.env.*`를 막고 `.env.example`만 허용한다.

## 자동 검사 — `npm run check`

`scripts/check-safety.mjs`가 Git이 추적하거나 추적할 파일 전부와 배포본(`dist`)을 본다. 하나라도 걸리면
실패하고, 카드 4에서 CI에 붙인다.

| 검사 | 보는 곳 | 결과 |
|---|---|---|
| 비밀값 문자열 — AWS·API 키(sk-)·GitHub·Slack·Google 토큰, 개인 키, 비밀값 대입 | 모든 텍스트 파일 | PASS |
| 개인정보 후보 — 이메일, 휴대전화 번호, 주민등록번호, IPv4 | 모든 텍스트 파일 | PASS |
| HTML 삽입·동적 코드 실행 — `dangerouslySetInnerHTML`, `innerHTML` 대입, `insertAdjacentHTML`, `document.write`, `eval`, `new Function` | 앱 소스 | PASS |
| 브라우저 저장소 — `localStorage`, `sessionStorage`, `document.cookie`, `indexedDB` | 앱 소스 | PASS |
| 네트워크 요청 API — `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon` | 앱 소스 | PASS |
| 외부 주소 — 공개 링크(`github.com/myeongjundev/explainsoc…`) 말고는 없음 | 앱 소스 | PASS |
| 저장소에 올라간 환경 파일 | Git 파일 목록 | PASS |
| 외부 주소 | 배포본 | PASS |
| 외부 글꼴·CDN | 배포본 | PASS |
| 콘텐츠 보안 정책 `connect-src 'none'` | 배포본 | PASS |

```text
검사한 파일 62개 · 앱 소스 29개 · 검사 10개 · 실패 0개
```

배포본에 글자로만 들어 있는 주소 둘은 허용 목록에 두고 이유를 적었다. `http://www.w3.org/…`는 SVG 이름공간,
`https://react.dev/errors/…`는 React 오류 메시지 속 설명 링크다. 둘 다 요청하지 않는다.

처음 돌렸을 때 `src/app/App.tsx`의 **주석**에 적힌 `localStorage`라는 글자 하나가 걸렸다. 검사기를 느슨하게
만들지 않고 주석을 "브라우저 저장소"로 고쳤다.

### 검사기가 실제로 잡는지

위반을 일부러 넣은 임시 파일(`src/__probe.tsx`)로 한 번 돌렸다. 넣은 일곱 가지를 모두 잡았고, 파일을 지운
뒤 다시 전부 통과했다. 임시 파일은 커밋하지 않았다. 넣은 값은 이 문서에도 그대로 적지 않는다 —
적으면 검사기가 이 문서를 잡는다(카드 4에서 실제로 잡혀 표기를 바꿨다).

| 넣은 것 | 잡은 검사 |
|---|---|
| `AKIA…` 형식의 가짜 키 | 비밀값 문자열 — AWS 액세스 키 |
| 예약 도메인 `…@example.com` 형식의 가짜 이메일 | 개인정보 후보 — 이메일 |
| `010-`으로 시작하는 가짜 휴대전화 번호 | 개인정보 후보 — 휴대전화 번호 |
| `dangerouslySetInnerHTML` | HTML 삽입·동적 코드 실행 |
| `localStorage.setItem` | 브라우저 저장소 |
| `fetch(…)` | 네트워크 요청 API |
| `https://tracker.example.com/collect` | 외부 주소 (앱 소스) |

## 입력은 브라우저 안에만

| 약속 | 확인한 곳 |
|---|---|
| 입력은 메모리에만, URL·쿠키·저장소에 남기지 않음 | `tests/e2e/flows.spec.ts` — 예시 실행 뒤 `localStorage`·`sessionStorage` 0개, 쿠키 없음, 주소 그대로, 새로 고침 뒤 입력 없음 |
| 정적 자산 말고는 요청하지 않음 | `tests/e2e/quality.spec.ts` — 앱 밖 요청 0건, 같은 출처의 요청은 JS·CSS·아이콘뿐 |
| 앱 코드가 요청을 보낼 수 없음 | 배포본 콘텐츠 보안 정책 `default-src 'none'; connect-src 'none'` — 브라우저에서 `fetch`가 막히는 것을 확인 |
| 질문 복사에 입력한 숫자가 담기지 않음 | `tests/unit/reviewRules.test.ts`, `tests/component/app.test.tsx`, `tests/e2e/flows.spec.ts` |
| HTML 문자열을 그리지 않음 | React 텍스트로만 렌더링, 검사기가 HTML 삽입 API를 막음 |

## 검증

| 검사 | 결과 |
|---|---|
| `npm run check` | 10개 PASS |
| 단위·컴포넌트 테스트 | 74개 통과 |
| 브라우저 테스트 | 20개 통과 |
| 타입 검사 | 통과 |

## 완주 체크리스트

- [x] 실제 개인정보와 비밀값을 뺐습니다. — 데이터 명세와 `npm run check`
