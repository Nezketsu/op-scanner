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
    if (CARD_FORMAT.test(trimmed)) setActiveCard(trimmed)
  }

  const handleClose = () => {
    reset()
    setActiveCard(null)
    setManualInput('')
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-900">
      <div className="flex-1 relative min-h-0">
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
            Carte non reconnue. Réessaie ou saisis le code manuellement.
          </div>
        )}
      </div>

      <div className="bg-white border-t border-slate-200 px-4 pt-3 pb-6">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Saisie manuelle
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={e => setManualInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
            placeholder="OP01-001"
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            onClick={handleManualSearch}
            disabled={!CARD_FORMAT.test(manualInput.trim())}
            className="px-5 py-3 bg-indigo-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40"
          >
            OK
          </button>
        </div>
      </div>

      {activeCard && (
        <CardConfirmModal cardNumber={activeCard} onClose={handleClose} />
      )}
    </div>
  )
}
