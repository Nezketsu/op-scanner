'use client'
import { RefObject } from 'react'

interface ViewfinderProps {
  videoRef: RefObject<HTMLVideoElement | null>
  onCapture: () => void
}

export function Viewfinder({ videoRef, onCapture }: ViewfinderProps) {
  return (
    <div className="relative w-full h-full bg-black">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

      {/* Overlay sombre sur les 80% du haut */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-[78%] bg-black/30" />
      </div>

      {/* Zone de scan : les 18% du bas, là où l'OCR coupe */}
      <div className="absolute inset-x-4 bottom-20 pointer-events-none" style={{ height: '18%' }}>
        <div className="w-full h-full border-2 border-white/80 rounded-xl" />
        {/* Coins d'angle pour mieux visualiser la zone */}
        <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-white rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-white rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-white rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-white rounded-br-lg" />
        <p className="absolute -top-6 left-0 right-0 text-center text-white text-xs font-medium">
          Aligner le numéro ici (ex : OP01-001)
        </p>
      </div>

      {/* Bouton capture */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center">
        <button
          onClick={onCapture}
          className="w-14 h-14 rounded-full bg-white border-4 border-gray-300 shadow-lg active:scale-95 transition-transform"
          aria-label="Capturer"
        />
      </div>
    </div>
  )
}
