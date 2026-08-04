import { Database, Download, Plus, Search, Trash2, Upload, Users } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ButtonLink } from '../components/Button'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { useTeamProData } from '../hooks/useTeamProData'
import { pullFromGoogleSheet, pushToGoogleSheet } from '../services/googleSheetSync'
import { DEFAULT_GOOGLE_SCRIPT_URL, isValidGoogleScriptUrl, makeId, parseBackup } from '../services/storage'
import type { ReflectionRound } from '../types/domain'
import { average, calculateActionCompletionStats, calculateTeamQuestionAverages, formatDate } from '../utils/score'
import { exportJson, exportRecordsCsv } from '../utils/export'

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
    teamGoal: activeRound?.teamGoal ?? '',
  })
  const [clearText, setClearText] = useState('')
  const [message, setMessage] = useState('')
  const [scriptUrl, setScriptUrl] = useState(data.settings.googleScriptUrl ?? '')
  const fileRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const roundRecords = activeRound ? data.records.filter((record) => record.roundId === activeRound.id) : []
  const completedIds = new Set(roundRecords.map((record) => record.studentId))
  const notCompleted = data.students.filter((student) => !completedIds.has(student.id))
  const seniorScores = roundRecords.filter((record) => record.role === 'senior').map((record) => record.totalScore)
  const juniorScores = roundRecords.filter((record) => record.role === 'junior').map((record) => record.totalScore)
  const actionStats = calculateActionCompletionStats(roundRecords)
  const teamQuestionAverages = calculateTeamQuestionAverages(roundRecords)
  const recognitions = roundRecords.filter((record) => record.peerRecognition)
  const filteredStudents = useMemo(
    () => data.students.filter((student) => student.name.includes(query.trim()) || student.grade.includes(query.trim())),
    [data.students, query],
  )

  const createRound = () => {
    if (!roundForm.title.trim() || !roundForm.startDate) {
      setMessage('請填寫本輪反思名稱與開始日期。')
      return
    }
    const round: ReflectionRound = {
      id: makeId('round'),
      title: roundForm.title.trim(),
      startDate: roundForm.startDate,
      endDate: roundForm.endDate || undefined,
      isActive: true,
      teamGoal: roundForm.teamGoal.trim() || undefined,
      createdAt: new Date().toISOString(),
    }
    setData((current) => ({
      ...current,
      rounds: current.rounds.map((item) => ({ ...item, isActive: false })).concat(round),
      settings: { ...current.settings, currentRoundId: round.id },
    }))
    setMessage('已開始新一輪反思。')
  }

  const updateActiveRoundGoal = () => {
    if (!activeRound) return
    setData((current) => ({
      ...current,
      rounds: current.rounds.map((round) =>
        round.id === activeRound.id ? { ...round, teamGoal: roundForm.teamGoal.trim() || undefined } : round,
      ),
    }))
    setMessage('本輪團隊共同目標已更新。')
  }

  const importBackup = async (file?: File) => {
    if (!file) return
    try {
      setData(parseBackup(await file.text()))
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
    if (!isValidGoogleScriptUrl(scriptUrl)) {
      setScriptUrl(DEFAULT_GOOGLE_SCRIPT_URL)
      setData((current) => ({ ...current, settings: { ...current.settings, googleScriptUrl: DEFAULT_GOOGLE_SCRIPT_URL } }))
      setMessage('網址格式錯誤，已改回正確的 Web App URL。')
      return
    }
    setData((current) => ({ ...current, settings: { ...current.settings, googleScriptUrl: scriptUrl.trim() } }))
    setMessage('Google Sheet 同步網址已儲存到這台裝置。')
  }

  const pushCloud = async () => {
    const url = isValidGoogleScriptUrl(scriptUrl) ? scriptUrl.trim() : DEFAULT_GOOGLE_SCRIPT_URL
    const result = await pushToGoogleSheet(url, { ...data, settings: { ...data.settings, googleScriptUrl: url } })
    setMessage(result.message)
  }

  const pullCloud = async () => {
    const url = isValidGoogleScriptUrl(scriptUrl) ? scriptUrl.trim() : DEFAULT_GOOGLE_SCRIPT_URL
    const result = await pullFromGoogleSheet(url)
    if (!result.ok || !result.data) {
      setMessage(result.message)
      return
    }
    if (result.data.students.length === 0 && data.students.length > 0) {
      setMessage('Google Sheet 目前沒有學生名單，已保留本機資料。請先按「同步到 Google Sheet」。')
      return
    }
    setData({ ...result.data, settings: { ...result.data.settings, googleScriptUrl: url } })
    setMessage('已從 Google Sheet 更新共同後台資料。')
  }

  const toggleRecognitionShared = (recordId: string) => {
    setData((current) => ({
      ...current,
      records: current.records.map((record) => {
        if (record.id !== recordId || !record.peerRecognition) return record
        return {
          ...record,
          peerRecognition: {
            ...record.peerRecognition,
            sharedAt: record.peerRecognition.sharedAt ? undefined : new Date().toISOString(),
          },
        }
      }),
    }))
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
          <form className="mt-5 grid gap-3" onSubmit={(event) => { event.preventDefault(); unlockCoachPage() }}>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" inputMode="numeric" placeholder="輸入密碼" className="min-h-12 rounded-lg border border-slate-200 p-3 text-lg outline-none focus:border-team-blue focus:ring-4 focus:ring-blue-100" />
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
          <h1 className="mt-1 text-2xl font-black text-team-navy sm:text-3xl">教練管理</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ButtonLink to="/roster" variant="secondary"><Users size={18} />名單管理</ButtonLink>
          <Button type="button" variant="secondary" onClick={() => { sessionStorage.removeItem(COACH_AUTH_KEY); setIsAuthenticated(false) }}>鎖定後台</Button>
          <Button type="button" onClick={createRound}><Plus size={18} />開始新一輪反思</Button>
        </div>
      </div>
      {message && <p className="rounded-lg bg-blue-50 p-3 text-sm font-semibold text-team-navy">{message}</p>}

      <Card>
        <div className="grid gap-3 md:grid-cols-4">
          <input value={roundForm.title} onChange={(event) => setRoundForm({ ...roundForm, title: event.target.value })} className="min-h-12 rounded-lg border border-slate-200 p-3 md:col-span-2" placeholder="本輪反思名稱" />
          <input type="date" value={roundForm.startDate} onChange={(event) => setRoundForm({ ...roundForm, startDate: event.target.value })} className="min-h-12 rounded-lg border border-slate-200 p-3" />
          <input type="date" value={roundForm.endDate} onChange={(event) => setRoundForm({ ...roundForm, endDate: event.target.value })} className="min-h-12 rounded-lg border border-slate-200 p-3" />
          <input value={roundForm.teamGoal} onChange={(event) => setRoundForm({ ...roundForm, teamGoal: event.target.value })} className="min-h-12 rounded-lg border border-slate-200 p-3 md:col-span-3" placeholder="本輪團隊共同目標" />
          <Button type="button" variant="secondary" onClick={updateActiveRoundGoal}>更新目前目標</Button>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card>
          <h2 className="text-xl font-black text-team-navy">本輪完成狀況</h2>
          <p className="mt-3 font-bold text-team-ink">{activeRound?.title ?? '尚未設定'}</p>
          {activeRound?.teamGoal && <p className="mt-2 rounded-lg bg-orange-50 p-3 text-sm font-bold text-team-navy">團隊共同目標：{activeRound.teamGoal}</p>}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 p-4"><p className="text-sm text-team-muted">已完成</p><p className="text-3xl font-black text-team-navy">{completedIds.size}</p></div>
            <div className="rounded-lg bg-slate-50 p-4"><p className="text-sm text-team-muted">尚未完成</p><p className="text-3xl font-black text-team-navy">{notCompleted.length}</p></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {notCompleted.length ? notCompleted.map((student) => <span key={student.id} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-team-muted">{student.name}</span>) : <span className="text-sm text-team-muted">本輪全員已完成。</span>}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-black text-team-navy">團隊分數</h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-50 p-4"><p className="text-sm text-team-muted">團隊平均</p><p className="text-3xl font-black text-team-navy">{average(roundRecords.map((record) => record.totalScore)) || '-'}</p></div>
            <div className="rounded-lg bg-slate-50 p-4"><p className="text-sm text-team-muted">學長姐</p><p className="text-3xl font-black text-team-navy">{average(seniorScores) || '-'}</p></div>
            <div className="rounded-lg bg-slate-50 p-4"><p className="text-sm text-team-muted">學弟妹</p><p className="text-3xl font-black text-team-navy">{average(juniorScores) || '-'}</p></div>
          </div>
          <div className="mt-4 rounded-lg bg-blue-50 p-4">
            <p className="font-black text-team-navy">上次行動完成率：{actionStats.total ? `${actionStats.completionRate}%` : '尚無資料'}</p>
            <p className="mt-2 text-sm text-team-muted">做到了 {actionStats.completed} 人 / 做到一部分 {actionStats.partial} 人 / 還沒做到 {actionStats.notCompleted} 人</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-black text-team-navy">團隊最好的項目</h2>
          {teamQuestionAverages.best ? <p className="mt-3 leading-7"><b>{teamQuestionAverages.best.averageScore}分：</b>{teamQuestionAverages.best.text}</p> : <EmptyState title="尚無本輪資料" />}
        </Card>
        <Card>
          <h2 className="text-xl font-black text-team-navy">團隊最需要練習的項目</h2>
          {teamQuestionAverages.improvement ? <p className="mt-3 leading-7"><b>{teamQuestionAverages.improvement.averageScore}分：</b>{teamQuestionAverages.improvement.text}</p> : <EmptyState title="尚無本輪資料" />}
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-black text-team-navy">正向隊友肯定</h2>
        <div className="mt-4 grid gap-3">
          {recognitions.length === 0 ? <EmptyState title="本輪尚無隊友肯定" /> : recognitions.map((record) => {
            const from = data.students.find((student) => student.id === record.studentId)
            const to = data.students.find((student) => student.id === record.peerRecognition?.studentId)
            return (
              <div key={record.id} className="rounded-lg bg-slate-50 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-bold text-team-ink">{from?.name ?? '已刪除學生'} 肯定 {to?.name ?? '已刪除學生'}</p>
                  <label className="flex items-center gap-2 text-sm font-semibold text-team-muted">
                    <input type="checkbox" checked={!!record.peerRecognition?.sharedAt} onChange={() => toggleRecognitionShared(record.id)} />
                    已在團隊中分享
                  </label>
                </div>
                <p className="mt-2 text-sm leading-6 text-team-muted">{record.peerRecognition?.reason}</p>
                <p className="mt-1 text-xs text-team-muted">{formatDate(record.createdAt)}</p>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <Search size={20} className="text-team-orange" />
          <h2 className="text-xl font-black text-team-navy">學生搜尋與紀錄管理</h2>
        </div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋學生姓名或年級" className="mt-4 min-h-12 w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-team-blue focus:ring-4 focus:ring-blue-100" />
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <button key={student.id} type="button" onClick={() => navigate(`/coach/records/${student.id}`)} className="rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-team-blue">
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

      <Card>
        <h2 className="text-xl font-black text-team-navy">Google Sheet 共同後台</h2>
        <input value={scriptUrl} onChange={(event) => setScriptUrl(event.target.value)} placeholder="https://script.google.com/macros/s/...../exec" className="mt-4 min-h-12 w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-team-blue focus:ring-4 focus:ring-blue-100" />
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Button type="button" variant="secondary" onClick={saveScriptUrl}>儲存同步網址</Button>
          <Button type="button" variant="secondary" onClick={() => void pushCloud()}>同步到 Google Sheet</Button>
          <Button type="button" variant="secondary" onClick={() => void pullCloud()}>從 Google Sheet 讀取</Button>
        </div>
      </Card>
    </div>
  )
}
