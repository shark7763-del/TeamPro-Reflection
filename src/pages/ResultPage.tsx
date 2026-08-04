import { CheckCircle2, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { nextActionOptions, roleLabels } from '../data/questions'
import { useTeamProData } from '../hooks/useTeamProData'
import { makeId } from '../services/storage'
import type { ReflectionDraft, ReflectionRecord } from '../types/domain'
import { formatDate, getPreviousRecord, getScoreMessage, scoreDeltaText } from '../utils/score'

export const ResultPage = () => {
  const { draftId } = useParams()
  const navigate = useNavigate()
  const { data, setData, activeRound } = useTeamProData()
  const [draft, setDraft] = useState<ReflectionDraft | null>(null)
  const [bestReflection, setBestReflection] = useState('')
  const [improvementReflection, setImprovementReflection] = useState('')
  const [actionPreset, setActionPreset] = useState(nextActionOptions[0])
  const [customAction, setCustomAction] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!draftId) return
    const raw = sessionStorage.getItem(draftId)
    if (raw) setDraft(JSON.parse(raw) as ReflectionDraft)
  }, [draftId])

  const student = draft ? data.students.find((item) => item.id === draft.studentId) : undefined
  const previous = draft ? getPreviousRecord(data.records, draft.studentId, draft.role) : undefined
  const message = draft ? getScoreMessage(draft.totalScore) : undefined
  const nextAction = actionPreset === '其他' ? customAction.trim() : actionPreset
  const delta = previous && draft ? draft.totalScore - previous.totalScore : undefined
  const duplicate = useMemo(
    () => !!draft && data.records.some((record) => record.studentId === draft.studentId && record.createdAt === draft.createdAt),
    [data.records, draft],
  )

  if (!draftId) return <Navigate to="/students/reflect" replace />
  if (!draft) {
    return (
      <Card>
        <p className="font-semibold text-team-navy">找不到本次反思草稿，請重新開始。</p>
      </Card>
    )
  }
  if (!student || !message) return <Navigate to="/students/reflect" replace />

  const save = () => {
    if (!nextAction) {
      setError('請填寫「下一次我要做到什麼」。')
      return
    }
    if (!activeRound) {
      setError('尚未建立反思輪次，請先到教練頁建立新一輪反思。')
      return
    }
    if (isSaving || duplicate) return
    setIsSaving(true)
    const record: ReflectionRecord = {
      id: makeId('record'),
      studentId: draft.studentId,
      roundId: activeRound.id,
      role: draft.role,
      answers: draft.answers,
      totalScore: draft.totalScore,
      bestItem: draft.bestItem,
      improvementItem: draft.improvementItem,
      bestReflection: bestReflection.trim(),
      improvementReflection: improvementReflection.trim(),
      nextAction,
      createdAt: draft.createdAt,
    }
    setData((current) => ({ ...current, records: [...current.records, record] }))
    sessionStorage.removeItem(draft.id)
    navigate(`/complete/${record.id}`, { replace: true })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Card className="p-5 sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold text-team-orange">{student.name} / {roleLabels[draft.role]} / {formatDate(draft.createdAt)}</p>
            <h1 className="mt-2 text-3xl font-black text-team-navy">{message.title}</h1>
            <p className="mt-3 leading-7 text-team-muted">{message.description}</p>
          </div>
          <div className="rounded-lg bg-team-navy px-6 py-5 text-center text-white">
            <p className="text-sm font-semibold text-orange-100">本次分數</p>
            <p className="mt-1 text-5xl font-black">{draft.totalScore}</p>
            <p className="text-sm font-semibold">/ 50 分</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-semibold text-team-muted">上次同角色分數</p>
            <p className="mt-2 text-2xl font-black text-team-navy">{previous ? `${previous.totalScore} 分` : '尚無'}</p>
            <p className="mt-1 text-sm font-semibold text-team-orange">{previous ? scoreDeltaText(delta) : '這是你的第一次反思，下一次就能比較自己的進步。'}</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-4">
            <p className="text-sm font-semibold text-team-muted">做得最好的地方</p>
            <p className="mt-2 font-bold leading-6 text-team-ink">{draft.bestItem}</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm font-semibold text-team-muted">最需要加強的地方</p>
            <p className="mt-2 font-bold leading-6 text-team-ink">{draft.improvementItem}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <Trophy className="text-team-orange" size={22} />
          <h2 className="text-xl font-black text-team-navy">完成簡短反思</h2>
        </div>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="font-semibold text-team-ink">我這次做得最好的是什麼？</span>
            <textarea value={bestReflection} onChange={(event) => setBestReflection(event.target.value)} rows={3} className="rounded-lg border border-slate-200 p-3 outline-none focus:border-team-blue focus:ring-4 focus:ring-blue-100" />
          </label>
          <label className="grid gap-2">
            <span className="font-semibold text-team-ink">我最需要改進的是什麼？</span>
            <textarea value={improvementReflection} onChange={(event) => setImprovementReflection(event.target.value)} rows={3} className="rounded-lg border border-slate-200 p-3 outline-none focus:border-team-blue focus:ring-4 focus:ring-blue-100" />
          </label>
          <div className="grid gap-2">
            <span className="font-semibold text-team-ink">下一次我要做到什麼？</span>
            <select value={actionPreset} onChange={(event) => setActionPreset(event.target.value)} className="min-h-12 rounded-lg border border-slate-200 bg-white p-3 outline-none focus:border-team-blue focus:ring-4 focus:ring-blue-100">
              {nextActionOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
            {actionPreset === '其他' && (
              <input value={customAction} onChange={(event) => setCustomAction(event.target.value)} placeholder="請輸入下一次行動目標" className="min-h-12 rounded-lg border border-slate-200 p-3 outline-none focus:border-team-blue focus:ring-4 focus:ring-blue-100" />
            )}
          </div>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          {duplicate && <p className="rounded-lg bg-orange-50 p-3 text-sm font-semibold text-team-navy">這筆紀錄已送出，請到個人成長頁查看。</p>}
          <Button type="button" disabled={isSaving || duplicate} onClick={save}>
            <CheckCircle2 size={18} />
            儲存紀錄
          </Button>
        </div>
      </Card>
    </div>
  )
}
