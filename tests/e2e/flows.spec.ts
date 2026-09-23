import { expect, test } from './fixtures'
import { collectErrors, openChapter, openOwnForm, openHome, questionItems, startExample } from './helpers'

test.describe('논문 예시 60초 경로 (BRB-C02·C05)', () => {
  test('첫 화면에서 질문 복사까지 — 서명 장면이 모두 나온다', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const errors = collectErrors(page)
    const started = Date.now()

    await openHome(page)
    await expect(page.locator('.claim-autopsy')).toContainText('99.88%')
    await expect(page.locator('.claim-autopsy')).toContainText('220,788건 중 160건 탐지')
    await expect(page.locator('.hero__help')).toContainText('광고 숫자가 실제로 무엇을 시험한 결과인지 확인')
    await expect(page.locator('.hero__scenario')).toContainText('처음 보는 공격도 잡는지 알 수 없을 때')
    await expect(page.locator('.hero__story strong')).toHaveText(['받은 소개서 문장이나 숫자를 넣고', '모르는 시험 조건에 답하면', '업체에 물을 질문이 완성됩니다'])
    await page.getByRole('button', { name: '논문 예시로 60초 검토' }).click()
    await expect(page.getByRole('heading', { level: 2, name: '3. 검토 결과' })).toBeFocused()

    const briefing = page.locator('.investigation-brief')
    await expect(briefing).toContainText('1개의 해석 주의를 먼저 읽어야 합니다')
    await expect(briefing).toContainText('같은 시험에서 공격 Recall은 얼마입니까?')

    // V7 수사 보드: 세 장을 한 번에 쌓지 않고 한 장씩 읽는다
    await expect(page.locator('.board-column.is-active .board-column__head h3')).toHaveText('주장과 근거')
    await expect(page.locator('.result__findings')).toBeHidden()
    await expect(page.locator('.chapter-pager__where')).toHaveText('1 / 3 · 주장과 근거')
    await expect(page.locator('.evidence-status__item')).toHaveCount(6)
    await expect(page.locator('.evidence-status__note')).toContainText('완성도 점수가 아닙니다')
    await expect(page.locator('.dossier__cover')).toContainText('다음 회의에서 확인할 것')
    await expect(page.locator('.dossier__metrics')).toContainText('다음 질문')

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

    // 공격 개수의 크기를 길이로 본다 — 탐지 160건은 막대에서 거의 보이지 않는다
    const scale = page.locator('.scale-figure')
    await expect(scale).toContainText('공격 220,788건')
    await expect(scale).toContainText('탐지 160건 · 0.072%')
    await expect(scale).toContainText('막대에서 거의 보이지 않는 값이 있습니다')

    // 40~50초: 세 상태
    await openChapter(page, '판독')
    for (const label of ['확인 필요', '해석 주의', '입력한 근거']) {
      await expect(page.locator('.group__title', { hasText: label })).toBeVisible()
    }

    // 50~60초: 질문과 복사
    await openChapter(page, '다음 행동')
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

    // 행동 1 — 받은 숫자 하나. 처음 입력은 한 화면에 질문 하나씩 묻는다.
    await page.getByLabel('지표 1').selectOption('accuracy')
    await page.getByLabel('값 (0부터 1 사이)').fill('0.99')
    await page.getByRole('button', { name: '다음', exact: true }).click()
    await page.getByRole('button', { name: '건너뛰고 다음' }).click()
    await page.getByRole('button', { name: '건너뛰고 다음' }).click()

    // 행동 2 — 예 / 아니오 / 모름을 키보드로 고른다
    const split = page.getByRole('group', { name: '시험 자료는 어떻게 나눴나요?' })
    await split.getByLabel('무작위').focus()
    await page.keyboard.press('Space')
    await expect(split.getByLabel('무작위')).toBeChecked()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect(split.getByLabel('모름')).toBeChecked()
    await page.getByRole('button', { name: '다음', exact: true }).click()
    await page.getByRole('group', { name: /학습 때 없던 공격/ }).getByLabel('모름').check()
    await page.getByRole('button', { name: '다음', exact: true }).click()
    await page.getByRole('group', { name: /중복된 기록과/ }).getByLabel('아니오').check()
    await page.getByRole('button', { name: '결과 보기' }).click()

    // 행동 3 — 말하는 것과 말하지 않는 것, 질문 복사
    await openChapter(page, '판독')
    await expect(page.locator('.finding__id')).toHaveText(['R02', 'R09', 'R03', 'R06'])
    await openChapter(page, '다음 행동')
    await expect(questionItems(page)).toHaveCount(4)
    await page.getByRole('button', { name: '질문만 복사' }).click()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied.split('\n')).toHaveLength(4)
    expect(copied).not.toContain('0.99')
  })

  test('모든 조건을 모름으로 두어도 질문이 나온다', async ({ page }) => {
    await openHome(page)
    await page.getByRole('button', { name: '내 성능표 검토' }).click()
    await page.getByRole('button', { name: /검토 결과/ }).click()
    await openChapter(page, '판독')
    await expect(page.locator('.finding__id')).toHaveText(['R02', 'R07', 'R09'])
    await openChapter(page, '다음 행동')
    await expect(questionItems(page)).toHaveCount(3)
  })

  test('예시 B는 높은 무작위 분할 점수에서 R01·R08·R10을 보인다', async ({ page }) => {
    await openHome(page)
    await page.getByRole('button', { name: '내 성능표 검토' }).click()
    await page.getByRole('button', { name: /예시 B로 채우기/ }).click()
    await page.getByRole('button', { name: /검토 결과/ }).click()
    await expect(page.locator('.finding__id')).toHaveText(['R01', 'R08', 'R10'])
    await expect(page.locator('.flip__face--front')).toContainText('정확도 0.9988')
  })
})

