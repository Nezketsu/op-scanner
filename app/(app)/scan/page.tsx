'use client'
import { useEffect, useState } from 'react'
import { Viewfinder } from '@/components/scanner/Viewfinder'
import { CardConfirmModal } from '@/components/scanner/CardConfirmModal'
import { useScanner } from '@/hooks/useScanner'

const CARD_FORMAT = /^[A-Z]{1,3}\d{1,2}-\d{3}[a-z]?$/i

export default function ScanPage() {
  const { videoRef, startCamera, stopCamera, captureFrame, processImage, scanResult, scanning, error, reset } = useScanner()
  const [manualInput, setManualInput] = useState('')
  const [manualCard, setManualCard] = useState<string | null>(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  const handleCapture = async () => {
    const frame = captureFrame()
    if (frame) await processImage(frame)
  }

  // When OCR finds a result, pre-fill the manual input
  useEffect(() => {
    if (scanResult) setManualInput(scanResult.cardNumber)
  }, [scanResult])

  const handleManualSearch = () => {
    const trimmed = manualInput.trim().toUpperCase()
    if (CARD_FORMAT.test(trimmed)) {
      setManualCard(trimmed)
    }
  }

  const handleClose = () => {
    reset()
    setManualCard(null)
    setManualInput('')
  }

  const activeCard = manualCard ?? (scanResult?.cardNumber ?? null)

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      {/* Camera — takes up remaining space above the bottom panel */}
      <div className="flex-1 relative min-h-0">
        <Viewfinder videoRef={videoRef} onCapture={handleCapture} />

        {scanning && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white px-6 py-4 rounded-xl text-sm font-medium">Analyse en cours...</div>
          </div>
        )}

        {error && !scanResult && (
          <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white p-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}
      </div>

      {/* Bottom panel — always visible for manual input */}
      <div className="bg-white/95 backdrop-blur px-4 pt-3 pb-6 safe-area-inset-bottom">
        <p className="text-xs text-gray-400 mb-2 text-center">
          Numéro détecté par OCR ou saisi manuellement (ex : OP01-001)
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={e => setManualInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
            placeholder="OP01-001"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            onClick={handleManualSearch}
            disabled={!CARD_FORMAT.test(manualInput.trim())}
            className="px-4 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm disabled:opacity-40"
          >
            Chercher
          </button>
        </div>
      </div>

      {activeCard && (
        <CardConfirmModal cardNumber={activeCard} onClose={handleClose} />
      )}
    </div>
  )
}
