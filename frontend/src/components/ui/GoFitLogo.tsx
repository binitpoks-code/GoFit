interface GoFitLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'white' | 'green-o'
}

const sizes = {
  sm:  { width: 80,  height: 45,  gSize: 28, fitSize: 10, strokeW: 3 },
  md:  { width: 120, height: 68,  gSize: 40, fitSize: 14, strokeW: 4 },
  lg:  { width: 200, height: 110, gSize: 64, fitSize: 20, strokeW: 6 },
  xl:  { width: 300, height: 165, gSize: 96, fitSize: 28, strokeW: 8 },
}

function GoFitLogo({ size = 'md', variant = 'green-o' }: GoFitLogoProps) {
  const s = sizes[size]
  const oColor = variant === 'green-o' ? '#10b981' : '#ffffff'

  return (
    <svg
      width={s.width}
      height={s.height}
      viewBox={`0 0 ${s.width} ${s.height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* G letter */}
      <text
        x="4"
        y={s.gSize * 0.85}
        fontFamily="Inter, sans-serif"
        fontWeight="800"
        fontSize={s.gSize}
        fill="#ffffff"
        letterSpacing="-2"
      >
        G
      </text>

      {/* O — incomplete circle ring with gap at top-right */}
      <circle
        cx={s.width * 0.62}
        cy={s.gSize * 0.45}
        r={s.gSize * 0.42}
        stroke={oColor}
        strokeWidth={s.strokeW}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${s.gSize * 2.2} ${s.gSize * 0.4}`}
        strokeDashoffset={s.gSize * 0.2}
        transform={`rotate(-45 ${s.width * 0.62} ${s.gSize * 0.45})`}
      />

      {/* FIT text below */}
      <text
        x={s.width * 0.5}
        y={s.height - 4}
        fontFamily="Inter, sans-serif"
        fontWeight="600"
        fontSize={s.fitSize}
        fill="#ffffff"
        letterSpacing={s.fitSize * 0.6}
        textAnchor="middle"
        opacity="0.9"
      >
        FIT
      </text>
    </svg>
  )
}

export default GoFitLogo
