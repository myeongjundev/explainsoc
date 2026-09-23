import { expect, test } from './fixtures'
import { openHome, startExample } from './helpers'

/**
 * 증거 스크린샷. 평소 테스트에서는 건너뛰고 `EVIDENCE=1`일 때만 evidence/screenshots에 남긴다.
 * 카드가 끝날 때 한 번 찍어 증거 문서가 가리키게 한다. `LIVE_URL`과 함께 주면 공개 주소를 찍어
 * evidence/screenshots/live에 따로 둔다.
 */
test.skip(!process.env.EVIDENCE, 'EVIDENCE=1일 때만 스크린샷을 남긴다')

const DIR = process.env.LIVE_URL ? 'evidence/screenshots/live' : 'evidence/screenshots'
const V5_DIR = process.env.LIVE_URL ? 'evidence/screenshots/live' : 'evidence'
const V7_DIR = process.env.LIVE_URL ? 'evidence/screenshots/live' : 'evidence'

test('첫 화면 — 데스크톱 1440×900', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openHome(page)
  await page.screenshot({ path: `${DIR}/a-first-screen-desktop.png` })
})

test('첫 화면 — 모바일 375×812', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await openHome(page)
  await page.screenshot({ path: `${DIR}/a-first-screen-mobile.png`, fullPage: true })
})

test('결과 — 뒤집기 전과 뒤, 데스크톱', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await startExample(page)
  await page.screenshot({ path: `${DIR}/f-result-before-flip-desktop.png` })
  await page.getByRole('button', { name: '공격 기준으로 뒤집기' }).click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${DIR}/f-result-after-flip-desktop.png`, fullPage: true })
})

test('결과 — 모바일 전체', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await startExample(page)
  await page.getByRole('button', { name: '공격 기준으로 뒤집기' }).click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${DIR}/f-result-mobile.png`, fullPage: true })
})

test('받은 숫자 — 잘못된 입력 화면', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await openHome(page)
  await page.getByRole('button', { name: '내 성능표 검토' }).click()
  await page.getByLabel('지표 1').selectOption('accuracy')
  await page.getByLabel('값 (0부터 1 사이)').fill('99')
  await page.getByRole('button', { name: '혼동행렬로 입력' }).click()
  await page.getByLabel(/\(TN\)/).fill('-5')
  await page.getByLabel(/\(FP\)/).fill('abc')
  await page.getByLabel(/\(FN\)/).fill('120')
  await expect(page.getByText('0 이상의 정수로 적어 주세요').first()).toBeVisible()
  await page.screenshot({ path: `${DIR}/b-invalid-input.png`, fullPage: true })
})

test('평가 조건 — 모름 경로', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await openHome(page)
  await page.getByRole('button', { name: '내 성능표 검토' }).click()
  await page.getByRole('button', { name: '다음: 평가 조건' }).click()
  for (const name of [/어떻게 나눴습니까/, /학습 때 없던 공격/, /같은 행을 제거/]) {
    await page.getByRole('group', { name }).getByLabel('모름').check()
  }
  await page.screenshot({ path: `${DIR}/c-conditions-unknown.png`, fullPage: true })
  await page.getByRole('button', { name: '결과 보기' }).click()
  await page.screenshot({ path: `${DIR}/f-result-all-unknown.png`, fullPage: true })
})

test('V5 결과 브리핑 — 현재 회차와 수사 보드', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await startExample(page)
  await page.screenshot({ path: `${V5_DIR}/v5-investigation-board-desktop.png`, fullPage: true })
})

test('V5 회차 분기 — 데스크톱', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await startExample(page)
  await page.getByText('회차 기록과 다음 답변 관리').click()
  await page.getByRole('button', { name: '현재 회차 저장 · 다음 답변 추가' }).click()
  await page.getByLabel('지표 1').selectOption('attackRecall')
  await page.getByLabel('값 (0부터 1 사이)').fill('0.0007')
  await page.getByRole('button', { name: /PoC 검토표/ }).click()
  await page.getByLabel('기존 주장과 같은 시험입니까?').selectOption('no')
  await page.locator('.rounds').screenshot({ path: `${V5_DIR}/v5-separate-branch-desktop.png` })
})

test('V5 결과 브리핑 — 모바일', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await startExample(page)
  await page.locator('.investigation-brief').screenshot({ path: `${V5_DIR}/v5-briefing-mobile.png` })
})

test('V7 결과 1장 — 주장과 근거, 데스크톱', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await startExample(page)
  await page.screenshot({ path: `${V7_DIR}/v7-chapter-evidence-desktop.png`, fullPage: true })
})

test('V7 크기 그림 — 탐지와 오탐의 실제 비율', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await startExample(page)
  await page.locator('.scale-figure').screenshot({ path: `${V7_DIR}/v7-scale-figure-desktop.png` })
})

test('V7 결과 1장 — 모바일', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await startExample(page)
  await page.screenshot({ path: `${V7_DIR}/v7-chapter-evidence-mobile.png`, fullPage: true })
})
