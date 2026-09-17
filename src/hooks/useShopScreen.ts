// src/hooks/useShopScreen.ts
import { supabase } from '@/src/services/supabaseClient'
import type { Enums, Tables } from '@/src/types/database.types'
import { classifyRelations } from '@/src/utils/relationState'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useRef, useState } from 'react'

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

export type ShopPurchase = Pick<
  Tables<'shop_purchases'>,
  | 'id'
  | 'child_id'
  | 'shop_item_id'
  | 'price_paid'
  | 'quantity'
  | 'status'
  | 'created_at'
  | 'fulfilled_at'
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
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mutating, setMutating] = useState(false)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [targetChildId, setTargetChildId] = useState<number | null>(null)
  const [targetRelationState, setTargetRelationState] = useState<'READY' | 'NONE' | 'MULTIPLE'>('NONE')

  const [balance, setBalance] = useState(0)
  const [items, setItems] = useState<ShopItem[]>([])
  const [purchases, setPurchases] = useState<ShopPurchase[]>([])
  const [childNames, setChildNames] = useState<Record<number, string>>({})
  const purchaseInFlightRef = useRef(false)
  const purchaseRetryRef = useRef<{ shopItemId: number; idempotencyKey: string } | null>(null)
  const hasLoadedRef = useRef(false)
  const reloadInFlightRef = useRef<Promise<void> | null>(null)

  const purchasedSet = useMemo(
    () => new Set(purchases.map((purchase) => purchase.shop_item_id)),
    [purchases],
  )

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

  const loadProfile = useCallback(async (): Promise<Profile> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) throw authError
    if (!user) {
      router.replace('/login')
      throw new Error('No auth user')
    }

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
  }, [])

  const resolveTargetChild = useCallback(async (
    p: Profile,
  ): Promise<{ kind: 'READY'; childId: number } | { kind: 'NONE' | 'MULTIPLE' }> => {
    const relationColumn = p.role === 'PARENT' ? 'parent_id' : 'child_id'
    const { data, error } = await supabase
      .from('relations')
      .select('parent_id, child_id')
      .eq(relationColumn, p.id)
      .eq('status', 'ACTIVE')
      .limit(2)

    if (error) {
      throw error
    }

    const relationState = classifyRelations(data)
    if (relationState.kind === 'NONE') return { kind: 'NONE' }
    if (p.role === 'CHILD') return { kind: 'READY', childId: p.id }
    if (relationState.kind === 'MULTIPLE') return { kind: 'MULTIPLE' }
    return {
      kind: 'READY',
      childId: relationState.relation.child_id,
    }
  }, [])

  const loadBalance = useCallback(async (userId: number) => {
    const { data, error } = await supabase
        .from('balances')
        .select('type, amount')
        .eq('user_id', userId)
        .in('type', ['ATTENDANCE', 'CASH'])

    if (error) throw error
    setBalance((data ?? []).reduce((sum, row) => sum + row.amount, 0))
  }, [])

  const loadShopItems = useCallback(async (p: Profile) => {
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
  }, [])

  const loadPurchases = useCallback(async (p: Profile) => {
    let query = supabase
      .from('shop_purchases')
      .select('id, child_id, shop_item_id, price_paid, quantity, status, created_at, fulfilled_at')

    if (p.role === 'CHILD') {
      query = query.eq('child_id', p.id)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    const rows = data ?? []
    setPurchases(rows)

    if (p.role !== 'PARENT') {
      setChildNames({})
      return
    }

    const childIds = [...new Set(rows.map((purchase) => purchase.child_id))]
    if (childIds.length === 0) {
      setChildNames({})
      return
    }

    const { data: familyProfiles, error: familyProfilesError } = await supabase
      .rpc('get_family_profiles', { p_user_ids: childIds })
    if (familyProfilesError) throw familyProfilesError

    setChildNames(Object.fromEntries(
      (familyProfiles ?? []).map((familyProfile) => [
        familyProfile.id,
        familyProfile.nickname ?? '이름 미설정 자녀',
      ]),
    ))
  }, [])

  const reload = useCallback((mode: 'focus' | 'refresh' | 'retry' = 'focus') => {
    if (reloadInFlightRef.current) {
      if (mode !== 'focus') setRefreshing(true)
      return reloadInFlightRef.current
    }

    if (mode !== 'focus') setRefreshing(true)
    if (!hasLoadedRef.current) setLoading(true)
    setError(null)

    const request = (async () => {
      const p = await loadProfile()
      setProfile(p)

      const target = await resolveTargetChild(p)
      const childId = target.kind === 'READY' ? target.childId : null
      setTargetChildId(childId)
      setTargetRelationState(target.kind)

      if (childId === null) setBalance(0)
      await Promise.all([
        childId === null ? Promise.resolve() : loadBalance(childId),
        loadShopItems(p),
        loadPurchases(p),
      ])
      hasLoadedRef.current = true
    })().catch((reloadError) => {
      console.warn('shop reload error', reloadError)
      setError('상점 정보를 불러오지 못했어요.')
    }).finally(() => {
      setLoading(false)
      setRefreshing(false)
      reloadInFlightRef.current = null
    })

    reloadInFlightRef.current = request
    return request
  }, [loadBalance, loadProfile, loadPurchases, loadShopItems, resolveTargetChild])

  useFocusEffect(
    useCallback(() => {
      void reload('focus')
    }, [reload]),
  )

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
      await Promise.all([loadBalance(profile.id), loadPurchases(profile)])
      return true
    } finally {
      purchaseInFlightRef.current = false
      setMutating(false)
    }
  }

  const fulfillPurchase = async (shopPurchaseId: number) => {
    if (!profile || profile.role !== 'PARENT') return

    try {
      setMutating(true)
      const { error } = await supabase.rpc('fulfill_shop_purchase', {
        p_shop_purchase_id: shopPurchaseId,
      })
      if (error) throw error
      await loadPurchases(profile)
    } finally {
      setMutating(false)
    }
  }

  return {
    profile,
    targetChildId,
    targetRelationState,
    balance,
    loading,
    refreshing,
    error,
    mutating,
    items,
    orderedItems,
    purchases,
    childNames,
    purchasedSet,
    reload,
    refresh: () => reload('refresh'),
    retry: () => reload('retry'),
    createItem,
    updateItem,
    deactivateItem,
    purchaseItem,
    fulfillPurchase,
  }
}
