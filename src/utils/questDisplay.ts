import type { Quest, QuestStatus, UserRole } from '@/src/types/quest'

export function getQuestStatusLabel(status: QuestStatus | null) {
  switch (status) {
    case 'REGISTERED':
      return '등록된 의뢰'
    case 'REQUESTED':
      return '완료 보고 도착'
    case 'REJECTED':
      return '재도전 가능'
    case 'COMPLETED':
      return '의뢰 완료'
    default:
      return '상태 확인 필요'
  }
}

export function getQuestStatusDescription(status: QuestStatus | null, role: UserRole) {
  if (role === 'PARENT') {
    switch (status) {
      case 'REGISTERED':
        return '용사의 완료 보고를 기다리는 등록된 의뢰예요.'
      case 'REQUESTED':
        return '완료 보고가 도착했어요. 승인 또는 보완 요청을 선택해 주세요.'
      case 'REJECTED':
        return '보완 요청을 보냈어요. 용사가 다시 완료 보고할 수 있어요.'
      case 'COMPLETED':
        return '보상 정산까지 끝난 의뢰예요.'
      default:
        return '퀘스트 상태를 확인해 주세요.'
    }
  }

  switch (status) {
    case 'REGISTERED':
      return '의뢰를 마쳤다면 부모님께 완료 보고를 보내세요.'
    case 'REQUESTED':
      return '완료 보고를 보냈어요. 부모님의 확인을 기다려요.'
    case 'REJECTED':
      return '보완한 뒤 다시 완료 보고를 보낼 수 있어요.'
    case 'COMPLETED':
      return '의뢰가 승인되어 보상을 받았어요.'
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
