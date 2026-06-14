'use client'
import { useState } from 'react'
import { Viewfinder } from '@/components/scanner/Viewfinder'
import { CardConfirmModal } from '@/components/scanner/CardConfirmModal'
import { useScanner } from '@/hooks/useScanner'

export default function ScanPage() {
  const { processImage, scanResult, scanning, error, reset } = useScanner()

  const handleCapture = async (imageData: string) => {
    await processImage(imageData)
  }

  return (
    <div className="fixed inset-0">
      <Viewfinder onCapture={handleCapture} />

      {scanResult && (
        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-mono">
            {scanResult.cardNumber}
            {scanResult.confidence < 0.7 && ' (faible confiance)'}
          </span>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white p-3 rounded-xl text-sm text-center">
          {error}
          <button onClick={reset} className="ml-2 underline">Réessayer</button>
        </div>
      )}

      {scanning && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white px-6 py-4 rounded-xl">Analyse en cours...</div>
        </div>
      )}

      {scanResult && (
        <CardConfirmModal cardNumber={scanResult.cardNumber} onClose={reset} />
      )}
    </div>
  )
}
