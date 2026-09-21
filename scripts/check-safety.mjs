#!/usr/bin/env node
/**
 * 개인정보·비밀값·외부 요청·위험한 DOM API 검사 (설계 14·17-4절, BRB-C06·C07·C12).
 * 하나라도 걸리면 실패한다. `npm run check`, CI, 릴리스 전에 돈다.
 *
 * 검사 대상은 Git이 추적하거나 추적할 파일이다(.gitignore가 막은 node_modules·dist 등은 뺀다).
 * 실행 묶음(ZIP)처럼 Git 기록이 없는 폴더에서는 폴더를 직접 훑는다.
 * 빌드가 있으면 배포본(dist)도 따로 본다.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'

const TEXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.css', '.html', '.md', '.svg', '.yml', '.yaml', '.txt', ''])

/** 설치물·빌드·테스트 산출물. 어느 방식으로 파일을 모으든 뺀다. */
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.vite', 'test-results', 'playwright-report', 'blob-report', 'release'])

function gitFiles() {
  const run = (args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\0').filter(Boolean)
  return [...run(['ls-files', '-z']), ...run(['ls-files', '-z', '--others', '--exclude-standard'])]
}

function walkFiles(dir = '.') {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = dir === '.' ? e.name : `${dir}/${e.name}`
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walkFiles(p)
    return e.isFile() ? [p] : []
  })
}

let listedBy = 'Git 파일 목록'
let listed
try {
  listed = gitFiles()
} catch {
  listedBy = '폴더 탐색(Git 저장소가 아님)'
  listed = walkFiles()
}
const files = [...new Set(listed)].filter(
  (f) => !f.split('/').some((seg) => SKIP_DIRS.has(seg)) && existsSync(f) && statSync(f).isFile(),
)
const textFiles = files.filter((f) => TEXT.has(extname(f).toLowerCase()))
const sourceFiles = textFiles.filter((f) => f.startsWith('src/') || f === 'index.html')

/** 공개 링크로 허용하는 주소. 화면에서 새 탭으로 여는 링크일 뿐 앱이 요청하지 않는다. */
const ALLOWED_LINK = /^https:\/\/github\.com\/myeongjundev\/(explainsoc-research|explainsoc)(\/|$)/

const checks = []
const check = (name, findings) => checks.push({ name, findings })
const lines = (file) => readFileSync(file, 'utf8').split(/\r?\n/)

function scan(fileList, patterns, { skip } = {}) {
  const found = []
  for (const file of fileList) {
    lines(file).forEach((line, i) => {
      for (const [label, re] of patterns) {
        const m = line.match(re)
        if (m && !(skip && skip(m[0], file, line))) found.push(`${file}:${i + 1} ${label} — ${m[0].slice(0, 60)}`)
      }
    })
  }
  return found
}

