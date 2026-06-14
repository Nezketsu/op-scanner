'use client'
import { useState, useRef, useCallback } from 'react'
import type { ScanResult } from '@/types'

export function useScanner() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setError("Impossible d'accéder à la caméra")
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current) return null
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.8)
  }, [])

  const processImage = useCallback(async (imageData: string) => {
    setScanning(true)
    setError(null)
    const { recognizeCardNumber } = await import('@/lib/ocr')
    const result = await recognizeCardNumber(imageData)
    if (result) {
      setScanResult(result)
    } else {
      setError('Numéro de carte non détecté')
    }
    setScanning(false)
  }, [])

  const reset = useCallback(() => {
    setScanResult(null)
    setError(null)
  }, [])

  return { videoRef, scanResult, scanning, error, startCamera, stopCamera, captureFrame, processImage, reset }
}
