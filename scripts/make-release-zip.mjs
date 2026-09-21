#!/usr/bin/env node
/**
 * 제출용 실행 묶음(ZIP)을 만든다 (설계 16절, BRB-C08·C09·C22).
 *
 * - 커밋된 내용만 담는다(git archive). 작업 폴더의 설치물·빌드·로그·환경 파일은 들어갈 길이 없다.
 * - 아래 허용 목록만 담는다. 과제 기록(planning, evidence)과 CI 설정은 저장소에만 둔다.
 * - 줄 끝을 저장소 그대로(LF) 두고 파일 시각을 커밋 시각으로 고정하므로, 같은 커밋에서 다시 만들면
 *   같은 파일이 나온다.
 *
 * 사용: npm run release:zip            (HEAD)
 *       npm run release:zip -- <커밋>
 */

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, statSync } from 'node:fs'

/** 소스·설정, lockfile, README(실행 방법), 라이선스, 예시 데이터(src/data), 테스트 */
const INCLUDE = [
  'README.md',
  'LICENSE',
  'package.json',
  'package-lock.json',
  '.gitignore',
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'playwright.config.ts',
  'public',
  'src',
  'tests',
  'scripts',
]

/** 허용 목록 안이라도 이런 경로가 끼면 멈춘다 */
const FORBIDDEN = /(^|\/)(node_modules|dist|\.git|\.env(\.[^/]*)?|[^/]+\.log)(\/|$)/

const git = (args) => execFileSync('git', ['-c', 'core.autocrlf=false', ...args], { encoding: 'utf8' }).trim()

const commit = git(['rev-parse', '--short=7', `${process.argv[2] ?? 'HEAD'}^{commit}`])
const name = `explainsoc-${commit}`
const out = `release/${name}.zip`

const files = git(['ls-tree', '-r', '--name-only', commit, '--', ...INCLUDE]).split('\n')
const blocked = files.filter((f) => FORBIDDEN.test(f))
if (blocked.length) {
  console.error(`묶으면 안 되는 파일이 있다:\n${blocked.join('\n')}`)
  process.exit(1)
}

mkdirSync('release', { recursive: true })
git(['archive', '--format=zip', `--prefix=${name}/`, '-o', out, commit, '--', ...INCLUDE])

const sha256 = createHash('sha256').update(readFileSync(out)).digest('hex')
const byTop = Object.entries(
  files.reduce((acc, f) => {
    const top = f.includes('/') ? `${f.split('/')[0]}/` : f
    acc[top] = (acc[top] ?? 0) + 1
    return acc
  }, {}),
)

console.log(`묶음     ${out}`)
console.log(`커밋     ${git(['rev-parse', commit])}`)
console.log(`크기     ${statSync(out).size.toLocaleString('en-US')} bytes`)
console.log(`파일     ${files.length}개 — ${byTop.map(([k, n]) => (n > 1 ? `${k} ${n}` : k)).join(', ')}`)
console.log(`SHA-256  ${sha256}`)
