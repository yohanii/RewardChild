// src/hooks/useShopScreen.ts
import { supabase } from '@/src/services/supabaseClient'
import { useEffect, useMemo, useState } from 'react'

export type Profile = {
  id: number
  role: 'PARENT' | 'CHILD'
  nickname?: string | null
}

export type ShopItem = {
  id: number
  parent_id: number
  title: string
  content: string | null
  price: number
  is_active: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

type CreateItemPayload = {
  title: string
  content?: string
  price: number
}

export function useShopScreen() {
  const [loading, setLoading] = useState(true)
  const [mutating, setMutating] = useState(false)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [targetChildId, setTargetChildId] = useState<number | null>(null)

  const [balance, setBalance] = useState(0)
  const [items, setItems] = useState<ShopItem[]>([])
  const [purchasedSet, setPurchasedSet] = useState<Set<number>>(new Set())

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const orderedItems = useMemo(() => {
    // ✅ “미구매 먼저, 구매한 건 아래” 정렬
    const unpurchased: ShopItem[] = []
    const purchased: ShopItem[] = []

    for (const it of items) {
      if (purchasedSet.has(it.id)) purchased.push(it)
      else unpurchased.push(it)
    }
    return [...unpurchased, ...purchased]
  }, [items, purchasedSet])

  const reload = async () => {
    try {
      setLoading(true)
      const p = await loadProfile()
      setProfile(p)

      const childId = await resolveTargetChildId(p)
      setTargetChildId(childId)

      await Promise.all([loadBalance(childId), loadShopItems(), loadPurchased(childId)])
    } catch (e) {
      console.warn('useShopScreen.reload error', e)
    } finally {
      setLoading(false)
    }
  }

  const loadProfile = async (): Promise<Profile> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) throw authError
    if (!user) throw new Error('No auth user')

    const { data, error } = await supabase
      .from('users')
      .select('id, role, nickname')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error('No profile row in users')

    return { id: data.id, role: data.role, nickname: data.nickname }
  }

  const resolveTargetChildId = async (p: Profile): Promise<number> => {
    if (p.role === 'CHILD') return p.id

    // ⚠️ 여기만 프로젝트 스키마에 맞게 바꾸면 됨.
    // (예: relations 테이블명/컬럼명이 다르면 수정)
    const { data, error } = await supabase
      .from('relations')
      .select('child_id')
      .eq('parent_id', p.id)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.warn('resolveTargetChildId failed, fallback to parent id', error.message)
      return p.id
    }

    return data?.[0]?.child_id ?? p.id
  }

  const loadBalance = async (userId: number) => {
    const { data, error } = await supabase
        .from('balances')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'CASH')
        .maybeSingle()

    if (error) throw error
    setBalance(data?.amount ?? 0)
  }

  const loadShopItems = async () => {
    const { data, error } = await supabase
      .from('shop_items')
      .select('id, parent_id, title, content, price, is_active, sort_order, created_at, updated_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: false })
      .order('id', { ascending: false })

    if (error) throw error
    setItems((data ?? []) as ShopItem[])
  }

  const loadPurchased = async (childId: number) => {
    const { data, error } = await supabase
      .from('shop_purchases')
      .select('shop_item_id')
      .eq('child_id', childId)

    if (error) throw error
    const set = new Set<number>()
    ;(data ?? []).forEach((r: any) => set.add(r.shop_item_id))
    setPurchasedSet(set)
  }

  const createItem = async (payload: CreateItemPayload) => {
    if (!profile || profile.role !== 'PARENT') return

    const title = payload.title.trim()
    const content = (payload.content ?? '').trim()
    const price = payload.price

    if (!title) return
    if (!Number.isFinite(price) || price <= 0) return

    try {
      setMutating(true)
      const { error } = await supabase.from('shop_items').insert({
        parent_id: profile.id,
        title,
        content: content.length ? content : null,
        price,
      })
      if (error) throw error
      await loadShopItems()
    } finally {
      setMutating(false)
    }
  }

  return {
    profile,
    targetChildId,
    balance,
    loading,
    mutating,
    items,
    orderedItems,
    purchasedSet,
    reload,
    createItem,
  }
}