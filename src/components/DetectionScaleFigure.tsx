import { formatCount } from '../domain/format'
import type { ConfusionMatrix } from '../domain/types'

interface Props {
  matrix: ConfusionMatrix
}

interface Row {
  group: string
  total: number
  part: number
  partLabel: string
  restLabel: string
  tone: 'attack' | 'normal'
}

/** 0.07%처럼 작은 비율은 글자보다 길이로 읽힌다. 축을 자르거나 최소 너비를 주지 않고 실제 비율 그대로 그린다. */
function share(part: number, total: number) {
  if (total <= 0) return null
  const percent = (part / total) * 100
  const digits = percent > 0 && percent < 1 ? 3 : 1
  return { percent, text: `${percent.toFixed(digits)}%` }
}

/**
 * 화면 D 보조 그림 — 이 시험에서 공격과 정상이 각각 몇 건이었고 그 가운데 몇 건이 탐지·오탐이었는지
 * 같은 가로 길이 위에 그린다. 좋고 나쁨을 판정하지 않고 크기만 보여 준다.
 */
export function DetectionScaleFigure({ matrix }: Props) {
  const rows: Row[] = [
    { group: '공격', total: matrix.tp + matrix.fn, part: matrix.tp, partLabel: '탐지', restLabel: '미탐', tone: 'attack' },
    { group: '정상', total: matrix.tn + matrix.fp, part: matrix.fp, partLabel: '오탐', restLabel: '정상으로 판정', tone: 'normal' },
  ]
  const visible = rows.filter((row) => row.total > 0)
  if (visible.length === 0) return null

  const tooSmall = visible.filter((row) => {
    const value = share(row.part, row.total)
    return value !== null && value.percent > 0 && value.percent < 1
  })

  return (
    <figure className="scale-figure">
      <figcaption className="scale-figure__title">이 시험의 크기를 그대로 그리면</figcaption>
      <div className="scale-figure__rows">
        {visible.map((row) => {
          const value = share(row.part, row.total)
          const width = value ? Math.max(0, Math.min(100, value.percent)) : 0
          return (
            <div key={row.group} className={`scale-row scale-row--${row.tone}`}>
              <p className="scale-row__head">
                <span className="scale-row__group">{row.group} {formatCount(row.total)}건</span>
                <span className="scale-row__part">
                  {row.partLabel} {formatCount(row.part)}건{value && <> · {value.text}</>}
                </span>
              </p>
              <svg
                className="scale-row__bar"
                viewBox="0 0 100 8"
                preserveAspectRatio="none"
                role="img"
                aria-label={`${row.group} ${formatCount(row.total)}건 가운데 ${row.partLabel} ${formatCount(row.part)}건${value ? `, ${value.text}` : ''}. ${row.restLabel} ${formatCount(row.total - row.part)}건.`}
              >
                <rect className="scale-row__track" x="0" y="0" width="100" height="8" rx="1.4" />
                {width > 0 && <rect className="scale-row__fill" x="0" y="0" width={width} height="8" rx={width > 2 ? 1.4 : 0} />}
                <line className="scale-row__tick" x1={width} y1="-1" x2={width} y2="9" />
              </svg>
              <p className="scale-row__rest">{row.restLabel} {formatCount(row.total - row.part)}건</p>
            </div>
          )
        })}
      </div>
      {tooSmall.length > 0 && (
        <p className="scale-figure__note">
          막대에서 거의 보이지 않는 값이 있습니다 —{' '}
          {tooSmall.map((row) => `${row.group} ${row.partLabel} ${formatCount(row.part)}건`).join(', ')}. 세로 눈금이 그 위치입니다.
          길이를 키우면 숫자의 크기가 달라 보이므로 실제 비율 그대로 두었습니다.
        </p>
      )}
      <p className="scale-figure__scope">이 그림은 입력한 혼동행렬의 구성만 보여 줍니다. 합격선이나 다른 제품과의 비교가 아닙니다.</p>
    </figure>
  )
}
