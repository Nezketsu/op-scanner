import type { ScanResult } from '@/types'

// Accepts OCR mistakes: O↔0, l↔1, dots instead of dashes
const CARD_NUMBER_REGEX = /\b([A-Z]{1,3}[\dO]{1,2}[-.][\dOl]{3}[a-z]?)\b/i

let workerInstance: Awaited<ReturnType<typeof import('tesseract.js').createWorker>> | null = null

async function getWorker() {
  if (!workerInstance) {
    const { createWorker } = await import('tesseract.js')
    workerInstance = await createWorker('eng')
    await workerInstance.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-/',
      // PSM 11 = sparse text, good for finding a code anywhere in the image
      tessedit_pageseg_mode: '11' as never,
    })
  }
  return workerInstance
}

function fixOcrMistakes(raw: string): string {
  // Fix common OCR mistakes in card numbers
  return raw
    .replace(/\bO(?=\d)/g, '0')   // Leading O before digit → 0 (e.g. OP01 → but keep OP)
    .replace(/(?<=[A-Z]{2,3}\d{1,2}[-.])\d*l\d*/g, m => m.replace(/l/g, '1'))  // l → 1 in number part
    .replace(/\./g, '-')           // dot → dash (OCR often reads - as .)
}

export function extractCardNumber(text: string): ScanResult | null {
  const fixed = fixOcrMistakes(text)
  const match = fixed.match(CARD_NUMBER_REGEX)
  if (!match) return null
  const cardNumber = match[1]
    .toUpperCase()
    .replace('.', '-')
    .replace(/O(?=\d)/g, '0')
  return { cardNumber, confidence: 1 }
}

function cropBottomStrip(imageData: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const stripHeight = Math.floor(img.height * 0.25)
      canvas.width = img.width
      canvas.height = stripHeight
      const ctx = canvas.getContext('2d')!
      // Draw only the bottom 25% where the card number lives
      ctx.drawImage(img, 0, img.height - stripHeight, img.width, stripHeight, 0, 0, img.width, stripHeight)
      // Increase contrast
      ctx.filter = 'contrast(1.5) brightness(1.1)'
      resolve(canvas.toDataURL('image/jpeg', 0.95))
    }
    img.src = imageData
  })
}

export async function recognizeCardNumber(imageData: string): Promise<ScanResult | null> {
  const worker = await getWorker()

  // First try on the full image, then on the cropped bottom strip
  for (const source of [imageData, await cropBottomStrip(imageData)]) {
    const { data } = await worker.recognize(source)
    const result = extractCardNumber(data.text)
    if (result) {
      return { cardNumber: result.cardNumber, confidence: data.confidence / 100 }
    }
  }

  return null
}

export async function terminateWorker() {
  if (workerInstance) {
    await workerInstance.terminate()
    workerInstance = null
  }
}
