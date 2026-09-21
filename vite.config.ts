/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * 배포본에만 콘텐츠 보안 정책을 건다. 개발 서버의 HMR 연결을 막지 않기 위해서다.
 * connect-src를 막아 두면 앱 코드가 어디로도 요청을 보낼 수 없다 — 입력이 브라우저 밖으로
 * 나가지 않는다는 화면 약속을 브라우저가 지켜 준다.
 */
function contentSecurityPolicy(): Plugin {
  const policy = [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
  return {
    name: 'explainsoc-csp',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
      ),
  }
}

export default defineConfig({
  base: '/explainsoc/',
  plugins: [react(), contentSecurityPolicy()],
  build: {
    // 소스 지도는 공개 사이트에 올리지 않는다. 필요한 사람은 저장소 소스를 보면 된다.
    sourcemap: false,
    // 번들은 주석을 지우므로, 묶인 의존성(React 등)의 라이선스 전문을 따로 내보낸다.
    // 점으로 시작하는 폴더(.vite)는 Pages 산출물에서 빠지므로 배포본 맨 위에 둔다.
    license: { fileName: 'third-party-licenses.md' },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/component/**/*.test.tsx'],
    restoreMocks: true,
  },
})
