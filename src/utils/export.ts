import { roleLabels } from '../data/questions'
import type { TeamProData } from '../types/domain'
import { formatDate } from './score'

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
    ['日期', '姓名', '年級', '角色', '分數', '做得最好', '需要改進', '下一次行動目標', '輪次'],
    ...data.records.map((record) => {
      const student = data.students.find((item) => item.id === record.studentId)
      const round = data.rounds.find((item) => item.id === record.roundId)
      return [
        formatDate(record.createdAt),
        student?.name ?? '已刪除學生',
        student?.grade ?? '',
        roleLabels[record.role],
        record.totalScore,
        record.bestReflection,
        record.improvementReflection,
        record.nextAction,
        round?.title ?? '',
      ]
    }),
  ]
  download('teampro-reflection-records.csv', rows.map((row) => row.map(csvCell).join(',')).join('\n'), 'text/csv;charset=utf-8')
}
