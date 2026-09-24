import AxeBuilder from '@axe-core/playwright'
import { expect, test } from './fixtures'
import {
  collectErrors,
  collectRequests,
  FORBIDDEN_TERMS,
  horizontalOverflow,
  openHome,
  openOwnForm,
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
      await page.getByRole('button', { name: '소개서 문장 붙여 넣기' }).click()
      await page.getByRole('button', { name: '가상의 예시 소개서 넣기' }).first().click()
      expect(await horizontalOverflow(page)).toMatchObject({ offenders: [] })
      await openHome(page)
      await page.getByRole('button', { name: /논문 실험실/ }).click()
      await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)))
      expect(await horizontalOverflow(page)).toMatchObject({ offenders: [] })
      await openHome(page)
      await page.getByRole('button', { name: '예시로 바로 보기' }).click()
      await page.getByRole('button', { name: '공격 기준으로 뒤집기' }).click()
      await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)))
      const r = await horizontalOverflow(page)
      expect(r.offenders).toEqual([])
      expect(r.page).toBeLessThanOrEqual(r.vw)
    })
  }
})

test.describe('첫 화면의 첫 행동 (V10)', () => {
  // 흔한 노트북·휴대폰 화면에서 스크롤 없이 주 단추가 보여야 한다. 1440×900은 지난 증거 화면 크기다.
  for (const viewport of [{ width: 1280, height: 800 }, { width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 375, height: 812 }]) {
    test(`${viewport.width}×${viewport.height}에서 스크롤 없이 '예시로 바로 보기'가 보인다`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await openHome(page)
      const box = await page.getByRole('button', { name: '예시로 바로 보기' }).boundingBox()
      expect(box).not.toBeNull()
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)
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
        // 번호 배지는 aria-hidden이므로 접근 가능한 이름과 같도록 그 글자를 뺀다.
        const text = await page.evaluate(() => { const el = document.activeElement?.cloneNode(true) as Element | undefined; el?.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove()); return el?.textContent?.trim() ?? '' })
        if (text === name) return
      }
      throw new Error(`Tab으로 '${name}'에 닿지 못했다`)
    }

    await tabTo('예시로 바로 보기')
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle)
    expect(outline).not.toBe('none')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { level: 2, name: '3. 검토 결과' })).toBeFocused()

    await tabTo('공격 기준으로 뒤집기')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: '받은 주장 다시 보기' })).toHaveAttribute('aria-pressed', 'true')

    // V7: 다음 행동 장을 키보드로 연 뒤에야 질문 복사가 나온다
    await tabTo('다음 행동')
    await page.keyboard.press('Enter')

    await tabTo('질문만 복사')
    await page.keyboard.press('Enter')
    await expect(page.getByText(/질문 2개를 복사했습니다/)).toBeVisible()
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
    await openOwnForm(page)
    await page.getByLabel('지표 1').selectOption('fpr')
    await page.getByLabel('값 (0부터 1 사이)').fill('abc')
    await page.getByRole('button', { name: '혼동행렬로 입력' }).click()
    await page.getByLabel(/\(TN\)/).fill('-3')
    const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze()
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
  })

  test('한 화면씩 묻는 평가 조건', async ({ page }) => {
    await openHome(page)
    await page.getByRole('button', { name: '숫자로 직접 입력' }).click()
    await page.getByRole('button', { name: /평가 조건/ }).click()
    await page.getByRole('group', { name: '시험 자료는 어떻게 나눴나요?' }).getByLabel('모름').check()
    const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze()
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
  })

  test('한 장짜리 폼의 평가 조건', async ({ page }) => {
    await openHome(page)
    await openOwnForm(page)
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)))
    const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze()
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
  })

  test('소개서 판독 — 예시 소개서를 넣은 상태', async ({ page }) => {
    await openHome(page)
    await page.getByRole('button', { name: '소개서 문장 붙여 넣기' }).click()
    await page.getByRole('button', { name: '가상의 예시 소개서 넣기' }).first().click()
    const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze()
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
  })

  test('논문 실험실 — 근거를 모두 펼친 상태', async ({ page }) => {
    await openHome(page)
    await page.getByRole('button', { name: /논문 실험실/ }).click()
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

test('인쇄에서는 Decision Dossier 앞장과 전체 기록만 보인다', async ({ page }) => {
  await startExample(page)
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.dossier__cover')).toBeVisible()
  await expect(page.locator('.brief__print-preview')).toBeVisible()
  await expect(page.locator('.result__evidence')).toBeHidden()
  await expect(page.getByRole('button', { name: '검토표 전체 복사' })).toBeHidden()
})

test.describe('보안과 개인정보', () => {
  test('정적 자산 말고는 어디에도 요청하지 않는다', async ({ page, baseURL, outsideRequests }) => {
    const requests = collectRequests(page)
    const errors = collectErrors(page)
    await startExample(page)
    await page.getByRole('button', { name: '공격 기준으로 뒤집기' }).click()
    await page.getByRole('button', { name: '입력 수정' }).click()
    await page.getByLabel(/\(TP\)/).fill('999')
    await page.getByRole('button', { name: /검토 결과/ }).click()
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
    await openHome(page)
    await page.getByRole('button', { name: '숫자로 직접 입력' }).click()
    for (let i = 0; i < 6; i++) {
      texts.push(await visibleTextOutsideQuotes(page))
      if (i < 5) await page.getByRole('button', { name: /다음$/ }).click()
    }
    await openHome(page)
    await page.getByRole('button', { name: '소개서 문장 붙여 넣기' }).click()
    await page.getByRole('button', { name: '가상의 예시 소개서 넣기' }).first().click()
    texts.push(await visibleTextOutsideQuotes(page))
    await openHome(page)
    await page.getByRole('button', { name: /논문 실험실/ }).click()
    texts.push(await visibleTextOutsideQuotes(page))
    for (const text of texts) {
      for (const term of FORBIDDEN_TERMS) expect(text, term).not.toContain(term)
    }
  })
})
