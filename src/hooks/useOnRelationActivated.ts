// hooks/useOnRelationActivated.ts
import { supabase } from '@/src/services/supabaseClient'
import { useEffect, useRef } from 'react'

type Role = 'PARENT' | 'CHILD'

export function useOnRelationActivated(
  userId: number | null | undefined,
  role: Role,
  onActive: (p: { relationId: number }) => void,
  opts?: { relationId?: number }
) {
  const guard = useRef(false)

  useEffect(() => {
    if (!userId) return

    const filter = opts?.relationId
      ? `id=eq.${opts.relationId}`
      : `${role === 'PARENT' ? 'parent_id' : 'child_id'}=eq.${userId}`

    const channel = supabase
      .channel(`relations-active-${role}-${opts?.relationId ?? 'any'}-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'relations', filter },
        (payload) => {
          console.log('[RT] payload =', JSON.stringify(payload, null, 2))
          const next = (payload as unknown as { new: { id: number; status: string } }).new
          if (!guard.current && next?.status === 'ACTIVE') {
            // 네비 성공 후에만 guard 세우는 게 더 안전할 수 있음
            guard.current = true
            onActive({ relationId: next.id })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      // 필요 시 언마운트 시 guard 초기화
      guard.current = false
    }
  }, [userId, role, opts?.relationId, onActive])
}
