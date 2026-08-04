import { Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { impactTargetLabels, previousActionStatusLabels, roleLabels } from '../data/questions'
import { useTeamProData } from '../hooks/useTeamProData'
import type { ReflectionRole } from '../types/domain'
import { formatDate, getRecordCategoryScores, scoreDeltaText, getPreviousRecord } from '../utils/score'

type Filter = 'all' | ReflectionRole

export const RecordsPage = ({ coachMode = false }: { coachMode?: boolean }) => {
  const { studentId } = useParams()
  const { data, setData } = useTeamProData()
  const [filter, setFilter] = useState<Filter>('all')
  const student = data.students.find((item) => item.id === studentId)

  const records = useMemo(() => {
    return data.records
      .filter((record) => record.studentId === studentId && (filter === 'all' || record.role === filter))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }, [data.records, filter, studentId])

  if (!studentId || !student) return <Navigate to={coachMode ? '/coach' : '/students/records'} replace />

  const latest = records.at(-1)
  const deleteRecord = (id: string) => {
    if (!confirm('確定要刪除這筆反思紀錄嗎？')) return
    setData((current) => ({ ...current, records: current.records.filter((record) => record.id !== id) }))
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold text-team-orange">{student.grade}</p>
        <h1 className="mt-1 text-2xl font-black text-team-navy sm:text-3xl">{student.name} 的成長紀錄</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card><p className="text-sm text-team-muted">累積反思次數</p><p className="mt-1 text-3xl font-black text-team-navy">{records.length}</p></Card>
        <Card><p className="text-sm text-team-muted">最近一次分數</p><p className="mt-1 text-3xl font-black text-team-navy">{latest ? latest.totalScore : '-'}</p></Card>
        <Card><p className="text-sm text-team-muted">上一次行動</p><p className="mt-1 font-bold text-team-navy">{latest?.previousActionStatus ? previousActionStatusLabels[latest.previousActionStatus] : '尚無資料'}</p></Card>
        <Card><p className="text-sm text-team-muted">最近下一步</p><p className="mt-1 font-bold leading-6 text-team-ink">{latest?.nextAction ?? '尚無紀錄'}</p></Card>
        <Card>
          <p className="text-sm text-team-muted">三個面向最近分數</p>
          <div className="mt-2 grid gap-1 text-sm font-semibold text-team-navy">
            {latest ? getRecordCategoryScores(latest).map((item) => <span key={item.category}>{item.label}：{item.score}/{item.maxScore}</span>) : '尚無資料'}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-black text-team-navy">個人成長折線圖</h2>
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-100 p-1">
            {[
              ['all', '全部'],
              ['senior', '學長姐'],
              ['junior', '學弟妹'],
            ].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setFilter(value as Filter)} className={`min-h-10 rounded-md px-3 text-sm font-bold ${filter === value ? 'bg-white text-team-navy shadow-sm' : 'text-team-muted'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {records.length === 0 ? (
          <div className="mt-5"><EmptyState title="還沒有歷史紀錄" description="完成反思後，這裡會顯示分數變化。" /></div>
        ) : (
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={records.map((record, index) => ({ name: `${index + 1}`, score: record.totalScore }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 50]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#f28c28" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid gap-3">
        {[...records].reverse().map((record) => {
          const previous = getPreviousRecord(data.records, record.studentId, record.role, record.createdAt)
          const delta = previous ? record.totalScore - previous.totalScore : undefined
          return (
            <Card key={record.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-team-orange">{formatDate(record.createdAt)} / {roleLabels[record.role]}</p>
                  <h3 className="mt-1 text-2xl font-black text-team-navy">{record.totalScore} / 50 分</h3>
                  <p className="mt-1 text-sm font-semibold text-team-muted">{scoreDeltaText(delta)}</p>
                </div>
                {coachMode && <Button type="button" variant="ghost" onClick={() => deleteRecord(record.id)}><Trash2 size={17} />刪除</Button>}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {getRecordCategoryScores(record).map((item) => (
                  <p key={item.category} className="rounded-lg bg-slate-50 p-3 text-sm leading-6"><b>{item.label}：</b>{item.score}/{item.maxScore}</p>
                ))}
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <p className="rounded-lg bg-slate-50 p-3 text-sm leading-6"><b>上次行動：</b>{record.previousActionStatus ? previousActionStatusLabels[record.previousActionStatus] : '尚無資料'}</p>
                <p className="rounded-lg bg-slate-50 p-3 text-sm leading-6"><b>影響對象：</b>{record.impactTarget ? impactTargetLabels[record.impactTarget] : '尚無資料'}</p>
                <p className="rounded-lg bg-blue-50 p-3 text-sm leading-6"><b>發生了什麼：</b>{record.reflectionEvent || record.improvementReflection || '尚無資料'}</p>
                <p className="rounded-lg bg-orange-50 p-3 text-sm leading-6"><b>下一次：</b>{record.nextAction}</p>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
