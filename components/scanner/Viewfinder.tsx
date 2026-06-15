'use client'
import { RefObject } from 'react'
import { Camera } from 'lucide-react'

interface ViewfinderProps {
  videoRef: RefObject<HTMLVideoElement | null>
  onCapture: () => void
}

export function Viewfinder({ videoRef, onCapture }: ViewfinderProps) {
  return (
    <div className="relative w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-6">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      <div className="relative flex flex-col items-center gap-3 pointer-events-none">
        <p className="text-white/70 text-sm font-medium">
          Scanne le code de la carte
        </p>
        <p className="text-white/40 text-xs -mt-2">
          ex : OP01-001, ST01-002
        </p>

        <div className="relative w-64 h-20">
          <div className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-indigo-500 rounded-tl-md" />
          <div className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-indigo-500 rounded-tr-md" />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-indigo-500 rounded-bl-md" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-indigo-500 rounded-br-md" />
        </div>
      </div>

      <button
        onClick={onCapture}
        className="relative z-10 w-14 h-14 rounded-full bg-indigo-500 border-2 border-white/30 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        aria-label="Capturer"
      >
        <Camera size={22} strokeWidth={2} className="text-white" />
      </button>
    </div>
  )
}
