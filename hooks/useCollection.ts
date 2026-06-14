'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CollectionEntry, Card } from '@/types'

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

  const addCard = useCallback(async (card: Card, variantId: string | null) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: new Error('Utilisateur non connecté') }
    }

    // Crée ou met à jour la carte en DB avec tous ses détails
    const { error: cardError } = await supabase
      .from('cards')
      .upsert(
        {
          id: card.id,
          set_id: card.set_id,
          card_number: card.card_number,
          name: card.name || 'Sans nom',
          image_url: card.image_url,
          rarity: card.rarity,
          variants: card.variants,
          market_price: card.market_price,
          price_source: card.price_source,
          price_updated_at: card.price_updated_at,
        },
        { onConflict: 'id', ignoreDuplicates: false }
      )

    if (cardError) {
      console.error('Erreur insertion carte:', cardError)
      return { error: new Error('Impossible de créer la carte') }
    }

    // Ajoute à la collection
    const { error } = await supabase
      .from('collection')
      .upsert(
        { user_id: user.id, card_id: card.id, variant_id: variantId, quantity: 1 },
        { onConflict: 'user_id,card_id,variant_id', ignoreDuplicates: false }
      )

    if (error) {
      console.error('Erreur upsert collection:', error)
      return { error: new Error(error.message || 'Erreur lors de l\'ajout') }
    }

    await loadCollection()
    return { error: null }
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
