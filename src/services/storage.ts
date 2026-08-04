import { createDefaultStudents, createMissingDefaultStudents } from '../data/defaultStudents'
import type { AppSettings, ReflectionRecord, ReflectionRound, Student, TeamProData } from '../types/domain'
import { analyzeAnswers } from '../utils/score'

export const STORAGE_KEY = 'teampro-reflection-data'
export const DEFAULT_GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzIV6Dlpu1BoTbr0OIcANHvbVT1z9RBfOG5u2ATvjCI0XeNxWe5zBWFQTSW5jU7Ps_40Q/exec'

export const isValidGoogleScriptUrl = (url?: string) =>
  !!url && /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url.trim())

const today = () => new Date().toISOString().slice(0, 10)
const createId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const isString = (value: unknown): value is string => typeof value === 'string'
const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.length === 10 && value.every((item) => Number.isInteger(item) && item >= 1 && item <= 5)

export const createDefaultData = (): TeamProData => {
  const now = new Date().toISOString()
  const round: ReflectionRound = {
    id: createId('round'),
    title: `${new Date().getFullYear()}年${new Date().getMonth() + 1}月團隊反思`,
    startDate: today(),
    endDate: today(),
    isActive: true,
    teamGoal: '提醒別人時，先尊重，再指導。',
    createdAt: now,
  }

  return {
    version: 2,
    students: createDefaultStudents(now, createId),
    rounds: [round],
    records: [],
    settings: {
      teamName: 'TeamPro',
      currentRoundId: round.id,
      googleScriptUrl: DEFAULT_GOOGLE_SCRIPT_URL,
    },
  }
}

const migrateStudent = (value: unknown): Student | null => {
  if (!isRecord(value) || !isString(value.id) || !isString(value.name)) return null
  const grade = value.grade === '七年級' || value.grade === '八年級' || value.grade === '九年級' || value.grade === '其他'
    ? value.grade
    : '其他'
  return {
    id: value.id,
    name: value.name,
    grade,
    note: isString(value.note) ? value.note : '',
    createdAt: isString(value.createdAt) ? value.createdAt : new Date().toISOString(),
  }
}

const migrateRound = (value: unknown): ReflectionRound | null => {
  if (!isRecord(value) || !isString(value.id) || !isString(value.title)) return null
  return {
    id: value.id,
    title: value.title,
    startDate: isString(value.startDate) ? value.startDate : today(),
    endDate: isString(value.endDate) ? value.endDate : undefined,
    isActive: typeof value.isActive === 'boolean' ? value.isActive : false,
    teamGoal: isString(value.teamGoal) ? value.teamGoal : undefined,
    createdAt: isString(value.createdAt) ? value.createdAt : new Date().toISOString(),
  }
}

const migrateRecord = (value: unknown): ReflectionRecord | null => {
  if (!isRecord(value) || !isString(value.id) || !isString(value.studentId) || !isNumberArray(value.answers)) return null
  const role = value.role === 'senior' || value.role === 'junior' ? value.role : undefined
  if (!role) return null
  const analysis = analyzeAnswers(role, value.answers)
  const previousActionStatus =
    value.previousActionStatus === 'completed' ||
    value.previousActionStatus === 'partial' ||
    value.previousActionStatus === 'not_completed' ||
    value.previousActionStatus === 'first_time'
      ? value.previousActionStatus
      : undefined
  const impactTarget =
    value.impactTarget === 'self' ||
    value.impactTarget === 'teammate' ||
    value.impactTarget === 'team' ||
    value.impactTarget === 'no_obvious_impact'
      ? value.impactTarget
      : undefined
  const peerRecognition = isRecord(value.peerRecognition) && isString(value.peerRecognition.studentId) && isString(value.peerRecognition.reason)
    ? {
      studentId: value.peerRecognition.studentId,
      reason: value.peerRecognition.reason,
      sharedAt: isString(value.peerRecognition.sharedAt) ? value.peerRecognition.sharedAt : undefined,
    }
    : undefined
  return {
    id: value.id,
    studentId: value.studentId,
    roundId: isString(value.roundId) ? value.roundId : undefined,
    role,
    answers: value.answers,
    totalScore: Number.isInteger(value.totalScore) ? Number(value.totalScore) : analysis.totalScore,
    bestItem: isString(value.bestItem) ? value.bestItem : analysis.bestItem,
    improvementItem: isString(value.improvementItem) ? value.improvementItem : analysis.improvementItem,
    bestReflection: isString(value.bestReflection) ? value.bestReflection : undefined,
    improvementReflection: isString(value.improvementReflection) ? value.improvementReflection : undefined,
    categoryScores: Array.isArray(value.categoryScores) ? analysis.categoryScores : analysis.categoryScores,
    previousActionStatus,
    reflectionEvent: isString(value.reflectionEvent) ? value.reflectionEvent : undefined,
    impactTarget,
    nextAction: isString(value.nextAction) ? value.nextAction : '尚無資料',
    peerRecognition,
    createdAt: isString(value.createdAt) ? value.createdAt : new Date().toISOString(),
  }
}

export const migrateData = (value: unknown): TeamProData => {
  if (!isRecord(value)) throw new Error('資料格式不是物件。')
  const students = Array.isArray(value.students) ? value.students.map(migrateStudent).filter((item): item is Student => item !== null) : []
  const rounds = Array.isArray(value.rounds) ? value.rounds.map(migrateRound).filter((item): item is ReflectionRound => item !== null) : []
  const records = Array.isArray(value.records) ? value.records.map(migrateRecord).filter((item): item is ReflectionRecord => item !== null) : []
  if (!Array.isArray(value.students) || !Array.isArray(value.rounds) || !Array.isArray(value.records)) {
    throw new Error('缺少學生名單、反思輪次或反思紀錄。')
  }

  const now = new Date().toISOString()
  const nextRounds = rounds.length ? rounds : createDefaultData().rounds
  const activeRound = nextRounds.find((round) => round.isActive) ?? nextRounds[0]
  const settingsValue = isRecord(value.settings) ? value.settings : {}
  const missingDefaultStudents = createMissingDefaultStudents(new Set(students.map((student) => student.name)), now, createId)

  return {
    version: 2,
    students: [...students, ...missingDefaultStudents],
    rounds: nextRounds,
    records,
    settings: {
      teamName: isString(settingsValue.teamName) ? settingsValue.teamName : 'TeamPro',
      currentRoundId: isString(settingsValue.currentRoundId) ? settingsValue.currentRoundId : activeRound.id,
      googleScriptUrl: isValidGoogleScriptUrl(isString(settingsValue.googleScriptUrl) ? settingsValue.googleScriptUrl : undefined)
        ? String(settingsValue.googleScriptUrl)
        : DEFAULT_GOOGLE_SCRIPT_URL,
    },
  }
}

export const validateData = (value: unknown): value is TeamProData => {
  try {
    migrateData(value)
    return true
  } catch {
    return false
  }
}

export const loadData = (): TeamProData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const initial = createDefaultData()
      saveData(initial)
      return initial
    }
    const migrated = migrateData(JSON.parse(raw))
    saveData(migrated)
    return migrated
  } catch {
    const fallback = createDefaultData()
    saveData(fallback)
    return fallback
  }
}

export const saveData = (data: TeamProData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const parseBackup = (text: string): TeamProData => migrateData(JSON.parse(text))

export const makeId = createId

export const makeSettings = (currentRoundId: string): AppSettings => ({
  teamName: 'TeamPro',
  currentRoundId,
  googleScriptUrl: DEFAULT_GOOGLE_SCRIPT_URL,
})
