import { expect, test } from './fixtures'
import { collectErrors, openHome, questionItems, startExample } from './helpers'

test.describe('논문 예시 60초 경로 (BRB-C02·C05)', () => {
  test('첫 화면에서 질문 복사까지 — 서명 장면이 모두 나온다', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const errors = collectErrors(page)
    const started = Date.now()

    await startExample(page)

    // 15~30초: 정확도·FPR 카드가 공격 개수로 뒤집힌다
    await expect(page.locator('.flip__face--front')).toContainText('겉으로는 무난해 보이는 성능 주장')
    await expect(page.locator('.flip__face--front')).toContainText('정확도 0.6299')
    await expect(page.locator('.flip__face--front')).toContainText('오탐률 0.0002')
    await page.getByRole('button', { name: '공격 기준으로 뒤집기' }).click()
    await expect(page.locator('.flip__face--back')).toContainText('공격 220,788건 가운데 탐지 160건')
    await expect(page.locator('.flip__face--back')).toContainText('미탐 220,628건')

    // 항상 정상 기준선과 범위 문장
    await expect(page.locator('.baseline')).toContainText('약 0.6297')
    await expect(page.locator('.baseline')).toContainText('시험 정상 375,518건 ÷ 시험 전량 596,306건')
    await expect(page.getByText('이 비교는 CICIDS2017 미관측 공격 스트레스 테스트의 시험 구성에 한정됩니다.')).toBeVisible()

    // 30~40초: 9종 대 3종
    const split = page.getByRole('region', { name: '논문이 시험한 분할' })
    await expect(split.locator('.split__side').first().getByRole('listitem')).toHaveCount(9)
    await expect(split.locator('.split__side--test').getByRole('listitem')).toHaveCount(3)
    await expect(split).toContainText('공격 유형 겹침 0')

    // 40~50초: 세 상태
    for (const label of ['확인 필요', '해석 주의', '입력한 근거']) {
      await expect(page.locator('.group__title', { hasText: label })).toBeVisible()
    }

    // 50~60초: 질문과 복사
    await expect(questionItems(page)).toHaveText(['같은 시험에서 공격 Recall은 얼마입니까?'])
    await page.getByRole('button', { name: '질문만 복사' }).click()
    await expect(page.getByText('질문 1개를 복사했습니다. 입력한 숫자는 담지 않았습니다.')).toBeVisible()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toBe('1. 같은 시험에서 공격 Recall은 얼마입니까?')

    const elapsed = (Date.now() - started) / 1000
    test.info().annotations.push({ type: '자동 조작 소요(초)', description: elapsed.toFixed(1) })
    expect(errors).toEqual([])
  })
})

test.describe('내 성능표로 세 행동 (BRB-C02)', () => {
  test('숫자 하나 → 세 질문에 답하기 → 질문 복사', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await openHome(page)
    await page.getByRole('button', { name: '내 성능표 검토' }).click()

    // 행동 1 — 받은 숫자 하나
    await page.getByLabel('지표 1').selectOption('accuracy')
    await page.getByLabel('값 (0부터 1 사이)').fill('0.99')
    await page.getByRole('button', { name: '다음: 평가 조건' }).click()

    // 행동 2 — 예 / 아니오 / 모름을 키보드로 고른다
    const split = page.getByRole('group', { name: '1. 시험 자료는 어떻게 나눴습니까?' })
    await split.getByLabel('무작위').focus()
    await page.keyboard.press('Space')
    await expect(split.getByLabel('무작위')).toBeChecked()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect(split.getByLabel('모름')).toBeChecked()
    await page.getByRole('group', { name: /학습 때 없던 공격/ }).getByLabel('모름').check()
    await page.getByRole('group', { name: /같은 행을 제거/ }).getByLabel('아니오').check()
    await page.getByRole('button', { name: '결과 보기' }).click()

    // 행동 3 — 말하는 것과 말하지 않는 것, 질문 복사
    await expect(page.locator('.finding__id')).toHaveText(['R02', 'R09', 'R03', 'R06'])
    await expect(questionItems(page)).toHaveCount(4)
    await page.getByRole('button', { name: '질문만 복사' }).click()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied.split('\n')).toHaveLength(4)
    expect(copied).not.toContain('0.99')
  })

  test('모든 조건을 모름으로 두어도 질문이 나온다', async ({ page }) => {
    await openHome(page)
    await page.getByRole('button', { name: '내 성능표 검토' }).click()
    await page.getByRole('button', { name: /PoC 검토표/ }).click()
    await expect(page.locator('.finding__id')).toHaveText(['R02', 'R07', 'R09'])
    await expect(questionItems(page)).toHaveCount(3)
  })

  test('예시 B는 높은 무작위 분할 점수에서 R01·R08·R10을 보인다', async ({ page }) => {
    await openHome(page)
    await page.getByRole('button', { name: '내 성능표 검토' }).click()
    await page.getByRole('button', { name: /예시 B로 채우기/ }).click()
    await page.getByRole('button', { name: /PoC 검토표/ }).click()
    await expect(page.locator('.finding__id')).toHaveText(['R01', 'R08', 'R10'])
    await expect(page.locator('.flip__face--front')).toContainText('정확도 0.9988')
  })
})

