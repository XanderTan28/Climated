import type { CityVisualProfile } from '../types/climate'

interface ProceduralCityProps { profile: CityVisualProfile; isNight: boolean }

// Stable seeded variation keeps a city's geometry unchanged while time and weather move.
function noise(seed: number, index: number) {
  const value = Math.sin(seed * 0.0001 + index * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

export function ProceduralCity({ profile, isNight }: ProceduralCityProps) {
  const tower = profile.archetype === 'high-rise-core'
  const suburban = profile.archetype === 'suburban'
  const terrace = profile.archetype === 'dense-low-rise'
  const unknown = profile.archetype === 'unclassified'
  const count = unknown ? 10 : profile.buildingCount
  const slot = 1000 / count
  const baseline = 398
  const measuredHeight = Math.min(1.1, Math.max(.9, (profile.urbanMetrics?.p75Levels ?? 4) / (tower ? 18 : 4)))

  const buildings = Array.from({ length: count }, (_, index) => {
    const heightNoise = noise(profile.seed, index)
    const widthNoise = noise(profile.seed, index + 80)
    const rawHeight = tower
      ? 110 + heightNoise * 105
      : terrace
        ? 190 + heightNoise * 36
        : suburban
          ? 164 + heightNoise * 38
          : 142 + heightNoise * 70
    const widthFactor = tower
      ? .62 + widthNoise * .14
      : terrace
        ? 1.04
        : suburban
          ? .52 + widthNoise * .13
          : .7 + widthNoise * .16
    const width = slot * widthFactor
    const height = Math.min(tower ? 340 : 228, rawHeight * profile.heightScale * measuredHeight)
    return {
      x: index * slot + (slot - width) / 2,
      y: baseline - height,
      width,
      height,
      roof: profile.roofMix[index % profile.roofMix.length],
      color: profile.palette[index % profile.palette.length],
    }
  })

  const treeCount = Math.max(suburban ? 8 : 3, Math.round(profile.greenery * (suburban ? 17 : 10)))

  return (
    <svg className={`city-art archetype-${profile.archetype}`} viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
      <g className="city-distant">
        {buildings.map((building, index) => {
          const height = building.height * (tower ? .52 : .38) + 18
          return <rect key={index} x={building.x + slot * .16} y={baseline - height} width={Math.max(18, building.width * .72)} height={height} />
        })}
      </g>

      <path className="city-ground-back" d="M0 386 Q250 374 500 388 T1000 383 V560 H0Z" />

      <g className="city-buildings">
        {buildings.map((building, index) => {
          const rows = Math.max(2, Math.min(tower ? 10 : 6, Math.floor(building.height / (tower ? 25 : 29))))
          const columns = tower ? 3 : suburban || terrace ? 2 : 3
          const xStep = building.width / (columns + 1)
          const yStep = (building.height - 30) / rows
          return <g key={index}>
            <rect x={building.x} y={building.y} width={building.width} height={building.height} fill={building.color} />
            <rect className="building-side" x={building.x + building.width * .78} y={building.y} width={building.width * .22} height={building.height} />
            {building.roof === 'pitched'
              ? <path className="building-roof" d={`M${building.x - 2} ${building.y + 1} L${building.x + building.width / 2} ${building.y - (suburban ? 25 : 16)} L${building.x + building.width + 2} ${building.y + 1}Z`} />
              : <rect className="building-roof" x={building.x - 1} y={building.y - (tower ? 5 : 4)} width={building.width + 2} height={tower ? 5 : 4} />}
            {tower && index % 3 !== 0 && <>
              <rect x={building.x + building.width * .22} y={building.y - 14} width={building.width * .56} height="14" fill={building.color} />
              <rect className="building-roof" x={building.x + building.width * .2} y={building.y - 17} width={building.width * .6} height="3" />
            </>}
            {Array.from({ length: rows * columns }, (_, windowIndex) => {
              const column = windowIndex % columns
              const row = Math.floor(windowIndex / columns)
              const lit = isNight && noise(profile.seed, index * 173 + windowIndex) > .6
              const windowWidth = Math.max(4, xStep * (tower ? .3 : .36))
              return <rect
                key={windowIndex}
                className={lit ? 'window-lit' : 'building-window'}
                x={building.x + xStep * (column + 1) - windowWidth / 2}
                y={building.y + 17 + row * yStep}
                width={windowWidth}
                height={tower ? 7 : 9}
                rx="1"
              />
            })}
            {!tower && <rect className="building-door" x={building.x + building.width * .42} y={baseline - 22} width={building.width * .16} height="22" />}
          </g>
        })}
      </g>

      <path className="city-ground" d="M0 397 Q260 389 520 400 T1000 395 V560 H0Z" />
      <path className="city-path" d={suburban ? 'M1040 432 Q720 417 545 472 T170 575' : 'M-40 470 Q360 438 1040 476'} />
      <path className="city-horizon-line" d="M0 405 Q330 397 650 407 T1000 402" />

      <g className="city-trees">
        {Array.from({ length: treeCount }, (_, index) => {
          const x = 30 + noise(profile.seed, index + 700) * 940
          const y = 413 + noise(profile.seed, index + 740) * 20
          const size = (suburban ? 19 : 13) + noise(profile.seed, index + 790) * (suburban ? 15 : 10)
          return <g key={index} transform={`translate(${x} ${y})`}>
            <rect className="tree-trunk" x="-1.5" y={-size * 1.05} width="3" height={size * 1.25} />
            <circle className={index % 2 ? 'tree-crown' : 'tree-crown tree-crown-light'} cy={-size * 1.25} r={size * .7} />
            <circle className={index % 2 ? 'tree-crown' : 'tree-crown tree-crown-light'} cx={size * .28} cy={-size * 1.42} r={size * .52} />
          </g>
        })}
      </g>

      <g className="city-people">
        {[.19, .74].map((fraction, index) => <g key={index} transform={`translate(${fraction * 1000} 424)`}>
          <circle cy="-10" r="2.5" />
          <path d="M0-7V2M0-3l-4 5M0-3l4 4M0 2l-3 7M0 2l3 7" />
        </g>)}
      </g>
    </svg>
  )
}
