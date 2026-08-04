import { categoryLabels, questions, roleCategories } from '../data/questions'
import type { CategoryScore, PreviousActionStatus, ReflectionRecord, ReflectionRole } from '../types/domain'

export const calculateTotalScore = (answers: number[]) => answers.reduce((sum, item) => sum + item, 0)

export const calculateCategoryScores = (role: ReflectionRole, answers: number[]): CategoryScore[] => {
  return roleCategories[role].map((category) => {
    const indexes = questions[role].map((question, index) => ({ question, index })).filter((item) => item.question.category === category)
    const score = indexes.reduce((sum, item) => sum + (answers[item.index] ?? 0), 0)
    return {
      category,
      label: categoryLabels[category],
      score,
      maxScore: indexes.length * 5,
    }
  })
}

export const findHighestScoringQuestion = (role: ReflectionRole, answers: number[]) => {
  const max = Math.max(...answers)
  const index = answers.findIndex((score) => score === max)
  return questions[role][index]?.text ?? '尚無資料'
}

export const findLowestScoringQuestion = (role: ReflectionRole, answers: number[]) => {
  const min = Math.min(...answers)
  const index = answers.findIndex((score) => score === min)
  return questions[role][index]?.text ?? '尚無資料'
}

export const analyzeAnswers = (role: ReflectionRole, answers: number[]) => ({
  totalScore: calculateTotalScore(answers),
  categoryScores: calculateCategoryScores(role, answers),
  bestItem: findHighestScoringQuestion(role, answers),
  improvementItem: findLowestScoringQuestion(role, answers),
})

export const getScoreMessage = (score: number) => {
  if (score >= 45) {
    return {
      title: '團隊好榜樣',
      description: '你已經能主動做好自己的責任，也能對隊友產生正面的影響。',
    }
  }
  if (score >= 40) {
    return {
      title: '表現良好',
      description: '你大部分都能做到，繼續保持，並加強分數最低的項目。',
    }
  }
  if (score >= 35) {
    return {
      title: '持續成長',
      description: '你知道應該怎麼做，但有些行為還不夠穩定。',
    }
  }
  if (score >= 30) {
    return {
      title: '需要提醒',
      description: '你有幾個地方經常需要別人提醒，請選擇一項開始改變。',
    }
  }
  return {
    title: '重新開始',
    description: '分數不是處罰，請誠實看見問題，從一個小行動開始改進。',
  }
}

export const getPreviousRecord = (records: ReflectionRecord[], studentId: string, role?: ReflectionRole, before?: string) => {
  return records
    .filter((record) => record.studentId === studentId && (!role || record.role === role) && (!before || record.createdAt < before))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

export const calculateScoreDifference = (currentScore: number, previousScore?: number) =>
  previousScore === undefined ? undefined : currentScore - previousScore

export const formatDate = (value?: string) => {
  if (!value) return '尚無紀錄'
  return new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value))
}

export const scoreDeltaText = (delta?: number) => {
  if (delta === undefined) return '第一次反思'
  if (delta > 0) return `進步 ${delta} 分`
  if (delta < 0) return `退步 ${Math.abs(delta)} 分`
  return '與上次相同'
}

export const average = (scores: number[]) => {
  if (scores.length === 0) return 0
  return Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
}

export const getRecordCategoryScores = (record: ReflectionRecord): CategoryScore[] =>
  record.categoryScores?.length ? record.categoryScores : calculateCategoryScores(record.role, record.answers)

export const calculateActionCompletionStats = (records: ReflectionRecord[]) => {
  const eligible = records.filter((record) => record.previousActionStatus && record.previousActionStatus !== 'first_time')
  const count = (status: PreviousActionStatus) => eligible.filter((record) => record.previousActionStatus === status).length
  const completed = count('completed')
  return {
    total: eligible.length,
    completed,
    partial: count('partial'),
    notCompleted: count('not_completed'),
    completionRate: eligible.length ? Math.round((completed / eligible.length) * 100) : 0,
  }
}

export const calculateTeamQuestionAverages = (records: ReflectionRecord[]) => {
  const buckets = new Map<string, { text: string; total: number; count: number }>()
  records.forEach((record) => {
    questions[record.role].forEach((question, index) => {
      const key = `${record.role}-${index}`
      const item = buckets.get(key) ?? { text: question.text, total: 0, count: 0 }
      item.total += record.answers[index] ?? 0
      item.count += 1
      buckets.set(key, item)
    })
  })

  const averages = [...buckets.values()]
    .filter((item) => item.count > 0)
    .map((item) => ({
      text: item.text,
      averageScore: Math.round((item.total / item.count) * 10) / 10,
    }))

  return {
    best: averages.sort((a, b) => b.averageScore - a.averageScore)[0],
    improvement: averages.sort((a, b) => a.averageScore - b.averageScore)[0],
  }
}

export const isMeaningfulText = (value: string, minLength: number) => {
  const trimmed = value.trim()
  const lettersAndNumbers = trimmed.replace(/[^\p{L}\p{N}]/gu, '')
  return trimmed.length >= minLength && lettersAndNumbers.length > 0
}
