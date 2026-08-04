import type { ImpactTarget, PreviousActionStatus, ReflectionCategory, ReflectionRole } from '../types/domain'

export interface ReflectionQuestion {
  id: string
  role: ReflectionRole
  text: string
  category: ReflectionCategory
}

export const roleLabels: Record<ReflectionRole, string> = {
  senior: '學長姐',
  junior: '學弟妹',
}

export const roleDescriptions: Record<ReflectionRole, string> = {
  senior: '學長姐不是權力比較大，而是需要承擔更多責任。',
  junior: '學弟妹要學會尊重、主動學習，並對自己的事情負責。',
}

export const categoryLabels: Record<ReflectionCategory, string> = {
  role_model: '以身作則',
  care_and_leadership: '關心帶領',
  team_respect: '尊重團隊',
  respect_and_learning: '尊重學習',
  self_discipline: '自律負責',
  teamwork: '團隊合作',
}

export const roleCategories: Record<ReflectionRole, ReflectionCategory[]> = {
  senior: ['role_model', 'care_and_leadership', 'team_respect'],
  junior: ['respect_and_learning', 'self_discipline', 'teamwork'],
}

export const scoreDescriptions: Record<number, string> = {
  1: '我目前還沒有做到',
  2: '經常需要別人提醒',
  3: '有時做到，但還不穩定',
  4: '大部分時間能做到',
  5: '我能主動做到',
}

export const shortScoreLabels: Record<number, string> = {
  1: '還沒做到',
  2: '需要提醒',
  3: '有時做到',
  4: '大多做到',
  5: '主動做到',
}

export const previousActionStatusLabels: Record<PreviousActionStatus, string> = {
  completed: '我做到了',
  partial: '我做到一部分',
  not_completed: '我還沒做到',
  first_time: '第一次反思',
}

export const impactTargetLabels: Record<ImpactTarget, string> = {
  self: '主要影響自己',
  teammate: '影響一位隊友',
  team: '影響整個團隊',
  no_obvious_impact: '沒有明顯影響，但我仍想改進',
}

export const nextActionOptions = [
  '主動幫助一位學弟妹',
  '被提醒時先聽完再回答',
  '主動整理場地及器材',
  '訓練時不偷懶、不抱怨',
  '提醒別人時控制自己的語氣',
  '做好自己的事情，不增加別人的負擔',
  '主動詢問自己不懂的地方',
  '犯錯後立即調整改進',
  '其他',
]

export const seniorQuestions: ReflectionQuestion[] = [
  { id: 'senior-1', role: 'senior', text: '我能準時訓練，並遵守團隊規定。', category: 'role_model' },
  { id: 'senior-2', role: 'senior', text: '我會先做好自己，再要求學弟妹。', category: 'role_model' },
  { id: 'senior-3', role: 'senior', text: '我訓練時認真，不會因為自己是學長姐就偷懶。', category: 'role_model' },
  { id: 'senior-4', role: 'senior', text: '學弟妹不會時，我願意耐心教導。', category: 'care_and_leadership' },
  { id: 'senior-5', role: 'senior', text: '我提醒學弟妹時，不會嘲笑、辱罵或故意為難。', category: 'team_respect' },
  { id: 'senior-6', role: 'senior', text: '我會主動關心跟不上或需要幫助的學弟妹。', category: 'care_and_leadership' },
  { id: 'senior-7', role: 'senior', text: '團隊需要整理器材或場地時，我會主動幫忙。', category: 'team_respect' },
  { id: 'senior-8', role: 'senior', text: '學弟妹犯錯時，我會幫助他改進，而不是只責怪他。', category: 'care_and_leadership' },
  { id: 'senior-9', role: 'senior', text: '教練不在身邊時，我仍然能管理好自己。', category: 'role_model' },
  { id: 'senior-10', role: 'senior', text: '我的行為能成為學弟妹學習的榜樣。', category: 'team_respect' },
]

export const juniorQuestions: ReflectionQuestion[] = [
  { id: 'junior-1', role: 'junior', text: '我能準時到場，並準備好自己的訓練用品。', category: 'self_discipline' },
  { id: 'junior-2', role: 'junior', text: '我能尊重教練、學長姐及其他隊友。', category: 'respect_and_learning' },
  { id: 'junior-3', role: 'junior', text: '別人提醒我時，我會先聽完，不頂嘴、不擺臉色。', category: 'respect_and_learning' },
  { id: 'junior-4', role: 'junior', text: '我不懂時會主動詢問，不會假裝懂。', category: 'respect_and_learning' },
  { id: 'junior-5', role: 'junior', text: '被指出錯誤後，我願意重新練習並改進。', category: 'respect_and_learning' },
  { id: 'junior-6', role: 'junior', text: '我能保管好自己的物品，不把責任推給別人。', category: 'self_discipline' },
  { id: 'junior-7', role: 'junior', text: '我使用完器材後，會主動整理及歸位。', category: 'self_discipline' },
  { id: 'junior-8', role: 'junior', text: '訓練很累或做不好時，我不會輕易放棄。', category: 'self_discipline' },
  { id: 'junior-9', role: 'junior', text: '我願意配合團隊，不挑隊友、不排斥別人。', category: 'teamwork' },
  { id: 'junior-10', role: 'junior', text: '我會學習學長姐好的行為，讓自己慢慢進步。', category: 'teamwork' },
]

export const questions: Record<ReflectionRole, ReflectionQuestion[]> = {
  senior: seniorQuestions,
  junior: juniorQuestions,
}
