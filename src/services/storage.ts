import type { AppSettings, ReflectionRecord, ReflectionRound, Student, TeamProData } from '../types/domain'
import { createDefaultStudents, createMissingDefaultStudents } from '../data/defaultStudents'

export const STORAGE_KEY = 'teampro-reflection-data'
export const DEFAULT_GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzIV6Dlpu1BoTbr0OIcANHvbVT1z9RBfOG5u2ATvjCI0XeNxWe5zBWFQTSW5jU7Ps_40Q/exec'

const today = () => new Date().toISOString().slice(0, 10)

const createId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`

export const createDefaultData = (): TeamProData => {
  const now = new Date().toISOString()
  const round: ReflectionRound = {
    id: createId('round'),
    title: `${new Date().getFullYear()}年${new Date().getMonth() + 1}月團隊反思`,
    startDate: today(),
    endDate: today(),
    isActive: true,
    createdAt: now,
  }

  const students: Student[] = createDefaultStudents(now, createId)

  return {
    version: 1,
    students,
    rounds: [round],
    records: [],
    settings: {
      teamName: 'TeamPro',
      currentRoundId: round.id,
      googleScriptUrl: DEFAULT_GOOGLE_SCRIPT_URL,
    },
  }
}

const isString = (value: unknown): value is string => typeof value === 'string'
const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.length === 10 && value.every((item) => Number.isInteger(item) && item >= 1 && item <= 5)

export const validateData = (value: unknown): value is TeamProData => {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<TeamProData>
  return (
    data.version === 1 &&
    Array.isArray(data.students) &&
    Array.isArray(data.rounds) &&
    Array.isArray(data.records) &&
    !!data.settings &&
    typeof data.settings === 'object' &&
    isString(data.settings.teamName) &&
    isString(data.settings.currentRoundId) &&
    data.students.every((student) =>
      student &&
      typeof student === 'object' &&
      isString((student as Student).id) &&
      isString((student as Student).name) &&
      isString((student as Student).grade) &&
      isString((student as Student).createdAt),
    ) &&
    data.rounds.every((round) =>
      round &&
      typeof round === 'object' &&
      isString((round as ReflectionRound).id) &&
      isString((round as ReflectionRound).title) &&
      isString((round as ReflectionRound).startDate) &&
      isString((round as ReflectionRound).endDate) &&
      typeof (round as ReflectionRound).isActive === 'boolean',
    ) &&
    data.records.every((record) =>
      record &&
      typeof record === 'object' &&
      isString((record as ReflectionRecord).id) &&
      isString((record as ReflectionRecord).studentId) &&
      isString((record as ReflectionRecord).roundId) &&
      ((record as ReflectionRecord).role === 'senior' || (record as ReflectionRecord).role === 'junior') &&
      isNumberArray((record as ReflectionRecord).answers) &&
      Number.isInteger((record as ReflectionRecord).totalScore) &&
      isString((record as ReflectionRecord).createdAt),
    )
  )
}

export const loadData = (): TeamProData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const initial = createDefaultData()
      saveData(initial)
      return initial
    }
    const parsed: unknown = JSON.parse(raw)
    if (!validateData(parsed)) {
      throw new Error('資料格式不符合 TeamPro v1')
    }
    const missingDefaultStudents = createMissingDefaultStudents(
      new Set(parsed.students.map((student) => student.name)),
      new Date().toISOString(),
      createId,
    )
    const shouldSetGoogleScriptUrl = !parsed.settings.googleScriptUrl
    if (missingDefaultStudents.length === 0 && !shouldSetGoogleScriptUrl) return parsed
    const migrated = {
      ...parsed,
      students: [...parsed.students, ...missingDefaultStudents],
      settings: {
        ...parsed.settings,
        googleScriptUrl: parsed.settings.googleScriptUrl || DEFAULT_GOOGLE_SCRIPT_URL,
      },
    }
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

export const parseBackup = (text: string): TeamProData => {
  const parsed: unknown = JSON.parse(text)
  if (!validateData(parsed)) {
    throw new Error('備份檔格式錯誤，請確認包含學生名單、反思紀錄、反思輪次與系統設定。')
  }
  return parsed
}

export const makeId = createId

export const makeSettings = (currentRoundId: string): AppSettings => ({
  teamName: 'TeamPro',
  currentRoundId,
  googleScriptUrl: DEFAULT_GOOGLE_SCRIPT_URL,
})
