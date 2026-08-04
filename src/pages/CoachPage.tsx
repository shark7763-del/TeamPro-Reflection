import { Database, Download, Plus, Search, Trash2, Upload } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { roleLabels } from '../data/questions'
import { useTeamProData } from '../hooks/useTeamProData'
import { pullFromGoogleSheet, pushToGoogleSheet } from '../services/googleSheetSync'
import { makeId, parseBackup } from '../services/storage'
import type { ReflectionRound } from '../types/domain'
import { average, formatDate } from '../utils/score'
import { exportJson, exportRecordsCsv } from '../utils/export'

const thisMonthPrefix = () => new Date().toISOString().slice(0, 7)
const today = () => new Date().toISOString().slice(0, 10)
const COACH_PASSWORD = '1234'
const COACH_AUTH_KEY = 'teampro-coach-unlocked'

export const CoachPage = () => {
  const { data, setData, activeRound } = useTeamProData()
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem(COACH_AUTH_KEY) === 'true')
  const [password, setPassword] = useState('')
  const [query, setQuery] = useState('')
  const [roundForm, setRoundForm] = useState({
    title: `${new Date().getFullYear()}年${new Date().getMonth() + 1}月團隊反思`,
    startDate: today(),
    endDate: today(),
  })
  const [clearText, setClearText] = useState('')
  const [message, setMessage] = useState('')
  const [scriptUrl, setScriptUrl] = useState(data.settings.googleScriptUrl ?? '')
  const fileRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const monthRecords = data.records.filter((record) => record.createdAt.startsWith(thisMonthPrefix()))
  const completedIds = new Set(monthRecords.map((record) => record.studentId))
  const notCompleted = data.students.filter((student) => !completedIds.has(student.id))
  const seniorScores = monthRecords.filter((record) => record.role === 'senior').map((record) => record.totalScore)
  const juniorScores = monthRecords.filter((record) => record.role === 'junior').map((record) => record.totalScore)
  const recent = [...data.records].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)
  const filteredStudents = useMemo(
    () => data.students.filter((student) => student.name.includes(query.trim()) || student.grade.includes(query.trim())),
    [data.students, query],
  )

  const createRound = () => {
    if (!roundForm.title.trim() || !roundForm.startDate || !roundForm.endDate) {
      setMessage('請完整填寫本輪反思名稱、開始日期與結束日期。')
      return
    }
    const round: ReflectionRound = {
      id: makeId('round'),
      title: roundForm.title.trim(),
      startDate: roundForm.startDate,
      endDate: roundForm.endDate,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    setData((current) => ({
      ...current,
      rounds: current.rounds.map((item) => ({ ...item, isActive: false })).concat(round),
      settings: { ...current.settings, currentRoundId: round.id },
    }))
    setMessage('已開始新一輪反思。')
  }

  const importBackup = async (file?: File) => {
    if (!file) return
    try {
      const text = await file.text()
      const backup = parseBackup(text)
      setData(backup)
      setMessage('備份資料已匯入。')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '匯入失敗，請確認檔案格式。')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const clearAll = () => {
    if (clearText !== '確認清除') {
      setMessage('請輸入「確認清除」才可以清除全部資料。')
      return
    }
    if (!confirm('確定清除全部資料嗎？此動作無法復原。')) return
    localStorage.removeItem('teampro-reflection-data')
    window.location.reload()
  }

  const saveScriptUrl = () => {
    setData((current) => ({
      ...current,
      settings: { ...current.settings, googleScriptUrl: scriptUrl.trim() },
    }))
    setMessage('Google Sheet 同步網址已儲存到這台裝置。')
  }

  const pushCloud = async () => {
    const url = scriptUrl.trim() || data.settings.googleScriptUrl || ''
    const result = await pushToGoogleSheet(url, { ...data, settings: { ...data.settings, googleScriptUrl: url } })
    setMessage(result.message)
  }

  const pullCloud = async () => {
    const url = scriptUrl.trim() || data.settings.googleScriptUrl || ''
    const result = await pullFromGoogleSheet(url)
    if (!result.ok || !result.data) {
      setMessage(result.message)
      return
    }
    setData({ ...result.data, settings: { ...result.data.settings, googleScriptUrl: url } })
    setMessage('已從 Google Sheet 更新共同後台資料。')
  }

  const unlockCoachPage = () => {
    if (password !== COACH_PASSWORD) {
      setMessage('密碼錯誤，請重新輸入。')
      return
    }
    sessionStorage.setItem(COACH_AUTH_KEY, 'true')
    setIsAuthenticated(true)
    setPassword('')
    setMessage('')
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md space-y-5">
        <div>
          <p className="text-sm font-bold text-team-orange">Coach</p>
          <h1 className="mt-1 text-2xl font-black text-team-navy sm:text-3xl">教練後台</h1>
        </div>
        <Card>
          <h2 className="text-xl font-black text-team-navy">請輸入教練密碼</h2>
          <p className="mt-2 text-sm leading-6 text-team-muted">此密碼只用來避免學生誤入後台。資料仍保存在目前這台裝置的瀏覽器。</p>
          <form
            className="mt-5 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              unlockCoachPage()
            }}
          >
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              placeholder="輸入密碼"
              className="min-h-12 rounded-lg border border-slate-200 p-3 text-lg outline-none focus:border-team-blue focus:ring-4 focus:ring-blue-100"
            />
            {message && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p>}
            <Button type="submit">進入教練後台</Button>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-team-orange">Coach</p>
          <h1 className="mt-1 text-2xl font-black text-team-navy sm:text-3xl">教練查看</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              sessionStorage.removeItem(COACH_AUTH_KEY)
              setIsAuthenticated(false)
            }}
          >
            鎖定後台
          </Button>
          <Button type="button" onClick={createRound}><Plus size={18} />開始新一輪反思</Button>
        </div>
      </div>
      {message && <p className="rounded-lg bg-blue-50 p-3 text-sm font-semibold text-team-navy">{message}</p>}

      <Card>
        <div className="flex items-center gap-2">
          <Database size={20} className="text-team-orange" />
          <h2 className="text-xl font-black text-team-navy">Google Sheet 共同後台</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-team-muted">
          貼上 Google Apps Script Web App URL 後，學生送出紀錄會同步寫入同一張 Google Sheet。尚未設定時，資料仍只存在本機。
        </p>
        <div className="mt-4 grid gap-2">
          <input
            value={scriptUrl}
            onChange={(event) => setScriptUrl(event.target.value)}
            placeholder="https://script.google.com/macros/s/...../exec"
            className="min-h-12 rounded-lg border border-slate-200 p-3 outline-none focus:border-team-blue focus:ring-4 focus:ring-blue-100"
          />
          <div className="grid gap-2 sm:grid-cols-3">
            <Button type="button" variant="secondary" onClick={saveScriptUrl}>儲存同步網址</Button>
            <Button type="button" variant="secondary" onClick={() => void pushCloud()}>同步到 Google Sheet</Button>
            <Button type="button" variant="secondary" onClick={() => void pullCloud()}>從 Google Sheet 讀取</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-3 md:grid-cols-4">
          <input value={roundForm.title} onChange={(event) => setRoundForm({ ...roundForm, title: event.target.value })} className="min-h-12 rounded-lg border border-slate-200 p-3 md:col-span-2" placeholder="本輪反思名稱" />
          <input type="date" value={roundForm.startDate} onChange={(event) => setRoundForm({ ...roundForm, startDate: event.target.value })} className="min-h-12 rounded-lg border border-slate-200 p-3" />
          <input type="date" value={roundForm.endDate} onChange={(event) => setRoundForm({ ...roundForm, endDate: event.target.value })} className="min-h-12 rounded-lg border border-slate-200 p-3" />
        </div>
        <p className="mt-3 text-sm text-team-muted">目前輪次：{activeRound?.title ?? '尚未設定'}</p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Card><p className="text-sm text-team-muted">全隊學生人數</p><p className="mt-1 text-3xl font-black text-team-navy">{data.students.length}</p></Card>
        <Card><p className="text-sm text-team-muted">本月已完成</p><p className="mt-1 text-3xl font-black text-team-navy">{completedIds.size}</p></Card>
        <Card><p className="text-sm text-team-muted">本月平均</p><p className="mt-1 text-3xl font-black text-team-navy">{average(monthRecords.map((record) => record.totalScore)) || '-'}</p></Card>
        <Card><p className="text-sm text-team-muted">學長姐平均</p><p className="mt-1 text-3xl font-black text-team-navy">{average(seniorScores) || '-'}</p></Card>
        <Card><p className="text-sm text-team-muted">學弟妹平均</p><p className="mt-1 text-3xl font-black text-team-navy">{average(juniorScores) || '-'}</p></Card>
        <Card><p className="text-sm text-team-muted">尚未完成</p><p className="mt-1 text-3xl font-black text-team-navy">{notCompleted.length}</p></Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="text-xl font-black text-team-navy">本月尚未完成名單</h2>
          {notCompleted.length === 0 ? (
            <div className="mt-4"><EmptyState title="本月全員已完成" /></div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {notCompleted.map((student) => <span key={student.id} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-team-muted">{student.name}</span>)}
            </div>
          )}
        </Card>
        <Card>
          <h2 className="text-xl font-black text-team-navy">最近反思紀錄</h2>
          <div className="mt-4 grid gap-2">
            {recent.length === 0 ? <EmptyState title="尚無反思紀錄" /> : recent.map((record) => {
              const student = data.students.find((item) => item.id === record.studentId)
              return (
                <button key={record.id} type="button" onClick={() => navigate(`/records/${record.studentId}`)} className="rounded-lg bg-slate-50 p-3 text-left transition hover:bg-orange-50">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-team-ink">{student?.name ?? '已刪除學生'} / {roleLabels[record.role]}</span>
                    <span className="font-black text-team-navy">{record.totalScore}分</span>
                  </div>
                  <p className="mt-1 text-sm text-team-muted">{formatDate(record.createdAt)}</p>
                </button>
              )
            })}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2">
          <Search size={20} className="text-team-orange" />
          <h2 className="text-xl font-black text-team-navy">學生搜尋</h2>
        </div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋學生姓名或年級" className="mt-4 min-h-12 w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-team-blue focus:ring-4 focus:ring-blue-100" />
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <button key={student.id} type="button" onClick={() => navigate(`/records/${student.id}`)} className="rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-team-blue">
              <p className="font-black text-team-navy">{student.name}</p>
              <p className="text-sm text-team-muted">{student.grade}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <Database size={20} className="text-team-orange" />
          <h2 className="text-xl font-black text-team-navy">資料匯出與備份</h2>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Button type="button" variant="secondary" onClick={() => exportJson(data)}><Download size={17} />匯出全部JSON</Button>
          <Button type="button" variant="secondary" onClick={() => exportRecordsCsv(data)}><Download size={17} />匯出CSV</Button>
          <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}><Upload size={17} />匯入JSON備份</Button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void importBackup(event.target.files?.[0])} />
        <div className="mt-5 rounded-lg bg-red-50 p-4">
          <p className="font-bold text-red-800">清除全部資料</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input value={clearText} onChange={(event) => setClearText(event.target.value)} placeholder="輸入：確認清除" className="min-h-12 rounded-lg border border-red-200 p-3 outline-none focus:ring-4 focus:ring-red-100" />
            <Button type="button" variant="danger" onClick={clearAll}><Trash2 size={17} />清除全部資料</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
