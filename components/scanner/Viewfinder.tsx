'use client'
import { useEffect } from 'react'
import { useScanner } from '@/hooks/useScanner'

interface ViewfinderProps {
  onCapture: (imageData: string) => void
}

export function Viewfinder({ onCapture }: ViewfinderProps) {
  const { videoRef, startCamera, stopCamera, captureFrame } = useScanner()

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  const handleCapture = () => {
    const frame = captureFrame()
    if (frame) onCapture(frame)
  }

  return (
    <div className="relative w-full h-full bg-black">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="border-2 border-white rounded-lg w-64 h-40 opacity-60" />
      </div>
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <button
          onClick={handleCapture}
          className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 shadow-lg active:scale-95 transition-transform"
          aria-label="Capturer"
        />
      </div>
    </div>
  )
}
