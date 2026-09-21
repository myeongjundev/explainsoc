// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { EVIDENCE } from '../../src/data/paperEvidence'

/** 화면 문자열에 들어가면 안 되는 표현 (설계 17-1, 인계 문서 5절) */
const FORBIDDEN = ['시간 분할', '미래 성능', '확인됨']

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.(tsx?|css|html)$/.test(name) ? [path] : []
  })
}

const QUOTES = Object.values(EVIDENCE).flatMap((e) => [...e.quotes])

describe('금지 표현', () => {
  it('논문 원문 인용을 뺀 소스 어디에도 없다', () => {
    const files = [...sourceFiles('src'), 'index.html']
    const hits: string[] = []
    for (const file of files) {
      let text = readFileSync(file, 'utf8')
      // 원문은 고칠 수 없으므로 인용 문자열만 지운 뒤 검사한다
      for (const q of QUOTES) text = text.split(q).join('')
      for (const term of FORBIDDEN) if (text.includes(term)) hits.push(`${file}: ${term}`)
    }
    expect(hits).toEqual([])
  })

  it('금지 표현이 든 원문 인용은 그것을 부정하는 문장이다', () => {
    const quoted = QUOTES.filter((q) => FORBIDDEN.some((t) => q.includes(t)))
    expect(quoted).toHaveLength(1) // P01 두 번째 문장
    for (const q of quoted) expect(q).toMatch(/이 아니라/)
  })

  it('상태 이름은 입력한 근거 · 확인 필요 · 해석 주의 셋뿐이다', () => {
    const badge = readFileSync('src/components/StatusBadge.tsx', 'utf8')
    for (const name of ['입력한 근거', '확인 필요', '해석 주의']) expect(badge).toContain(name)
  })
})