test.describe('PoC 검토 작업대 V2', () => {
  test('주장 지표와 혼동행렬이 다르면 R11로 같은 시험인지 묻는다', async ({ page }) => {
    await openHome(page)
    await openOwnForm(page)
    await page.getByLabel('지표 1').selectOption('accuracy')
    await page.getByLabel('값 (0부터 1 사이)').fill('0.99')
    await page.getByRole('button', { name: '혼동행렬로 입력' }).click()
    for (const [label, value] of [
      [/정상→정상/, '90'], [/정상→공격/, '5'], [/공격→정상/, '3'], [/공격→공격/, '2'],
    ] as const) await page.getByLabel(label).fill(value)
    await page.getByRole('button', { name: /검토 결과/ }).click()

    await openChapter(page, '판독')
    await expect(page.locator('.finding', { hasText: 'R11' })).toBeVisible()
    await openChapter(page, '다음 행동')
    await expect(page.locator('.question-card__text', { hasText: '이 성능 지표와 혼동행렬은 같은 시험 결과입니까?' })).toBeVisible()
  })

  test('미팅 상태·메모를 포함한 검토표를 복사한다', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await startExample(page)
    await openChapter(page, '다음 행동')
    await page.getByLabel('답변 상태').selectOption('requested')
    await page.getByLabel('답변 메모').fill('공격 유형별 표를 추가로 요청')
    await page.getByRole('button', { name: '검토표 전체 복사' }).click()

    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toContain('상태: 자료 요청')
    expect(copied).toContain('메모: 공격 유형별 표를 추가로 요청')
    await expect(page.getByText(/PoC 검토표 전체를 복사했습니다/)).toBeVisible()
  })
})

