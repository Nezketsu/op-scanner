import { vi, describe, it, expect } from 'vitest'

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(async () => ({
    recognize: vi.fn(async () => ({
      data: { text: 'OP01-001\nSome other text\n', confidence: 90 },
    })),
    terminate: vi.fn(),
  })),
}))

describe('ocr', () => {
  it('extracts One Piece card number from OCR text', async () => {
    const { extractCardNumber } = await import('@/lib/ocr')
    const result = extractCardNumber('OP01-001\nSome other text\n')
    expect(result).toEqual({ cardNumber: 'OP01-001', confidence: 1 })
  })

  it('extracts starter deck format ST01-001', async () => {
    const { extractCardNumber } = await import('@/lib/ocr')
    const result = extractCardNumber('Random text ST01-005 more text')
    expect(result?.cardNumber).toBe('ST01-005')
  })

  it('returns null when no card number found', async () => {
    const { extractCardNumber } = await import('@/lib/ocr')
    const result = extractCardNumber('just random text here')
    expect(result).toBeNull()
  })

  it('recognizeCardNumber calls tesseract and returns result', async () => {
    const { recognizeCardNumber } = await import('@/lib/ocr')
    const result = await recognizeCardNumber('data:image/jpeg;base64,fake')
    expect(result?.cardNumber).toBe('OP01-001')
  })
})
