import type { Enums, Tables } from './database.types'

export type UserRole = Exclude<Enums<'user_role'>, 'DEFAULT'>

export type QuestStatus = Enums<'quest_status'>

type UserRow = Tables<'users'>

export type Profile = Pick<UserRow, 'id'> & {
  role: UserRole
  nickname: string
}

export type Quest = Tables<'quests'>
