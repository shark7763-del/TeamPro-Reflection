import { questions } from '../data/questions'
import type { ReflectionRecord, ReflectionRole } from '../types/domain'

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

export const analyzeAnswers = (role: ReflectionRole, answers: number[]) => {
  const totalScore = answers.reduce((sum, item) => sum + item, 0)
  const max = Math.max(...answers)
  const min = Math.min(...answers)
  const bestIndex = answers.findIndex((score) => score === max)
  const improvementIndex = answers.findIndex((score) => score === min)

  return {
    totalScore,
    bestItem: questions[role][bestIndex],
    improvementItem: questions[role][improvementIndex],
  }
}

export const getPreviousRecord = (records: ReflectionRecord[], studentId: string, role?: ReflectionRole, before?: string) => {
  return records
    .filter((record) => record.studentId === studentId && (!role || record.role === role) && (!before || record.createdAt < before))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

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
