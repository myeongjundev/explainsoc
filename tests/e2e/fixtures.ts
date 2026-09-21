import { test as base, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, sep } from 'node:path'

const DIST = join(process.cwd(), 'dist')

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
}

/**
 * 앱 요청을 빌드 결과물(dist)에서 바로 돌려준다.
 *
 * 왜: 브라우저와 서버 사이에서 페이지에 스크립트를 끼워 넣는 프로그램이 깔린 PC가 있다
 * (이 저장소를 만든 PC에서 실제로 확인했다). 그러면 앱이 보내지도 않은 요청과 오류가 테스트에
 * 섞인다. 네트워크를 거치지 않으면 앱이 실제로 한 일만 남는다. 앱 밖으로 나가는 요청은 막고
 * 목록에 남겨, "정적 자산 말고는 요청하지 않는다"를 그대로 검사한다.
 */
export const test = base.extend<{ outsideRequests: string[] }>({
  outsideRequests: async ({}, use) => {
    await use([])
  },
  page: async ({ page, baseURL, outsideRequests }, use) => {
    const app = new URL(baseURL as string)
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url())
      if (url.origin !== app.origin || !url.pathname.startsWith(app.pathname)) {
        outsideRequests.push(url.href)
        return route.abort('blockedbyclient')
      }
      let rel = url.pathname.slice(app.pathname.length) || 'index.html'
      if (rel.endsWith('/')) rel += 'index.html'
      const file = normalize(join(DIST, rel))
      if (!file.startsWith(DIST + sep)) return route.fulfill({ status: 403, body: '' })
      try {
        const body = await readFile(file)
        return route.fulfill({ status: 200, body, contentType: TYPES[extname(file)] ?? 'application/octet-stream' })
      } catch {
        return route.fulfill({ status: 404, body: 'not found' })
      }
    })
    await use(page)
  },
})

export { expect }
