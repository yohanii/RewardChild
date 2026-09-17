export type RelationState<T> =
  | { kind: 'NONE' }
  | { kind: 'SINGLE'; relation: T }
  | { kind: 'MULTIPLE' }

export function classifyRelations<T>(relations: readonly T[] | null | undefined): RelationState<T> {
  if (!relations || relations.length === 0) return { kind: 'NONE' }
  if (relations.length === 1) return { kind: 'SINGLE', relation: relations[0] }
  return { kind: 'MULTIPLE' }
}