// 1. 비밀값 — 모든 텍스트 파일
check(
  '비밀값 문자열',
  scan(textFiles, [
    ['AWS 액세스 키', /AKIA[0-9A-Z]{16}/],
    ['API 키(sk-)', /\bsk-(ant-)?[A-Za-z0-9_-]{20,}/],
    ['GitHub 토큰', /\bgh[pousr]_[A-Za-z0-9]{30,}/],
    ['Slack 토큰', /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
    ['Google API 키', /\bAIza[0-9A-Za-z_-]{35}\b/],
    ['개인 키', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
    ['비밀값 대입', /\b(api[_-]?key|secret|token|password|passwd)\b\s*[:=]\s*['"][^'"\s]{8,}['"]/i],
  ]),
)

// 2. 개인정보 후보 — 모든 텍스트 파일 (lockfile 무결성 해시는 경계 조건으로 걸러진다)
check(
  '개인정보 후보',
  scan(textFiles, [
    ['이메일', /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/],
    ['휴대전화 번호', /(?<![\w.])01[016789]-?\d{3,4}-?\d{4}(?![\w.])/],
    ['주민등록번호', /(?<![\w.])\d{6}-[1-4]\d{6}(?![\w.])/],
    ['IPv4 주소', /(?<![\w.])(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)(?![\w.])/],
  ], {
    // 개발 서버 주소와 버전 문자열은 개인정보가 아니다
    skip: (hit) => hit === '127.0.0.1' || hit === '0.0.0.0',
  }),
)

// 3. 작업자 PC의 사용자 폴더 경로 — 모든 텍스트 파일 (경로에 사용자 이름이 드러난다)
check(
  '사용자 폴더 경로',
  scan(textFiles, [
    ['Windows 사용자 폴더', /\b[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s'"`]+/i],
    ['macOS·Linux 홈 폴더', /(?<![\w.])\/(Users|home)\/[A-Za-z0-9._-]+\//],
  ]),
)

// 4. 위험한 DOM API — 앱 소스
check(
  'HTML 삽입·동적 코드 실행',
  scan(sourceFiles, [
    ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML/],
    ['innerHTML 대입', /\.(inner|outer)HTML\s*=/],
    ['insertAdjacentHTML', /insertAdjacentHTML/],
    ['document.write', /document\.write\s*\(/],
    ['eval', /\beval\s*\(/],
    ['new Function', /new\s+Function\s*\(/],
  ]),
)

// 5. 입력을 남기는 저장소 — 앱 소스
check(
  '브라우저 저장소',
  scan(sourceFiles, [
    ['localStorage', /\blocalStorage\b/],
    ['sessionStorage', /\bsessionStorage\b/],
    ['document.cookie', /document\.cookie/],
    ['indexedDB', /\bindexedDB\b/],
  ]),
)

// 6. 밖으로 보내는 요청 — 앱 소스
check(
  '네트워크 요청 API',
  scan(sourceFiles, [
    ['fetch', /\bfetch\s*\(/],
    ['XMLHttpRequest', /XMLHttpRequest/],
    ['WebSocket', /\bWebSocket\b/],
    ['EventSource', /\bEventSource\b/],
    ['sendBeacon', /sendBeacon/],
  ]),
)

// 7. 외부 주소 — 앱 소스는 허용한 공개 링크만
check(
  '외부 주소 (앱 소스)',
  scan(sourceFiles, [['외부 주소', /https?:\/\/[^\s'"`)<>]+/]], {
    skip: (hit) => ALLOWED_LINK.test(hit) || hit.startsWith('http://www.w3.org/'),
  }),
)

// 8. 환경 파일
check(
  '환경 파일 (.env)',
  files.filter((f) => /(^|\/)\.env($|\.)/.test(f) && !f.endsWith('.env.example')).map((f) => `${f} — .env는 올리지도 묶지도 않는다`),
)

// 9. 배포본 — 빌드가 있을 때만. 요청이 아니라 글자로만 들어 있는 주소는 따로 허용한다.
if (existsSync('dist')) {
  const distFiles = []
  const walk = (dir) =>
    readdirSync(dir).forEach((n) => {
      const p = join(dir, n)
      statSync(p).isDirectory() ? walk(p) : distFiles.push(p.replaceAll('\\', '/'))
    })
  walk('dist')
  const allowedInBuild = (hit) =>
    ALLOWED_LINK.test(hit) ||
    hit.startsWith('http://www.w3.org/') || // SVG·XML 이름공간, 요청하지 않는다
    hit.startsWith('https://react.dev/errors/') // React 오류 메시지의 설명 링크, 요청하지 않는다
  check(
    '외부 주소 (배포본)',
    scan(distFiles.filter((f) => /\.(html|js|css)$/.test(f)), [['외부 주소', /https?:\/\/[^\s'"`)<>\\]+/]], {
      skip: allowedInBuild,
    }),
  )
  check(
    '외부 글꼴·CDN (배포본)',
    scan(distFiles.filter((f) => /\.(html|css)$/.test(f)), [
      ['외부 글꼴', /fonts\.(googleapis|gstatic)\.com/],
      ['CDN', /(cdn\.jsdelivr|unpkg\.com|cdnjs\.cloudflare)/],
    ]),
  )
  const html = readFileSync('dist/index.html', 'utf8')
  check('콘텐츠 보안 정책 (배포본)', html.includes("connect-src 'none'") ? [] : ['dist/index.html에 connect-src \'none\' 정책이 없다'])
}

let failed = 0
for (const c of checks) {
  if (c.findings.length === 0) {
    console.log(`PASS  ${c.name}`)
  } else {
    failed++
    console.log(`FAIL  ${c.name}`)
    for (const f of c.findings) console.log(`      ${f}`)
  }
}
console.log(`\n파일 목록: ${listedBy}`)
console.log(`검사한 파일 ${textFiles.length}개 · 앱 소스 ${sourceFiles.length}개 · 검사 ${checks.length}개 · 실패 ${failed}개`)
process.exit(failed ? 1 : 0)
