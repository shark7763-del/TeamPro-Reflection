import { Download, Plus, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { useTeamProData } from '../hooks/useTeamProData'
import { parseBackup, makeId } from '../services/storage'
import { GRADES, type Grade, type Student } from '../types/domain'
import { exportJson, exportStudentsCsv } from '../utils/export'

const emptyForm = { name: '', grade: '七年級' as Grade, note: '' }

export const RosterPage = () => {
  const { data, setData } = useTeamProData()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [batch, setBatch] = useState('')
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const submit = () => {
    if (!form.name.trim()) {
      setMessage('請輸入學生姓名。')
      return
    }
    if (editingId) {
      setData((current) => ({
        ...current,
        students: current.students.map((student) =>
          student.id === editingId ? { ...student, name: form.name.trim(), grade: form.grade, note: form.note.trim() } : student,
        ),
      }))
      setEditingId(null)
    } else {
      const student: Student = { id: makeId('student'), name: form.name.trim(), grade: form.grade, note: form.note.trim(), createdAt: new Date().toISOString() }
      setData((current) => ({ ...current, students: [...current.students, student] }))
    }
    setForm(emptyForm)
    setMessage('名單已更新。')
  }

  const edit = (student: Student) => {
    setEditingId(student.id)
    setForm({ name: student.name, grade: student.grade, note: student.note })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const remove = (student: Student) => {
    const count = data.records.filter((record) => record.studentId === student.id).length
    if (!confirm(`確定刪除 ${student.name} 嗎？其 ${count} 筆歷史紀錄也會一併刪除。`)) return
    setData((current) => ({
      ...current,
      students: current.students.filter((item) => item.id !== student.id),
      records: current.records.filter((record) => record.studentId !== student.id),
    }))
  }

  const addBatch = () => {
    const rows = batch.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    const students: Student[] = []
    for (const row of rows) {
      const [name, gradeRaw = '其他'] = row.split(',').map((item) => item.trim())
      const grade = GRADES.includes(gradeRaw as Grade) ? (gradeRaw as Grade) : '其他'
      if (name) students.push({ id: makeId('student'), name, grade, note: '', createdAt: new Date().toISOString() })
    }
    if (students.length === 0) {
      setMessage('批次名單格式錯誤，請使用：姓名,年級')
      return
    }
    setData((current) => ({ ...current, students: [...current.students, ...students] }))
    setBatch('')
    setMessage(`已新增 ${students.length} 位學生。`)
  }

  const importFile = async (file?: File) => {
    if (!file) return
    try {
      const text = await file.text()
      if (file.name.endsWith('.json')) {
        setData(parseBackup(text))
        setMessage('JSON 備份已匯入。')
        return
      }
      const imported = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((row) => {
        const [name, gradeRaw = '其他', note = ''] = row.split(',').map((item) => item.replaceAll('"', '').trim())
        const grade = GRADES.includes(gradeRaw as Grade) ? (gradeRaw as Grade) : '其他'
        return name ? { id: makeId('student'), name, grade, note, createdAt: new Date().toISOString() } : null
      }).filter((student): student is Student => student !== null)
      if (!imported.length) throw new Error('找不到可匯入的學生資料。')
      setData((current) => ({ ...current, students: [...current.students, ...imported] }))
      setMessage(`已匯入 ${imported.length} 位學生。`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '匯入失敗。')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const clearDemo = () => {
    setData((current) => ({
      ...current,
      students: current.students.filter((student) => student.note !== '示範資料'),
      records: current.records.filter((record) => {
        const student = current.students.find((item) => item.id === record.studentId)
        return student?.note !== '示範資料'
      }),
    }))
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold text-team-orange">Roster</p>
        <h1 className="mt-1 text-2xl font-black text-team-navy sm:text-3xl">名單管理</h1>
      </div>
      {message && <p className="rounded-lg bg-blue-50 p-3 text-sm font-semibold text-team-navy">{message}</p>}
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <h2 className="text-xl font-black text-team-navy">{editingId ? '修改學生' : '新增學生'}</h2>
          <div className="mt-4 grid gap-3">
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="姓名" className="min-h-12 rounded-lg border border-slate-200 p-3 outline-none focus:border-team-blue focus:ring-4 focus:ring-blue-100" />
            <select value={form.grade} onChange={(event) => setForm({ ...form, grade: event.target.value as Grade })} className="min-h-12 rounded-lg border border-slate-200 bg-white p-3">
              {GRADES.map((grade) => <option key={grade}>{grade}</option>)}
            </select>
            <input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="備註，選填" className="min-h-12 rounded-lg border border-slate-200 p-3" />
            <Button type="button" onClick={submit}><Plus size={18} />{editingId ? '儲存修改' : '新增學生'}</Button>
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-black text-team-navy">批次與備份</h2>
          <textarea value={batch} onChange={(event) => setBatch(event.target.value)} rows={5} placeholder={'王小明,七年級\n陳小華,八年級\n林小安,九年級'} className="mt-4 w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-team-blue focus:ring-4 focus:ring-blue-100" />
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button type="button" variant="secondary" onClick={addBatch}>批次貼上新增</Button>
            <Button type="button" variant="secondary" onClick={() => exportStudentsCsv(data)}><Download size={17} />匯出名單</Button>
            <Button type="button" variant="secondary" onClick={() => exportJson(data)}><Download size={17} />匯出JSON</Button>
            <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}><Upload size={17} />匯入名單</Button>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.json,text/csv,application/json" className="hidden" onChange={(event) => void importFile(event.target.files?.[0])} />
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="ghost" onClick={clearDemo}>清除示範資料</Button>
      </div>

      {data.students.length === 0 ? (
        <EmptyState title="目前沒有學生" description="請新增或批次貼上學生名單。" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.students.map((student) => (
            <Card key={student.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-team-navy">{student.name}</p>
                  <p className="text-sm text-team-muted">{student.grade}{student.note ? ` / ${student.note}` : ''}</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => edit(student)}>修改</Button>
                  <Button type="button" variant="danger" onClick={() => remove(student)}><Trash2 size={17} />刪除</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
