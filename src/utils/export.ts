import { impactTargetLabels, previousActionStatusLabels, roleLabels } from '../data/questions'
import type { TeamProData } from '../types/domain'
import { formatDate, getRecordCategoryScores } from './score'

const download = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`

export const exportJson = (data: TeamProData) => {
  download(`teampro-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json')
}

export const exportStudentsCsv = (data: TeamProData) => {
  const rows = [['姓名', '年級', '備註'], ...data.students.map((student) => [student.name, student.grade, student.note])]
  download('teampro-students.csv', rows.map((row) => row.map(csvCell).join(',')).join('\n'), 'text/csv;charset=utf-8')
}

export const exportRecordsCsv = (data: TeamProData) => {
  const rows = [
    ['學生姓名', '年級', '角色', '總分', '各面向分數', '上次行動完成狀況', '發生了什麼', '影響對象', '下一次行動', '肯定隊友', '肯定原因', '反思日期', '反思輪次', '團隊目標'],
    ...data.records.map((record) => {
      const student = data.students.find((item) => item.id === record.studentId)
      const round = data.rounds.find((item) => item.id === record.roundId)
      const peer = record.peerRecognition ? data.students.find((item) => item.id === record.peerRecognition?.studentId) : undefined
      return [
        student?.name ?? '已刪除學生',
        student?.grade ?? '',
        roleLabels[record.role],
        record.totalScore,
        getRecordCategoryScores(record).map((item) => `${item.label}:${item.score}/${item.maxScore}`).join('；'),
        record.previousActionStatus ? previousActionStatusLabels[record.previousActionStatus] : '尚無資料',
        record.reflectionEvent ?? record.improvementReflection ?? '',
        record.impactTarget ? impactTargetLabels[record.impactTarget] : '尚無資料',
        record.nextAction,
        peer?.name ?? '',
        record.peerRecognition?.reason ?? '',
        formatDate(record.createdAt),
        round?.title ?? '',
        round?.teamGoal ?? '',
      ]
    }),
  ]
  download('teampro-reflection-records.csv', rows.map((row) => row.map(csvCell).join(',')).join('\n'), 'text/csv;charset=utf-8')
}
