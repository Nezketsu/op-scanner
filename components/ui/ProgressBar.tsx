interface ProgressBarProps {
  value: number
  className?: string
  thick?: boolean
}

export function ProgressBar({ value, className = '', thick = false }: ProgressBarProps) {
  const h = thick ? 'h-1.5' : 'h-0.75'
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={`${h} bg-slate-200 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-indigo-500 rounded-full transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
