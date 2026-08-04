export type Grade = '七年級' | '八年級' | '九年級' | '其他'

export type ReflectionRole = 'senior' | 'junior'

export type ReflectionCategory =
  | 'role_model'
  | 'care_and_leadership'
  | 'team_respect'
  | 'respect_and_learning'
  | 'self_discipline'
  | 'teamwork'

export type PreviousActionStatus = 'completed' | 'partial' | 'not_completed' | 'first_time'

export type ImpactTarget = 'self' | 'teammate' | 'team' | 'no_obvious_impact'

export interface Student {
  id: string
  name: string
  grade: Grade
  note: string
  createdAt: string
}

export interface ReflectionRound {
  id: string
  title: string
  startDate: string
  endDate?: string
  isActive: boolean
  teamGoal?: string
  createdAt: string
}

export interface CategoryScore {
  category: ReflectionCategory
  label: string
  score: number
  maxScore: number
}

export interface PeerRecognition {
  studentId: string
  reason: string
  sharedAt?: string
}

export interface ReflectionRecord {
  id: string
  studentId: string
  roundId?: string
  role: ReflectionRole
  answers: number[]
  totalScore: number
  bestItem: string
  improvementItem: string
  bestReflection?: string
  improvementReflection?: string
  categoryScores?: CategoryScore[]
  previousActionStatus?: PreviousActionStatus
  reflectionEvent?: string
  impactTarget?: ImpactTarget
  nextAction: string
  peerRecognition?: PeerRecognition
  createdAt: string
}

export interface AppSettings {
  teamName: string
  currentRoundId: string
  googleScriptUrl?: string
}

export interface TeamProData {
  version: 2
  students: Student[]
  rounds: ReflectionRound[]
  records: ReflectionRecord[]
  settings: AppSettings
}

export interface ReflectionDraft {
  id: string
  studentId: string
  role: ReflectionRole
  answers: number[]
  totalScore: number
  bestItem: string
  improvementItem: string
  categoryScores: CategoryScore[]
  previousActionStatus: PreviousActionStatus
  reflectionEvent: string
  impactTarget?: ImpactTarget
  nextAction: string
  peerRecognition?: PeerRecognition
  createdAt: string
}

export const GRADES: Grade[] = ['七年級', '八年級', '九年級', '其他']
