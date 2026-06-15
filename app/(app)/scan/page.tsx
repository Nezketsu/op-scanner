'use client'
import { useEffect, useState } from 'react'
import { Viewfinder } from '@/components/scanner/Viewfinder'
import { CardConfirmModal } from '@/components/scanner/CardConfirmModal'
import { useScanner } from '@/hooks/useScanner'

export default function ScanPage() {
  const { videoRef, startCamera, stopCamera, captureFrame, processImage, scanResult, scanning, error, reset } = useScanner()
  const [activeCard, setActiveCard] = useState<string | null>(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  const handleCapture = async () => {
    const frame = captureFrame()
    if (frame) await processImage(frame)
  }

  useEffect(() => {
    if (scanResult?.cardNumber) setActiveCard(scanResult.cardNumber)
  }, [scanResult])

  const handleClose = () => {
    reset()
    setActiveCard(null)
  }

  return (
    <div className="fixed inset-0 bg-slate-900">
      <Viewfinder videoRef={videoRef} onCapture={handleCapture} />

      {scanning && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
          <div className="bg-white px-5 py-3 rounded-xl text-sm font-semibold text-slate-700 shadow-lg">
            Analyse en cours...
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-4 right-4 bg-slate-800/90 text-white px-4 py-3 rounded-xl text-sm font-medium">
          Carte non reconnue. Réessaie.
        </div>
      )}

      {activeCard && (
        <CardConfirmModal cardNumber={activeCard} onClose={handleClose} />
      )}
    </div>
  )
}