test.describe('PoC 검토 작업대 V2', () => {
  test('주장 지표와 혼동행렬이 다르면 R11로 같은 시험인지 묻는다', async ({ page }) => {
    await openHome(page)
    await page.getByRole('button', { name: '내 성능표 검토' }).click()
    await page.getByLabel('지표 1').selectOption('accuracy')
    await page.getByLabel('값 (0부터 1 사이)').fill('0.99')
    await page.getByRole('button', { name: '혼동행렬로 입력' }).click()
    for (const [label, value] of [
      [/정상→정상/, '90'], [/정상→공격/, '5'], [/공격→정상/, '3'], [/공격→공격/, '2'],
    ] as const) await page.getByLabel(label).fill(value)
    await page.getByRole('button', { name: /PoC 검토표/ }).click()

    await expect(page.locator('.finding', { hasText: 'R11' })).toBeVisible()
    await expect(page.locator('.question-card__text', { hasText: '이 성능 지표와 혼동행렬은 같은 시험 결과입니까?' })).toBeVisible()
  })

  test('미팅 상태·메모를 포함한 검토표를 복사한다', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await startExample(page)
    await page.getByLabel('답변 상태').selectOption('requested')
    await page.getByLabel('답변 메모').fill('공격 유형별 표를 추가로 요청')
    await page.getByRole('button', { name: '검토표 전체 복사' }).click()

    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toContain('상태: 자료 요청')
    expect(copied).toContain('메모: 공격 유형별 표를 추가로 요청')
    await expect(page.getByText(/PoC 검토표 전체를 복사했습니다/)).toBeVisible()
  })
})

test.describe('회차별 로컬 PoC 사례 작업대 V3', () => {
  test('공급자 답변으로 해결·추가 규칙을 비교하고 JSON을 다시 연다', async ({ page }) => {
    await startExample(page)
    await expect(page.getByRole('navigation', { name: 'PoC 작업대 바로 가기' })).toBeVisible()
    await page.getByLabel('답변 상태').selectOption('requested')
    await page.getByLabel('답변 메모').fill('다음 주 Recall 표를 보내기로 함')
    await page.getByRole('button', { name: '현재 회차 저장 · 다음 답변 추가' }).click()

    await expect(page.getByText(/2회차 · 이번에 새로 받은 자료만 적으세요/)).toBeVisible()
    await expect(page.getByRole('complementary', { name: '이전 회차에서 이어 쓰는 성능 자료' })).toContainText('Accuracy (정확도) 0.6299')

    await page.getByLabel('지표 1').selectOption('attackRecall')
    await page.getByLabel('값 (0부터 1 사이)').fill('0.0007')
    await page.getByRole('button', { name: '다음: 평가 조건' }).click()
    const dedup = page.getByRole('group', { name: '3. 중복과 학습·시험 사이의 같은 행을 제거했습니까?' })
    await expect(dedup).toContainText('이전 값: 예')
    await dedup.getByLabel('모름').check()
    await expect(dedup).toContainText('이전 값을 ‘예’에서 ‘모름’으로 바꿉니다')
    await page.getByRole('button', { name: /PoC 검토표/ }).click()

    const diff = page.locator('.round-diff')
    await expect(diff.locator('.round-diff__group--resolved')).toContainText('R04')
    await expect(diff.locator('.round-diff__group--added')).toContainText('R10')
    await expect(diff.locator('.round-diff__group--added')).toContainText('R14')
    await expect(page.locator('.finding', { hasText: 'R14' })).toBeVisible()
    await expect(page.getByLabel('PoC 검토표 미리보기')).toContainText('당시 상태: 자료 요청')
    await expect(page.getByLabel('PoC 검토표 미리보기')).toContainText('당시 메모: 다음 주 Recall 표를 보내기로 함')
    const sameTrial = page.getByLabel('기존 주장과 같은 시험입니까?')
    expect(await sameTrial.evaluate((element) => getComputedStyle(element.parentElement!).gridColumnEnd)).toBe('-1')

    await sameTrial.selectOption('yes')
    await expect(page.locator('.finding', { hasText: 'R14' })).toHaveCount(0)
    await expect(diff.locator('.round-diff__group--added')).not.toContainText('R14')

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: '사례 JSON 내려받기' }).click()
    const download = await downloadPromise
    const path = await download.path()
    expect(path).not.toBeNull()

    const saved = JSON.parse(await (await import('node:fs/promises')).readFile(path!, 'utf8'))
    expect(saved.kind).toBe('explainsoc-case')
    expect(saved.schemaVersion).toBe(1)
    expect(saved.rounds).toHaveLength(2)
    expect(saved.rounds[0].input.claim).toEqual({ accuracy: 0.6299, fpr: 0.0002 })
    expect(saved.rounds[1].input.claim).toEqual({ attackRecall: 0.0007 })

    await page.getByRole('button', { name: '처음부터' }).click()
    await page.getByLabel('검토 파일 열기').setInputFiles(path!)
    await expect(page.getByRole('heading', { level: 2, name: '3. PoC 검토 작업대' })).toBeVisible()
    await expect(page.locator('.rounds__timeline li')).toHaveCount(2)
    await expect(page.getByText(/파일을 열었습니다/)).toBeVisible()
    await page.getByLabel('기존 주장과 같은 시험입니까?').selectOption('no')
    await expect(page.locator('.summary__list')).toContainText('공격 Recall (공격 탐지율)0.0007')
    await expect(page.locator('.summary__list')).not.toContainText('FPR')
    await expect(page.locator('.round-diff')).toContainText('별도 시험 판독')
    await expect(page.locator('.round-diff')).toContainText('이전 판독은 해결된 것으로 보지 않습니다')
    await expect(page.locator('.round-diff')).not.toContainText('해결됨')
  })
})

