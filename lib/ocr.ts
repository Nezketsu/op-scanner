import type { ScanResult } from '@/types'

const CARD_NUMBER_REGEX = /\b([A-Z]{1,3}\d{1,2}-\d{3}[a-z]?)\b/i

let workerInstance: Awaited<ReturnType<typeof import('tesseract.js').createWorker>> | null = null

async function getWorker() {
  if (!workerInstance) {
    const { createWorker } = await import('tesseract.js')
    workerInstance = await createWorker('eng')
  }
  return workerInstance
}

export function extractCardNumber(text: string): ScanResult | null {
  const match = text.match(CARD_NUMBER_REGEX)
  if (!match) return null
  return { cardNumber: match[1].toUpperCase(), confidence: 1 }
}

export async function recognizeCardNumber(imageData: string): Promise<ScanResult | null> {
  const worker = await getWorker()
  const { data } = await worker.recognize(imageData)
  const result = extractCardNumber(data.text)
  if (!result) return null
  return { cardNumber: result.cardNumber, confidence: data.confidence / 100 }
}

export async function terminateWorker() {
  if (workerInstance) {
    await workerInstance.terminate()
    workerInstance = null
  }
}
