import AxeBuilder from '@axe-core/playwright'
import { expect, test } from './fixtures'
import {
  collectErrors,
  collectRequests,
  FORBIDDEN_TERMS,
  horizontalOverflow,
  openHome,
  startExample,
  visibleTextOutsideQuotes,
} from './helpers'

const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]

test.describe('화면 폭 (375×812부터)', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.width}×${vp.height}에서 첫 화면과 결과에 가로 스크롤이 없다`, async ({ page }) => {
      await page.setViewportSize(vp)
      await openHome(page)
      expect(await horizontalOverflow(page)).toMatchObject({ offenders: [] })
      await page.getByRole('button', { name: '논문 예시로 60초 검토' }).click()
      await page.getByRole('button', { name: '공격 기준으로 뒤집기' }).click()
      await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)))
      const r = await horizontalOverflow(page)
      expect(r.offenders).toEqual([])
      expect(r.page).toBeLessThanOrEqual(r.vw)
    })
  }
})

test.describe('키보드만으로 (BRB-C05)', () => {
  test('예시 실행 → 뒤집기 → 질문 복사까지 마우스 없이 끝난다', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await openHome(page)

    const tabTo = async (name: string) => {
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press('Tab')
        const text = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')
        if (text === name) return
      }
      throw new Error(`Tab으로 '${name}'에 닿지 못했다`)
    }

    await tabTo('논문 예시로 60초 검토')
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle)
    expect(outline).not.toBe('none')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { level: 2, name: '3. PoC 검토 작업대' })).toBeFocused()

    await tabTo('공격 기준으로 뒤집기')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: '받은 주장 다시 보기' })).toHaveAttribute('aria-pressed', 'true')

    await tabTo('질문만 복사')
    await page.keyboard.press('Enter')
    await expect(page.getByText(/질문 1개를 복사했습니다/)).toBeVisible()
  })

  test('본문으로 바로 가기 링크가 첫 Tab에 나온다', async ({ page }) => {
    await openHome(page)
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: '본문으로 바로 가기' })).toBeFocused()
  })

  test('검토 파일 입력에 포커스하면 보이는 버튼 전체에 테두리가 생긴다', async ({ page }) => {
    await openHome(page)
    await page.getByLabel('검토 파일 열기').focus()
    const label = page.locator('label[for="case-file"]')
    expect(await label.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid')
  })
})

test.describe('움직임 줄이기', () => {
  test('모션 감소 설정에서는 카드 뒤집기가 즉시 바뀐다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await startExample(page)
    const duration = await page.locator('.flip__inner').evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration))
    expect(duration).toBeLessThan(0.01)
  })
})

test.describe('접근성 자동 검사 (axe, WCAG 2.2 AA)', () => {
  const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

  test('첫 화면', async ({ page }) => {
    await openHome(page)
    const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze()
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
  })

  test('받은 숫자 — 오류가 있는 상태', async ({ page }) => {
    await openHome(page)
    await page.getByRole('button', { name: '내 성능표 검토' }).click()
    await page.getByLabel('지표 1').selectOption('fpr')
    await page.getByLabel('값 (0부터 1 사이)').fill('abc')
    await page.getByRole('button', { name: '혼동행렬로 입력' }).click()
    await page.getByLabel(/\(TN\)/).fill('-3')
    const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze()
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
  })

  test('평가 조건', async ({ page }) => {
    await openHome(page)
    await page.getByRole('button', { name: '내 성능표 검토' }).click()
    await page.getByRole('button', { name: '다음: 평가 조건' }).click()
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)))
    const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze()
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
  })

  test('결과 — 모든 근거를 펼친 상태', async ({ page }) => {
    await startExample(page)
    await page.getByRole('button', { name: '공격 기준으로 뒤집기' }).click()
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)))
    const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze()
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
  })
})

test.describe('보안과 개인정보', () => {
  test('정적 자산 말고는 어디에도 요청하지 않는다', async ({ page, baseURL, outsideRequests }) => {
    const requests = collectRequests(page)
    const errors = collectErrors(page)
    await startExample(page)
    await page.getByRole('button', { name: '공격 기준으로 뒤집기' }).click()
    await page.getByRole('button', { name: '입력 수정' }).click()
    await page.getByLabel(/\(TP\)/).fill('999')
    await page.getByRole('button', { name: /PoC 검토표/ }).click()
    const origin = new URL(baseURL as string).origin
    expect(outsideRequests).toEqual([])
    const nonStatic = requests.filter((u) => u.startsWith(origin) && !/\/explainsoc\/(assets\/[\w.-]+\.(js|css)|favicon\.svg)?$/.test(u))
    expect(nonStatic).toEqual([])
    expect(errors).toEqual([])
  })

  test('배포본에 콘텐츠 보안 정책이 걸려 있고 요청을 막는다', async ({ page }) => {
    await openHome(page)
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')
    expect(csp).toContain("connect-src 'none'")
    expect(csp).toContain("default-src 'none'")
    const blocked = await page.evaluate(async () => {
      try {
        await fetch('https://example.com/')
        return false
      } catch {
        return true
      }
    })
    expect(blocked).toBe(true)
  })

  test('화면에 금지 표현이 없다 — 논문 원문 인용만 예외', async ({ page }) => {
    await startExample(page)
    const texts = [await visibleTextOutsideQuotes(page)]
    await page.getByRole('button', { name: '입력 수정' }).click()
    texts.push(await visibleTextOutsideQuotes(page))
    await page.getByRole('button', { name: '다음: 평가 조건' }).click()
    texts.push(await visibleTextOutsideQuotes(page))
    for (const text of texts) {
      for (const term of FORBIDDEN_TERMS) expect(text, term).not.toContain(term)
    }
  })
})
