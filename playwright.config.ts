import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE = `http://127.0.0.1:${PORT}/explainsoc/`

/** 공개 주소를 같은 테스트로 검사할 때: LIVE_URL=https://myeongjundev.github.io/explainsoc/ */
const LIVE_URL = process.env.LIVE_URL

/**
 * 배포본과 같은 빌드(콘텐츠 보안 정책 포함)를 띄워 검사한다.
 * 로컬에서는 설치된 Chrome을 쓰고, CI에서는 Playwright가 받은 Chromium을 쓴다.
 * 테스트마다 새 브라우저 컨텍스트(쿠키·저장소·로그인 없음)에서 시작한다 — 새 시크릿 창과 같은 조건이다.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: LIVE_URL ?? BASE,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: process.env.CI ? undefined : 'chrome' },
    },
  ],
  webServer: LIVE_URL
    ? undefined
    : {
        command: `npm run build && npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
        url: BASE,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
