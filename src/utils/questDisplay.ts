import type { Quest, QuestStatus, UserRole } from '@/src/types/quest'

export function getQuestStatusLabel(status: QuestStatus | null) {
  switch (status) {
    case 'REGISTERED':
      return '진행 중'
    case 'REQUESTED':
      return '완료 확인 요청'
    case 'REJECTED':
      return '다시 요청 가능'
    case 'COMPLETED':
      return '완료'
    default:
      return '상태 확인 필요'
  }
}

export function getQuestStatusDescription(status: QuestStatus | null, role: UserRole) {
  if (role === 'PARENT') {
    switch (status) {
      case 'REGISTERED':
        return '자녀의 완료 요청을 기다리고 있어요.'
      case 'REQUESTED':
        return '완료 여부를 확인해 주세요.'
      case 'REJECTED':
        return '자녀가 다시 완료를 요청할 수 있어요.'
      case 'COMPLETED':
        return '보상 지급이 완료됐어요.'
      default:
        return '퀘스트 상태를 확인해 주세요.'
    }
  }

  switch (status) {
    case 'REGISTERED':
      return '완료한 뒤 부모님께 확인을 요청해 주세요.'
    case 'REQUESTED':
      return '부모님의 확인을 기다리고 있어요.'
    case 'REJECTED':
      return '다시 완료한 뒤 확인을 요청할 수 있어요.'
    case 'COMPLETED':
      return '보상을 받았어요.'
    default:
      return '퀘스트 상태를 확인해 주세요.'
  }
}

export function getQuestDateLabel(quest: Quest) {
  const value = quest.status === 'COMPLETED' ? quest.completed_at : quest.created_at
  if (!value) return quest.status === 'COMPLETED' ? '완료일 없음' : '등록일 없음'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '날짜 정보 없음'

  const label = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  return `${quest.status === 'COMPLETED' ? '완료' : '등록'} ${label}`
}
