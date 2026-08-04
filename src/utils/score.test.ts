import { describe, expect, it } from 'vitest'
import { questions } from '../data/questions'
import { migrateData } from '../services/storage'
import type { ReflectionRecord } from '../types/domain'
import {
  calculateCategoryScores,
  calculateTotalScore,
  findHighestScoringQuestion,
  findLowestScoringQuestion,
  getPreviousRecord,
} from './score'

describe('score utilities', () => {
  it('calculates 50 points when all answers are 5', () => {
    expect(calculateTotalScore(Array(10).fill(5))).toBe(50)
  })

  it('calculates 10 points when all answers are 1', () => {
    expect(calculateTotalScore(Array(10).fill(1))).toBe(10)
  })

  it('calculates category max scores by role', () => {
    expect(calculateCategoryScores('senior', Array(10).fill(5)).map((item) => item.maxScore)).toEqual([20, 15, 15])
    expect(calculateCategoryScores('junior', Array(10).fill(5)).map((item) => item.maxScore)).toEqual([20, 20, 10])
  })

  it('returns undefined safely when there is no previous record', () => {
    expect(getPreviousRecord([], 'student-1', 'senior')).toBeUndefined()
  })

  it('uses the first matching question when scores tie', () => {
    const answers = [3, 5, 5, 2, 2, 4, 4, 3, 3, 1]
    expect(findHighestScoringQuestion('senior', answers)).toBe(questions.senior[1].text)
    expect(findLowestScoringQuestion('senior', answers)).toBe(questions.senior[9].text)
  })

  it('migrates old records without new fields', () => {
    const oldData = {
      version: 1,
      students: [{ id: 'student-1', name: '測試學生', grade: '八年級', note: '', createdAt: '2026-08-01T00:00:00.000Z' }],
      rounds: [{ id: 'round-1', title: '舊輪次', startDate: '2026-08-01', endDate: '2026-08-31', isActive: true, createdAt: '2026-08-01T00:00:00.000Z' }],
      records: [{
        id: 'record-1',
        studentId: 'student-1',
        roundId: 'round-1',
        role: 'junior',
        answers: Array(10).fill(4),
        totalScore: 40,
        bestItem: '',
        improvementItem: '',
        bestReflection: '',
        improvementReflection: '',
        nextAction: '下次更主動',
        createdAt: '2026-08-02T00:00:00.000Z',
      } satisfies ReflectionRecord],
      settings: { teamName: 'TeamPro', currentRoundId: 'round-1' },
    }
    const migrated = migrateData(oldData)
    expect(migrated.version).toBe(2)
    expect(migrated.records[0].categoryScores?.length).toBe(3)
    expect(migrated.records[0].reflectionEvent).toBeUndefined()
  })
})
