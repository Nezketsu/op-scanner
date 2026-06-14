import type { ScanResult } from '@/types'

const CARD_NUMBER_REGEX = /\b([A-Z]{1,3}[\dO]{1,2}[-.][O\d]{3}[a-z]?)\b/i

export function extractCardNumber(text: string): string | null {
  const normalized = text
    .toUpperCase()
    .replace(/\./g, '-')
    .replace(/[Il]/g, '1')
  const match = normalized.match(CARD_NUMBER_REGEX)
  return match ? match[1].toUpperCase().replace('.', '-') : null
}

// Crop bottom 22% of image and upscale 3x for better recognition
function preprocessForOcr(imageData: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const scale = 3
      const srcY = img.height * 0.78
      const srcH = img.height * 0.22
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = srcH * scale
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, srcY, img.width, srcH, 0, 0, canvas.width, canvas.height)
      // Grayscale + binarize
      const d = ctx.getImageData(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < d.data.length; i += 4) {
        const gray = 0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2]
        const val = gray > 140 ? 255 : 0
        d.data[i] = d.data[i + 1] = d.data[i + 2] = val
      }
      ctx.putImageData(d, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.95))
    }
    img.src = imageData
  })
}

async function recognizeWithHuggingFace(imageData: string): Promise<{ cardNumber: string | null; rawText: string }> {
  const response = await fetch('/api/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageData }),
  })
  if (!response.ok) throw new Error(`OCR API error: ${response.status}`)
  const data = await response.json()
  return { cardNumber: data.cardNumber ?? null, rawText: data.rawText ?? '' }
}

// Tesseract fallback (kept for offline / rate-limit cases)
let tesseractWorker: Awaited<ReturnType<typeof import('tesseract.js').createWorker>> | null = null

async function recognizeWithTesseract(imageData: string): Promise<{ cardNumber: string | null; rawText: string }> {
  if (!tesseractWorker) {
    const { createWorker } = await import('tesseract.js')
    tesseractWorker = await createWorker('eng')
    await tesseractWorker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
      tessedit_pageseg_mode: '7' as never,
    })
  }
  const { data } = await tesseractWorker.recognize(imageData)
  return { cardNumber: extractCardNumber(data.text), rawText: data.text }
}

export async function recognizeCardNumber(imageData: string): Promise<ScanResult | null> {
  const cropped = await preprocessForOcr(imageData)
  const allLogs: string[] = []

  // Primary: HuggingFace TrOCR
  try {
    const hf = await recognizeWithHuggingFace(cropped)
    allLogs.push(`[HF-cropped] ${hf.rawText.trim()}`)
    if (hf.cardNumber) {
      return { cardNumber: hf.cardNumber, confidence: 0.9, rawText: allLogs.join('\n') }
    }

    // Try with full image if cropped didn't work
    const hfFull = await recognizeWithHuggingFace(imageData)
    allLogs.push(`[HF-full] ${hfFull.rawText.trim()}`)
    if (hfFull.cardNumber) {
      return { cardNumber: hfFull.cardNumber, confidence: 0.75, rawText: allLogs.join('\n') }
    }
  } catch (err) {
    allLogs.push(`[HF error] ${String(err)}`)
  }

  // Fallback: Tesseract local
  try {
    const t = await recognizeWithTesseract(cropped)
    allLogs.push(`[Tesseract] ${t.rawText.trim()}`)
    if (t.cardNumber) {
      return { cardNumber: t.cardNumber, confidence: 0.5, rawText: allLogs.join('\n') }
    }
  } catch (err) {
    allLogs.push(`[Tesseract error] ${String(err)}`)
  }

  return { cardNumber: '', confidence: 0, rawText: allLogs.join('\n') }
}

export async function terminateWorker() {
  if (tesseractWorker) {
    await tesseractWorker.terminate()
    tesseractWorker = null
  }
}
