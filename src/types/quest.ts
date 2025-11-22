// src/types/quest.ts

export type UserRole = 'PARENT' | 'CHILD'

export type QuestStatus = 'REGISTERED' | 'REQUESTED' | 'COMPLETED'

export type Profile = {
  id: number
  role: UserRole
  nickname: string
}

export type Quest = {
  id: number
  title: string
  content: string | null
  reward: number
  status: QuestStatus
  created_at: string
  completed_at?: string | null
  // 필요한 경우: due_date?: string | null
}
