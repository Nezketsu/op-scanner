interface ProgressBarProps {
  value: number
  className?: string
}

export function ProgressBar({ value, className = '' }: ProgressBarProps) {
  return (
    <div className={`h-2 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-blue-500 rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