test.describe('잘못된 입력에도 멈추지 않는다 (BRB-C05)', () => {
  test('비율 칸의 글자·음수·1 초과는 그 칸에만 오류를 보이고 결과는 이어진다', async ({ page }) => {
    const errors = collectErrors(page)
    await openHome(page)
    await page.getByRole('button', { name: '내 성능표 검토' }).click()
    await page.getByLabel('지표 1').selectOption('accuracy')
    const value = page.getByLabel('값 (0부터 1 사이)')
    for (const [raw, message] of [
      ['abc', '0부터 1 사이의 숫자로 적어 주세요'],
      ['-0.2', '비율은 0보다 작을 수 없습니다'],
      ['99', '비율은 0부터 1 사이로 적어 주세요. 99%는 0.99입니다'],
      ['Infinity', 'Infinity나 NaN 대신 0부터 1 사이의 일반 숫자로 적어 주세요'],
    ] as const) {
      await value.fill(raw)
      await expect(page.getByText(message)).toBeVisible()
      await expect(value).toHaveAttribute('aria-invalid', 'true')
    }
    await page.getByRole('button', { name: /PoC 검토표/ }).click()
    await expect(page.getByText('잘못 적은 칸 1개는 계산에서 뺐습니다. 입력 수정에서 고칠 수 있습니다.')).toBeVisible()
    await expect(questionItems(page)).toHaveCount(3)
    expect(errors).toEqual([])
  })

  test('혼동행렬의 유효·음수·글자·합 0을 차례로 넣어도 앱이 멈추지 않는다', async ({ page }) => {
    const errors = collectErrors(page)
    await openHome(page)
    await page.getByRole('button', { name: '내 성능표 검토' }).click()
    await page.getByRole('button', { name: '혼동행렬로 입력' }).click()
    const tn = page.getByLabel(/\(TN\)/)
    const fp = page.getByLabel(/\(FP\)/)
    const fn = page.getByLabel(/\(FN\)/)
    const tp = page.getByLabel(/\(TP\)/)

    await tn.fill('375,432')
    await fp.fill('86')
    await fn.fill('220628')
    await tp.fill('160')
    await expect(page.locator('.matrix__metrics')).toContainText('0.6299')

    await tp.fill('-1')
    await expect(page.getByText('0 이상의 정수로 적어 주세요')).toBeVisible()
    await expect(page.locator('.matrix__metrics')).toHaveCount(0)

    await tp.fill('열')
    await expect(tp).toHaveAttribute('aria-invalid', 'true')

    for (const cell of [tn, fp, fn, tp]) await cell.fill('0')
    await expect(page.getByText('평가한 항목이 없어 지표를 계산할 수 없습니다')).toBeVisible()

    await tn.fill('10')
    await fp.fill('0')
    await expect(page.locator('.matrix__na')).toContainText('공격 Recall: 공격 표본이 없어 계산할 수 없습니다')

    await page.getByRole('button', { name: /PoC 검토표/ }).click()
    await expect(page.getByRole('heading', { level: 2, name: '3. PoC 검토 작업대' })).toBeVisible()
    expect(errors).toEqual([])
  })
})

test.describe('입력은 브라우저 안에만 머문다', () => {
  test('새로 고치면 입력이 사라지고 저장소에도 남지 않는다', async ({ page }) => {
    await startExample(page)
    const stored = await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
      cookie: document.cookie,
      url: location.href,
    }))
    expect(stored).toEqual({ local: 0, session: 0, cookie: '', url: expect.stringMatching(/\/explainsoc\/$/) })
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.getByRole('button', { name: '내 성능표 검토' }).click()
    await expect(page.getByLabel('지표 1')).toHaveValue('')
  })
})
