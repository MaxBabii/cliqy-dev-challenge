'use client'

import { useState } from 'react'
import type { QueueItem, MessageStatus, MessageCategory } from '@/types'

const SEED_ITEMS: QueueItem[] = [
  {
    id: '1',
    message: 'Dzień dobry, chciałbym zamówić 50 sztuk produktu X. Czy możliwy jest rabat przy takiej ilości?',
    company: 'Sklep meblowy Premium',
    category: 'zamówienie',
    priority: 'high',
    draft_reply:
      'Dzień dobry! Dziękujemy za zainteresowanie naszą ofertą. Przy zamówieniu 50 sztuk produktu X przysługuje rabat 15%. Czy mogę poprosić o dane do wyceny?',
    confidence: 0.94,
    status: 'pending',
    created_at: new Date().toISOString(),
  },
]

const CATEGORY_STYLES: Record<MessageCategory, string> = {
  zamówienie: 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40',
  pytanie: 'bg-blue-900/40 text-blue-400 border border-blue-700/40',
  reklamacja: 'bg-red-900/40 text-red-400 border border-red-700/40',
  spam: 'bg-zinc-800 text-zinc-500 border border-zinc-700',
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-zinc-500',
}

export default function QueuePage() {
  const [items, setItems] = useState<QueueItem[]>(SEED_ITEMS)
  const [filter, setFilter] = useState<MessageCategory | 'all'>('all')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftText, setDraftText] = useState<string>('')

  const [inputCompany, setInputCompany] = useState('')
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleAction(id: string, action: MessageStatus) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: action } : item))
    )
  }

  function handleEditReply(id: string, newReply: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, draft_reply: newReply } : item))
    )
    setEditingId(null)
  }

  async function handleSimulateIncomingMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!inputCompany.trim() || !inputMessage.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: inputCompany,
          message: inputMessage,
        }),
      })

      if (!response.ok) {
        throw new Error('Błąd podczas klasyfikacji wiadomości przez AI.')
      }

      const aiResult = await response.json()

      const newItem: QueueItem = {
        id: crypto.randomUUID(),
        company: inputCompany,
        message: inputMessage,
        category: aiResult.category,
        priority: aiResult.priority,
        draft_reply: aiResult.draft_reply,
        confidence: aiResult.confidence,
        status: 'pending',
        created_at: new Date().toISOString(),
      }

      setItems((prev) => [newItem, ...prev])
      setInputMessage('')
    } catch (err: any) {
      setError(err.message || 'Wystąpił nieoczekiwany błąd.')
    } finally {
      setIsLoading(false)
    }
  }

  const visible = filter === 'all' ? items : items.filter((i) => i.category === filter)
  const pending = items.filter((i) => i.status === 'pending').length
  const approved = items.filter((i) => i.status === 'approved').length
  const rejected = items.filter((i) => i.status === 'rejected').length

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Cliqy Studio</p>
          <h1 className="text-2xl font-bold text-zinc-100">Panel weryfikacji</h1>
          <p className="text-zinc-400 mt-1 text-sm">
            {pending} oczekujących · {approved} zatwierdzonych · {rejected} odrzuconych
          </p>
        </div>
      </div>

      <section className="mb-10 p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
        <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <span>🤖</span> Automatyczny symulator wiadomości (Klasyfikacja AI)
        </h2>

        <form onSubmit={handleSimulateIncomingMessage} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nazwa firmy (np. Sklep meblowy Premium)"
            value={inputCompany}
            onChange={(e) => setInputCompany(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-700"
            required
          />

          <textarea
            placeholder="Wpisz treść wiadomości od klienta (AI automatycznie rozpozna kategorię)..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="w-full p-3 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-700 min-h-[70px]"
            required
          />

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="self-end px-4 py-2 rounded-lg text-xs font-semibold bg-white text-black hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Analizowanie i generowanie przez AI...' : 'Wyślij i sklasyfikuj automatycznie 🚀'}
          </button>
        </form>
      </section>

      <hr className="border-zinc-800 mb-8" />

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'zamówienie', 'pytanie', 'reklamacja', 'spam'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === cat ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {cat === 'all' ? 'Wszystkie' : cat}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {visible.length === 0 && (
          <p className="text-zinc-500 text-sm py-12 text-center border border-dashed border-zinc-800 rounded-xl">
            Brak elementów w tej kategorii.
          </p>
        )}

        {visible.map((item) => {
          const isEditing = editingId === item.id
          const isPending = item.status === 'pending'

          return (
            <article
              key={item.id}
              className={`rounded-xl border p-5 transition-opacity ${!isPending ? 'opacity-50' : ''}`}
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_STYLES[item.category]}`}>
                    {item.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[item.priority]}`} />
                    {item.priority}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">{item.company}</span>
                </div>
                <span className="text-xs text-zinc-600 shrink-0">
                  {new Date(item.created_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="mb-3">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Wiadomość</p>
                <p className="text-sm text-zinc-200 bg-zinc-900/20 p-2.5 rounded border border-zinc-800/40">{item.message}</p>
              </div>

              <div className="mb-4 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
                  Draft AI · {Math.round(item.confidence * 100)}% pewności
                </p>

                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      className="w-full p-2 text-sm bg-zinc-950 border border-zinc-700 rounded text-zinc-200 focus:outline-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEditReply(item.id, draftText)}
                        className="px-2.5 py-1 text-xs bg-emerald-700 text-white rounded hover:bg-emerald-600 transition-colors"
                      >
                        Zapisz
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 text-xs bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700 transition-colors"
                      >
                        Anuluj
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-300 whitespace-pre-line">{item.draft_reply}</p>
                )}
              </div>

              {isPending && !isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(item.id, 'approved')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-900/40 text-emerald-400 border border-emerald-700/40 hover:bg-emerald-800/50 transition-colors"
                  >
                    ✅ Zatwierdź
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(item.id)
                      setDraftText(item.draft_reply)
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors"
                  >
                    ✏️ Edytuj
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'rejected')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/40 text-red-400 border border-red-700/40 hover:bg-red-800/50 transition-colors"
                  >
                    ❌ Odrzuć
                  </button>
                </div>
              )}

              {!isPending && (
                <p className="text-xs font-medium mt-2">
                  {item.status === 'approved' ? (
                    <span className="text-emerald-400">✅ Zatwierdzone</span>
                  ) : (
                    <span className="text-red-400">❌ Odrzucone</span>
                  )}
                </p>
              )}
            </article>
          )
        })}
      </div>
    </main>
  )
}