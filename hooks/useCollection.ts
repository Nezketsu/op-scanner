'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CollectionEntry } from '@/types'

export function useCollection() {
  const [entries, setEntries] = useState<CollectionEntry[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const loadCollection = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data, error } = await supabase
      .from('collection')
      .select('*, card:cards(*)')
      .eq('user_id', user.id)

    if (!error && data) setEntries(data as CollectionEntry[])
    setLoading(false)
  }, [])

  const addCard = useCallback(async (cardId: string, variantId: string | null) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('collection')
      .upsert(
        { user_id: user.id, card_id: cardId, variant_id: variantId, quantity: 1 },
        { onConflict: 'user_id,card_id,variant_id', ignoreDuplicates: false }
      )

    await loadCollection()
  }, [loadCollection])

  const removeCard = useCallback(async (entryId: string) => {
    await supabase.from('collection').delete().eq('id', entryId)
    setEntries(prev => prev.filter(e => e.id !== entryId))
  }, [])

  const updateQuantity = useCallback(async (entryId: string, quantity: number) => {
    if (quantity < 1) {
      await removeCard(entryId)
      return
    }
    await supabase.from('collection').upsert({ id: entryId, quantity })
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, quantity } : e))
  }, [removeCard])

  return { entries, loading, loadCollection, addCard, updateQuantity, removeCard }
}
