// src/hooks/useShopScreen.ts
import { supabase } from '@/src/services/supabaseClient'
import type { Enums, Tables } from '@/src/types/database.types'
import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'

export type Profile = {
  id: number
  role: Exclude<Enums<'user_role'>, 'DEFAULT'>
  nickname?: string | null
}

export type ShopItem = Pick<
  Tables<'shop_items'>,
  | 'id'
  | 'parent_id'
  | 'title'
  | 'content'
  | 'price'
  | 'is_active'
  | 'sort_order'
  | 'created_at'
  | 'updated_at'
>

type CreateItemPayload = {
  title: string
  content?: string
  price: number
}

type UpdateItemPayload = CreateItemPayload & {
  id: number
}

function createIdempotencyKey() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    const value = character === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

export function useShopScreen() {
  const [loading, setLoading] = useState(true)
  const [mutating, setMutating] = useState(false)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [targetChildId, setTargetChildId] = useState<number | null>(null)

  const [balance, setBalance] = useState(0)
  const [items, setItems] = useState<ShopItem[]>([])
  const [purchasedSet, setPurchasedSet] = useState<Set<number>>(new Set())
  const purchaseInFlightRef = useRef(false)
  const purchaseRetryRef = useRef<{ shopItemId: number; idempotencyKey: string } | null>(null)

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

      await Promise.all([loadBalance(childId), loadShopItems(p), loadPurchased(childId)])
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
    if (data.role === 'DEFAULT') {
      router.replace('/role-select')
      throw new Error('Profile onboarding is incomplete')
    }

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
        .select('type, amount')
        .eq('user_id', userId)
        .in('type', ['ATTENDANCE', 'CASH'])

    if (error) throw error
    setBalance((data ?? []).reduce((sum, row) => sum + row.amount, 0))
  }

  const loadShopItems = async (p: Profile) => {
    let query = supabase
      .from('shop_items')
      .select('id, parent_id, title, content, price, is_active, sort_order, created_at, updated_at')

    if (p.role === 'CHILD') {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query
      .order('sort_order', { ascending: false })
      .order('id', { ascending: false })

    if (error) throw error
    setItems(data ?? [])
  }

  const loadPurchased = async (childId: number) => {
    const { data, error } = await supabase
      .from('shop_purchases')
      .select('shop_item_id')
      .eq('child_id', childId)

    if (error) throw error
    const set = new Set<number>()
    ;(data ?? []).forEach((r) => set.add(r.shop_item_id))
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
      const { error } = await supabase.rpc('create_shop_item', {
        p_title: title,
        p_content: content,
        p_price: price,
      })
      if (error) throw error
      await loadShopItems(profile)
    } finally {
      setMutating(false)
    }
  }

  const updateItem = async (payload: UpdateItemPayload) => {
    if (!profile || profile.role !== 'PARENT') return

    try {
      setMutating(true)
      const { error } = await supabase.rpc('update_shop_item', {
        p_shop_item_id: payload.id,
        p_title: payload.title.trim(),
        p_content: (payload.content ?? '').trim(),
        p_price: payload.price,
      })
      if (error) throw error
      await loadShopItems(profile)
    } finally {
      setMutating(false)
    }
  }

  const deactivateItem = async (shopItemId: number) => {
    if (!profile || profile.role !== 'PARENT') return

    try {
      setMutating(true)
      const { error } = await supabase.rpc('deactivate_shop_item', {
        p_shop_item_id: shopItemId,
      })
      if (error) throw error
      await loadShopItems(profile)
    } finally {
      setMutating(false)
    }
  }

  const purchaseItem = async (shopItemId: number) => {
    if (!profile || profile.role !== 'CHILD' || purchaseInFlightRef.current) return false

    const request =
      purchaseRetryRef.current?.shopItemId === shopItemId
        ? purchaseRetryRef.current
        : { shopItemId, idempotencyKey: createIdempotencyKey() }

    purchaseRetryRef.current = request
    purchaseInFlightRef.current = true

    try {
      setMutating(true)
      const { error } = await supabase.rpc('purchase_shop_item', {
        p_shop_item_id: shopItemId,
        p_idempotency_key: request.idempotencyKey,
      })
      if (error) throw error

      purchaseRetryRef.current = null
      await Promise.all([loadBalance(profile.id), loadPurchased(profile.id)])
      return true
    } finally {
      purchaseInFlightRef.current = false
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
    updateItem,
    deactivateItem,
    purchaseItem,
  }
}
