import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { ClassifyRequest, ClassifyResponse } from '@/types'

const MODEL = 'gpt-4o-mini' as const
const MAX_TOKENS = 300

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(
  req: Request
): Promise<NextResponse<ClassifyResponse | { error: string }>> {
  try {
    let body: ClassifyRequest & { category?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    if (!body.message?.trim() || !body.company?.trim()) {
      return NextResponse.json(
        { error: 'message and company are required' },
        { status: 400 }
      )
    }

    const categoryInstruction = body.category
      ? `Wymuszona kategoria przez operatora to: "${body.category}". Użyj DOKŁADNIE tej wartości w polu "category" w JSON.`
      : `Przeanalizuj wiadomość i przypisz "category" na podstawie poniższych ścisłych kryteriów:
         - "zamówienie": Klient deklaruje bezpośrednią chęć zakupu, składa zamówienie, przesyła dane do faktury/wysyłki lub finalizuje transakcję (np. "Zamawiam 10 sztuk...", "Chcę kupić x, oto moje dane").
         - "pytanie": Klient pyta o ofertę, dostępność, ceny, godziny otwarcia, możliwość rabatu lub parametry techniczne, ale JESZCZE NIE deklaruje zakupu (np. "Czy dostanę rabat przy 50 sztukach?", "Czy produkt X jest dostępny?", "Ile kosztuje wysyłka?"). To są pytania przedzakupowe!
         - "reklamacja": Klient zgłasza problem z zamówieniem, opóźnioną paczkę, uszkodzony towar lub żąda zwrotu pieniędzy.
         - "spam": Oferty marketingowe, wiadomości niespójne, linki phishingowe.`

    const completion = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `
Jesteś zaawansowanym asystentem obsługi klienta pracującym dla firmy: "${body.company}".
Twoim głównym zadaniem jest bezbłędna segregacja wiadomości przychodzących.

Zasady klasyfikacji:
1. "category": ${categoryInstruction}
2. "priority": przypisz priorytet ("high", "medium", "low") na podstawie emocji klienta i pilności sprawy.
3. "draft_reply": przygotuj gotowy, profesjonalny i uprzejmy szkic odpowiedzi w języku polskim. Dopasuj ton wypowiedzi do profilu firmy i wskazanej kategorii.
4. "confidence": określ stopień pewności swojej decyzji (liczba zmiennoprzecinkowa od 0.0 do 1.0).

Wymagany format wyjściowy (ścisły JSON):
{
  "category": "zamówienie" | "pytanie" | "reklamacja" | "spam",
  "priority": "high" | "medium" | "low",
  "draft_reply": "Treść odpowiedzi...",
  "confidence": 0.95
}
`
        },
        {
          role: 'user',
          content: `Wiadomość od klienta:\n${body.message}`
        }
      ]
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('Empty response from OpenAI')
    }

    const result = JSON.parse(content) as ClassifyResponse

    const validCategories = ['zamówienie', 'pytanie', 'reklamacja', 'spam']
    const validPriorities = ['high', 'medium', 'low']

    const responseData: ClassifyResponse = {
      category: validCategories.includes(result.category) ? result.category : 'pytanie',
      priority: validPriorities.includes(result.priority) ? result.priority : 'medium',
      draft_reply: result.draft_reply || '',
      confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0.5))
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Classification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}