test.describe('회차별 로컬 PoC 사례 작업대 V4', () => {
  test('모바일에서는 근거·판독·다음 행동을 한 장씩 전환한다', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await startExample(page)

    await expect(page.locator('.result__evidence')).toBeVisible()
    await expect(page.locator('.result__findings')).toBeHidden()
    await expect(page.locator('.result__output')).toBeHidden()

    await openChapter(page, '판독')
    await expect(page.locator('.result__evidence')).toBeHidden()
    await expect(page.locator('.result__findings')).toBeVisible()

    await openChapter(page, '다음 행동')
    await expect(page.locator('.result__findings')).toBeHidden()
    await expect(page.locator('.result__output')).toBeVisible()
    await expect(page.getByRole('region', { name: '공급자에게 물을 질문' })).toBeVisible()
  })

  test('공급자 답변으로 해결·추가 규칙을 비교하고 JSON을 다시 연다', async ({ page }) => {
    await startExample(page)
    await expect(page.getByRole('navigation', { name: '결과 목차' })).toBeVisible()
    await openChapter(page, '다음 행동')
    await page.getByLabel('답변 상태').selectOption('requested')
    await page.getByLabel('답변 메모').fill('다음 주 Recall 표를 보내기로 함')
    await page.getByText('회차 기록과 다음 답변 관리').click()
    await page.getByRole('button', { name: '현재 회차 저장 · 다음 답변 추가' }).click()

    await expect(page.getByText(/2회차 · 이번에 새로 받은 자료만 적으세요/)).toBeVisible()
    await expect(page.getByRole('complementary', { name: '이전 회차에서 이어 쓰는 성능 자료' })).toContainText('Accuracy (정확도) 0.6299')

    await page.getByLabel('지표 1').selectOption('attackRecall')
    await page.getByLabel('값 (0부터 1 사이)').fill('0.0007')
    const dedup = page.getByRole('group', { name: '중복된 기록과 학습·시험에 함께 들어간 기록을 지웠나요?' })
    await expect(dedup).toContainText('이전 값: 예')
    await dedup.getByLabel('모름').check()
    await expect(dedup).toContainText('이전 값을 ‘예’에서 ‘모름’으로 바꿉니다')
    await page.getByRole('button', { name: /검토 결과/ }).click()

    const diff = page.locator('.round-diff')
    await expect(diff.locator('.round-diff__group--resolved')).toContainText('R04')
    await expect(diff.locator('.round-diff__group--added')).toContainText('R10')
    await expect(diff.locator('.round-diff__group--added')).toContainText('R14')
    await openChapter(page, '판독')
    await expect(page.locator('.finding', { hasText: 'R14' })).toBeVisible()
    await openChapter(page, '다음 행동')
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
    await expect(page.getByRole('heading', { level: 2, name: '3. 검토 결과' })).toBeVisible()
    await expect(page.locator('.rounds__timeline li')).toHaveCount(2)
    await expect(page.getByText(/파일을 열었습니다/)).toBeVisible()
    await page.getByLabel('기존 주장과 같은 시험입니까?').selectOption('no')
    await expect(page.locator('.rounds__branch-label')).toHaveText('별도 시험 분기')
    await expect(page.locator('.rounds__timeline li.is-current')).toHaveClass(/is-no/)
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
    await page.getByRole('button', { name: /검토 결과/ }).click()
    // 잘못 적은 칸이 있다는 사실은 장을 옮기지 않아도 브리핑에서 먼저 보인다
    await expect(page.locator('.investigation-brief__warn')).toContainText('잘못 적은 칸 1개')
    await openChapter(page, '판독')
    await expect(page.getByText('잘못 적은 칸 1개는 계산에서 뺐습니다. 입력 수정에서 고칠 수 있습니다.')).toBeVisible()
    await openChapter(page, '다음 행동')
    await expect(questionItems(page)).toHaveCount(3)
    expect(errors).toEqual([])
  })

  test('혼동행렬의 유효·음수·글자·합 0을 차례로 넣어도 앱이 멈추지 않는다', async ({ page }) => {
    const errors = collectErrors(page)
    await openHome(page)
    await openOwnForm(page)
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

    await page.getByRole('button', { name: /검토 결과/ }).click()
    await expect(page.getByRole('heading', { level: 2, name: '3. 검토 결과' })).toBeVisible()
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

test.describe('소개서 문장으로 검토 (V9)', () => {
  test('붙여 넣은 문장 위에 표시가 붙고, 그 판독이 결과의 질문으로 이어진다', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const errors = collectErrors(page)
    await openHome(page)
    await page.getByRole('button', { name: '소개서 문장으로 검토' }).click()
    await expect(page.getByRole('heading', { level: 2, name: '받은 소개서 문장을 붙여 넣어 주세요' })).toBeFocused()

    await page.getByLabel('받은 소개서·제안서 문장').fill('당사 AI는 정확도 99.8%로 알려지지 않은 신종 공격까지 탐지하며 업계 최고 성능을 입증했습니다.')
    const sheet = page.getByRole('article', { name: '표시를 붙인 소개서' })
    await expect(sheet.locator('mark')).toHaveCount(3)
    const notes = page.getByRole('list', { name: '표시별 판독' }).locator(':scope > li')
    await expect(notes.nth(0)).toContainText('Accuracy (정확도) = 0.998')
    await expect(notes.nth(1)).toContainText('그렇게 시험했다는 문장은 없습니다')
    await expect(notes.nth(2)).toContainText('다른 분할에서도 같은 모델이 가장 높았습니까?')
    await expect(page.getByRole('region', { name: '소개서에 없어 질문이 된 것' })).toContainText('학습과 시험 자료를 어떤 기준으로 나눴습니까?')

    await page.getByRole('button', { name: /결과 보기 · 질문/ }).click()
    await openChapter(page, '다음 행동')
    await expect(questionItems(page)).toContainText(['다른 분할에서도 같은 모델이 가장 높았습니까?', '공격 Recall과 TN·FP·FN·TP를 제공할 수 있습니까?'])

    // 결과에서 소개서로 돌아가 문장을 고치면 소개서에서 읽은 값만 바뀐다
    await page.getByRole('button', { name: '소개서 다시 보기' }).click()
    await page.getByLabel('받은 소개서·제안서 문장').fill('정확도 99.8%, 무작위 분할로 평가했습니다.')
    await expect(page.getByRole('list', { name: '표시별 판독' })).toContainText('학습에 없던 공격만 따로 둔 시험 결과도 있습니까?')
    expect(errors).toEqual([])
  })

  test('빠진 조건은 한 화면씩 직접 답하고, 소개서에서 읽은 숫자는 그대로 남는다', async ({ page }) => {
    await openHome(page)
    await page.getByRole('button', { name: '소개서 문장으로 검토' }).click()
    await page.getByRole('button', { name: '가상의 예시 소개서 넣기' }).first().click()
    await page.getByRole('button', { name: '빠진 조건 직접 답하기' }).click()
    await expect(page.getByRole('region', { name: '질문 4 / 6' })).toBeVisible()
    await page.getByRole('button', { name: '질문 전체 한 번에 보기' }).click()
    await expect(page.getByLabel('값 (0부터 1 사이)').first()).toHaveValue('0.9988')
    await expect(page.getByRole('group', { name: /시험 자료는 어떻게 나눴나요/ }).getByLabel('무작위')).toBeChecked()
  })
})

