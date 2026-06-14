import { vi, describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('@/lib/ocr', () => ({
  recognizeCardNumber: vi.fn().mockResolvedValue({ cardNumber: 'OP01-001', confidence: 0.92 }),
}))

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [] }) },
  writable: true,
})

describe('useScanner', () => {
  it('processImage returns scan result from OCR', async () => {
    const { useScanner } = await import('@/hooks/useScanner')
    const { result } = renderHook(() => useScanner())

    await act(async () => {
      await result.current.processImage('data:image/jpeg;base64,fake')
    })

    expect(result.current.scanResult?.cardNumber).toBe('OP01-001')
    expect(result.current.scanResult?.confidence).toBe(0.92)
  })

  it('sets error when OCR returns null', async () => {
    const { recognizeCardNumber } = await import('@/lib/ocr')
    vi.mocked(recognizeCardNumber).mockResolvedValueOnce(null)

    const { useScanner } = await import('@/hooks/useScanner')
    const { result } = renderHook(() => useScanner())

    await act(async () => {
      await result.current.processImage('data:image/jpeg;base64,fake')
    })

    expect(result.current.scanResult).toBeNull()
    expect(result.current.error).toBe('Numéro de carte non détecté')
  })
})
