export type Grade = '七年級' | '八年級' | '九年級' | '其他'

export type ReflectionRole = 'senior' | 'junior'

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
  endDate: string
  isActive: boolean
  createdAt: string
}

export interface ReflectionRecord {
  id: string
  studentId: string
  roundId: string
  role: ReflectionRole
  answers: number[]
  totalScore: number
  bestItem: string
  improvementItem: string
  bestReflection: string
  improvementReflection: string
  nextAction: string
  createdAt: string
}

export interface AppSettings {
  teamName: string
  currentRoundId: string
}

export interface TeamProData {
  version: 1
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
  createdAt: string
}

export const GRADES: Grade[] = ['七年級', '八年級', '九年級', '其他']
