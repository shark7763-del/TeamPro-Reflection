import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { GRADES, type Student } from '../types/domain'
import { Card } from './Card'
import { EmptyState } from './EmptyState'
import { formatDate } from '../utils/score'
import type { ReflectionRecord } from '../types/domain'

interface StudentPickerProps {
  students: Student[]
  records: ReflectionRecord[]
  onSelect: (student: Student) => void
}

export const StudentPicker = ({ students, records, onSelect }: StudentPickerProps) => {
  const [query, setQuery] = useState('')
  const filtered = useMemo(
    () => students.filter((student) => student.name.includes(query.trim()) || student.grade.includes(query.trim())),
    [query, students],
  )

  const lastRecord = (studentId: string) =>
    records.filter((record) => record.studentId === studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

  return (
    <div className="space-y-5">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-3.5 text-slate-400" size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜尋姓名或年級"
          className="min-h-12 w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 outline-none focus:border-team-blue focus:ring-4 focus:ring-blue-100"
        />
      </label>

      {filtered.length === 0 ? (
        <EmptyState title="找不到學生" description="請確認姓名，或到名單管理新增學生。" />
      ) : (
        GRADES.map((grade) => {
          const group = filtered.filter((student) => student.grade === grade)
          if (group.length === 0) return null
          return (
            <section key={grade} className="space-y-3">
              <h2 className="text-sm font-black text-team-navy">{grade}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((student) => {
                  const latest = lastRecord(student.id)
                  return (
                    <button key={student.id} type="button" onClick={() => onSelect(student)} className="text-left">
                      <Card className="h-full transition hover:-translate-y-0.5 hover:border-team-blue hover:shadow-md">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-black text-team-ink">{student.name}</p>
                            <p className="mt-1 text-sm text-team-muted">{student.grade}</p>
                          </div>
                          <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-black text-team-orange">
                            {latest ? `${latest.totalScore}分` : '未填'}
                          </span>
                        </div>
                        <p className="mt-4 text-sm text-team-muted">最近一次：{latest ? formatDate(latest.createdAt) : '尚無紀錄'}</p>
                      </Card>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
