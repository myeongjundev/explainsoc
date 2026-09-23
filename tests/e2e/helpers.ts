import { expect, type Page } from '@playwright/test'

/** 화면 문자열에 들어가면 안 되는 표현. 논문 원문 인용([data-verbatim])만 예외다. */
export const FORBIDDEN_TERMS = ['시간 분할', '미래 성능', '확인됨'] as const

/** 콘솔 오류와 페이지 오류를 모은다. 콘텐츠 보안 정책 위반도 콘솔 오류로 나온다. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}

/** 앱이 보낸 요청을 모은다. 정적 자산 말고는 없어야 한다. */
export function collectRequests(page: Page): string[] {
  const urls: string[] = []
  page.on('request', (req) => urls.push(req.url()))
  return urls
}

export async function openHome(page: Page) {
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('보안 AI의 99%, 무엇을 시험한 점수일까요?')
}

export async function startExample(page: Page) {
  await openHome(page)
  await page.getByRole('button', { name: '논문 예시로 60초 검토' }).click()
  await expect(page.getByRole('heading', { level: 2, name: '3. 검토 결과' })).toBeFocused()
}

/** V8: 처음 입력은 한 화면씩 묻는다. 여러 칸을 한꺼번에 채우는 시험은 한 장짜리 폼으로 연다. */
export async function openOwnForm(page: Page) {
  await page.getByRole('button', { name: '내 성능표 검토' }).click()
  await page.getByRole('button', { name: '질문 전체 한 번에 보기' }).click()
  await expect(page.getByRole('heading', { level: 2, name: '받은 숫자와 평가 조건을 적어 주세요' })).toBeVisible()
}

/** V7: 결과는 한 번에 한 장만 보인다. 위쪽 결과 목차로 그 장을 연다. */
export async function openChapter(page: Page, chapter: '주장과 근거' | '판독' | '다음 행동') {
  await page.getByRole('navigation', { name: '결과 목차' }).getByRole('button', { name: chapter, exact: true }).click()
}

export function questionItems(page: Page) {
  return page.getByRole('region', { name: '공급자에게 물을 질문' }).locator('.question-card__text')
}

/** 가로 스크롤이 생겼는지. 요소 하나라도 화면 밖으로 나가면 그 이름을 돌려준다. */
export async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth
    const page = document.documentElement.scrollWidth
    const offenders = [...document.querySelectorAll('body *')]
      .filter((el) => {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.right <= vw + 1) return false
        // 가로로 스크롤하도록 만든 표 안쪽은 페이지를 넓히지 않는다
        return !el.closest('.table-wrap')
      })
      .map((el) => `${el.tagName.toLowerCase()}.${el.className}`)
      .slice(0, 5)
    return { vw, page, offenders }
  })
}

/** 모든 펼침을 연 뒤, 원문 인용을 뺀 화면 글자를 돌려준다. */
export async function visibleTextOutsideQuotes(page: Page) {
  return page.evaluate(() => {
    document.querySelectorAll('details').forEach((d) => (d.open = true))
    const clone = document.body.cloneNode(true) as HTMLElement
    clone.querySelectorAll('[data-verbatim="true"]').forEach((n) => n.remove())
    return clone.textContent ?? ''
  })
}
