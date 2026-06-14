'use client'
import { useEffect, useState } from 'react'
import { Viewfinder } from '@/components/scanner/Viewfinder'
import { CardConfirmModal } from '@/components/scanner/CardConfirmModal'
import { useScanner } from '@/hooks/useScanner'

const CARD_FORMAT = /^[A-Z]{1,3}\d{1,2}-\d{3}[a-z]?$/i

export default function ScanPage() {
  const { videoRef, startCamera, stopCamera, captureFrame, processImage, scanResult, scanning, error, reset } = useScanner()
  const [manualInput, setManualInput] = useState('')
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
    if (scanResult?.cardNumber) {
      setManualInput(scanResult.cardNumber)
      setActiveCard(scanResult.cardNumber)
    }
  }, [scanResult])

  const handleManualSearch = () => {
    const trimmed = manualInput.trim().toUpperCase()
    if (CARD_FORMAT.test(trimmed)) {
      setActiveCard(trimmed)
    }
  }

  const handleClose = () => {
    reset()
    setActiveCard(null)
    setManualInput('')
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      <div className="flex-1 relative min-h-0">
        <Viewfinder videoRef={videoRef} onCapture={handleCapture} />

        {scanning && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white px-6 py-4 rounded-xl text-sm font-medium">Analyse en cours...</div>
          </div>
        )}

        {error && (
          <div className="absolute top-4 left-4 right-4 bg-black/85 text-white p-3 rounded-xl text-xs space-y-1 max-h-48 overflow-y-auto">
            <p className="text-red-400 font-semibold">{error}</p>
            {scanResult?.rawText && (
              <pre className="text-gray-300 whitespace-pre-wrap break-all font-mono leading-tight">
                {scanResult.rawText}
              </pre>
            )}
          </div>
        )}
      </div>

      <div className="bg-white/95 backdrop-blur px-4 pt-3 pb-6">
        <p className="text-xs text-gray-400 mb-2 text-center">
          Code détecté par scan ou saisi manuellement
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
