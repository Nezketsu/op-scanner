import type { ScanResult } from '@/types'

// Matches OP01-001, ST01-001, EB01-001 with common OCR substitutions (O↔0, l↔1, .↔-)
const CARD_NUMBER_REGEX = /\b([A-Z]{1,3}[\dO]{1,2}[-.][O\d]{3}[a-z]?)\b/i

let workerInstance: Awaited<ReturnType<typeof import('tesseract.js').createWorker>> | null = null

async function getWorker() {
  if (!workerInstance) {
    const { createWorker } = await import('tesseract.js')
    workerInstance = await createWorker('eng')
    await workerInstance.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
      tessedit_pageseg_mode: '7' as never,
    })
  }
  return workerInstance
}

export function extractCardNumber(text: string): string | null {
  const normalized = text
    .toUpperCase()
    .replace(/\./g, '-')
    .replace(/[Il]/g, '1')

  const match = normalized.match(CARD_NUMBER_REGEX)
  if (!match) return null

  return match[1].toUpperCase().replace('.', '-')
}

function preprocessRegion(
  img: HTMLImageElement,
  xRatio: number,
  yRatio: number,
  wRatio: number,
  hRatio: number,
  scale = 4
): string {
  const canvas = document.createElement('canvas')
  const srcX = img.width * xRatio
  const srcY = img.height * yRatio
  const srcW = img.width * wRatio
  const srcH = img.height * hRatio

  canvas.width = srcW * scale
  canvas.height = srcH * scale

  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = imageData.data
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    const val = gray > 140 ? 255 : 0
    d[i] = d[i + 1] = d[i + 2] = val
  }
  ctx.putImageData(imageData, 0, 0)

  return canvas.toDataURL('image/png')
}

async function tryRecognize(
  worker: Awaited<ReturnType<typeof import('tesseract.js').createWorker>>,
  imageData: string
): Promise<{ cardNumber: string | null; rawText: string }> {
  const { data } = await worker.recognize(imageData)
  return { cardNumber: extractCardNumber(data.text), rawText: data.text }
}

export async function recognizeCardNumber(imageData: string): Promise<ScanResult | null> {
  const worker = await getWorker()
  const allRawTexts: string[] = []

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = async () => {
      // Strategy 1: bottom-left 40%, bottom 18% (card number zone)
      const bottomLeft = preprocessRegion(img, 0, 0.82, 0.45, 0.18)
      const r1 = await tryRecognize(worker, bottomLeft)
      allRawTexts.push(`[BL] ${r1.rawText.trim()}`)
      if (r1.cardNumber) {
        resolve({ cardNumber: r1.cardNumber, confidence: 0.9, rawText: allRawTexts.join('\n') })
        return
      }

      // Strategy 2: full bottom 22%
      const bottomStrip = preprocessRegion(img, 0, 0.78, 1, 0.22)
      const r2 = await tryRecognize(worker, bottomStrip)
      allRawTexts.push(`[BS] ${r2.rawText.trim()}`)
      if (r2.cardNumber) {
        resolve({ cardNumber: r2.cardNumber, confidence: 0.75, rawText: allRawTexts.join('\n') })
        return
      }

      // Strategy 3: full image, PSM 11
      await worker.setParameters({ tessedit_pageseg_mode: '11' as never })
      const r3 = await tryRecognize(worker, imageData)
      await worker.setParameters({ tessedit_pageseg_mode: '7' as never })
      allRawTexts.push(`[FULL] ${r3.rawText.trim()}`)
      if (r3.cardNumber) {
        resolve({ cardNumber: r3.cardNumber, confidence: 0.5, rawText: allRawTexts.join('\n') })
        return
      }

      // Nothing found — still return raw text for debug
      resolve({ cardNumber: '', confidence: 0, rawText: allRawTexts.join('\n') })
    }
    img.src = imageData
  })
}

export async function terminateWorker() {
  if (workerInstance) {
    await workerInstance.terminate()
    workerInstance = null
  }
}
