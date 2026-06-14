import { NextResponse } from 'next/server'

const CARD_NUMBER_REGEX = /\b([A-Z]{1,3}\d{1,2}-\d{3})(?!\d)/i

function extractCardNumber(text: string): string | null {
  const normalized = text.toUpperCase().replace(/\./g, '-').replace(/[Il]/g, '1')
  const match = normalized.match(CARD_NUMBER_REGEX)
  if (!match) return null
  // Hard cut: take exactly PREFIX+SETNUM+"-"+first 3 digits
  const parts = match[1].split('-')
  return (parts[0] + '-' + parts[1].slice(0, 3)).toUpperCase()
}

export async function POST(request: Request) {
  try {
    const { image } = await request.json()
    if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const apiKey = process.env.OCR_SPACE_API_KEY ?? 'helloworld'

    const body = new URLSearchParams({
      base64Image: image,
      language: 'eng',
      isOverlayRequired: 'false',
      OCREngine: '2',         // Engine 2 : meilleur pour texte imprimé/stylisé
      scale: 'true',          // upscale automatique des petites images
      detectOrientation: 'false',
    })

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        apikey: apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const data = await response.json()

    if (data.IsErroredOnProcessing) {
      return NextResponse.json({ error: data.ErrorMessage?.[0] ?? 'OCR error', rawText: '', cardNumber: null }, { status: 500 })
    }

    const rawText = data.ParsedResults?.[0]?.ParsedText ?? ''
    const cardNumber = extractCardNumber(rawText)

    return NextResponse.json({ rawText: rawText.trim(), cardNumber })
  } catch (err) {
    console.error('[api/ocr]', err)
    return NextResponse.json({ error: String(err), rawText: '', cardNumber: null }, { status: 500 })
  }
}
