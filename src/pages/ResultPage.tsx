import { CheckCircle2, HeartHandshake } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { impactTargetLabels, nextActionOptions, roleLabels } from '../data/questions'
import { useTeamProData } from '../hooks/useTeamProData'
import { pushToGoogleSheet } from '../services/googleSheetSync'
import { makeId } from '../services/storage'
import type { ImpactTarget, PeerRecognition, ReflectionDraft, ReflectionRecord } from '../types/domain'
import { calculateScoreDifference, formatDate, getPreviousRecord, getScoreMessage, isMeaningfulText, scoreDeltaText } from '../utils/score'

const impactOptions: ImpactTarget[] = ['self', 'teammate', 'team', 'no_obvious_impact']

export const ResultPage = () => {
  const { draftId } = useParams()
  const navigate = useNavigate()
  const { data, setData, activeRound } = useTeamProData()
  const [draft, setDraft] = useState<ReflectionDraft | null>(null)
  const [reflectionEvent, setReflectionEvent] = useState('')
  const [impactTarget, setImpactTarget] = useState<ImpactTarget | undefined>()
  const [actionPreset, setActionPreset] = useState('')
  const [customAction, setCustomAction] = useState('')
  const [recognizePeer, setRecognizePeer] = useState<'yes' | 'skip'>('skip')
  const [peerStudentId, setPeerStudentId] = useState('')
  const [peerReason, setPeerReason] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!draftId) return
    const raw = sessionStorage.getItem(draftId)
    if (raw) {
      const parsed = JSON.parse(raw) as ReflectionDraft
      setDraft(parsed)
      setReflectionEvent(parsed.reflectionEvent ?? '')
      setImpactTarget(parsed.impactTarget)
      setActionPreset(parsed.nextAction && nextActionOptions.includes(parsed.nextAction) ? parsed.nextAction : '')
      setCustomAction(parsed.nextAction && !nextActionOptions.includes(parsed.nextAction) ? parsed.nextAction : '')
    }
  }, [draftId])

  const student = draft ? data.students.find((item) => item.id === draft.studentId) : undefined
  const previous = draft ? getPreviousRecord(data.records, draft.studentId, draft.role) : undefined
  const message = draft ? getScoreMessage(draft.totalScore) : undefined
  const nextAction = actionPreset === '其他' ? customAction.trim() : actionPreset
  const delta = previous && draft ? calculateScoreDifference(draft.totalScore, previous.totalScore) : undefined
  const duplicate = useMemo(
    () => !!draft && data.records.some((record) => record.studentId === draft.studentId && record.createdAt === draft.createdAt),
    [data.records, draft],
  )
  const peers = data.students.filter((item) => item.id !== draft?.studentId)

  if (!draftId) return <Navigate to="/students/reflect" replace />
  if (!draft) {
    return (
      <Card>
        <p className="font-semibold text-team-navy">找不到本次反思草稿，請重新開始。</p>
      </Card>
    )
  }
  if (!student || !message) return <Navigate to="/students/reflect" replace />

  const validate = () => {
    if (!isMeaningfulText(reflectionEvent, 5) || reflectionEvent.trim().length > 100) {
      return '「發生了什麼」請填寫5至100個字，且不能只有符號。'
    }
    if (!impactTarget) return '請選擇「我的行為影響了誰」。'
    if (!nextAction || nextAction === '請選擇一個具體行動') return '請選擇或填寫下一次具體行動。'
    if (actionPreset === '其他' && (!isMeaningfulText(customAction, 5) || customAction.trim().length > 80)) {
      return '其他行動請填寫5至80個字，且不能只有符號。'
    }
    if (recognizePeer === 'yes') {
      if (!peerStudentId || peerStudentId === student.id) return '請選擇一位不是自己的隊友。'
      if (!isMeaningfulText(peerReason, 5) || peerReason.trim().length > 80) return '肯定原因請填寫5至80個字。'
    }
    return ''
  }

  const save = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    if (!activeRound) {
      setError('尚未建立反思輪次，請先到教練頁建立新一輪反思。')
      return
    }
    if (isSaving || duplicate) return
    setIsSaving(true)
    setError('')

    const peerRecognition: PeerRecognition | undefined = recognizePeer === 'yes'
      ? { studentId: peerStudentId, reason: peerReason.trim() }
      : undefined

    const record: ReflectionRecord = {
      id: makeId('record'),
      studentId: draft.studentId,
      roundId: activeRound.id,
      role: draft.role,
      answers: draft.answers,
      totalScore: draft.totalScore,
      bestItem: draft.bestItem,
      improvementItem: draft.improvementItem,
      categoryScores: draft.categoryScores,
      previousActionStatus: draft.previousActionStatus,
      reflectionEvent: reflectionEvent.trim(),
      impactTarget,
      nextAction,
      peerRecognition,
      createdAt: draft.createdAt,
    }
    const nextData = { ...data, records: [...data.records, record] }
    setData(nextData)
    if (data.settings.googleScriptUrl) {
      await pushToGoogleSheet(data.settings.googleScriptUrl, nextData)
    }
    sessionStorage.removeItem(draft.id)
    navigate(`/complete/${record.id}`, { replace: true })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Card className="p-5 sm:p-7">
        <p className="text-sm font-bold text-team-orange">{student.name} / {roleLabels[draft.role]} / {formatDate(draft.createdAt)}</p>
        <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-team-navy">{message.title}</h1>
            <p className="mt-3 leading-7 text-team-muted">{message.description}</p>
            <p className="mt-3 text-sm font-semibold text-team-orange">
              {previous ? scoreDeltaText(delta) : '這是你的第一次反思，下一次就能看見自己的改變。'}
            </p>
          </div>
          <div className="rounded-lg bg-team-navy px-6 py-5 text-center text-white">
            <p className="text-sm font-semibold text-orange-100">本次分數</p>
            <p className="mt-1 text-5xl font-black">{draft.totalScore}</p>
            <p className="text-sm font-semibold">/ 50 分</p>
          </div>
        </div>
        {activeRound?.teamGoal && (
          <div className="mt-5 rounded-lg bg-orange-50 p-4">
            <p className="text-sm font-semibold text-team-muted">本輪團隊共同目標</p>
            <p className="mt-1 font-black leading-7 text-team-navy">{activeRound.teamGoal}</p>
          </div>
        )}
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {draft.categoryScores.map((item) => (
            <div key={item.category} className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-team-navy">{item.label}</p>
                <p className="font-black text-team-orange">{item.score} / {item.maxScore}</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-team-orange" style={{ width: `${Math.round((item.score / item.maxScore) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm font-semibold text-team-muted">做得最好的項目</p>
            <p className="mt-2 font-bold leading-6 text-team-ink">{draft.bestItem}</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm font-semibold text-team-muted">這次最需要練習</p>
            <p className="mt-2 font-bold leading-6 text-team-ink">{draft.improvementItem}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-black text-team-navy">1. 發生了什麼？</h2>
        <p className="mt-2 rounded-lg bg-blue-50 p-3 text-sm font-semibold leading-6 text-team-navy">最低分項目：{draft.improvementItem}</p>
        <label className="mt-4 grid gap-2">
          <span className="font-semibold text-team-ink">最近有沒有一件事情，和這個項目有關？</span>
          <textarea
            value={reflectionEvent}
            onChange={(event) => setReflectionEvent(event.target.value.slice(0, 100))}
            rows={3}
            placeholder="例如：學弟一直做錯，我講話太大聲，也有點不耐煩。"
            className="rounded-lg border border-slate-200 p-3 outline-none focus:border-team-blue focus:ring-4 focus:ring-blue-100"
          />
          <span className="text-right text-xs font-semibold text-team-muted">剩餘 {100 - reflectionEvent.length} 字</span>
        </label>
      </Card>

      <Card>
        <h2 className="text-xl font-black text-team-navy">2. 我的行為影響了誰？</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {impactOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setImpactTarget(option)}
              className={`min-h-14 rounded-lg border p-3 text-left font-bold transition ${
                impactTarget === option ? 'border-team-navy bg-team-navy text-white' : 'border-slate-200 bg-white text-team-ink hover:border-team-blue'
              }`}
            >
              {impactTargetLabels[option]}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-black text-team-navy">3. 下次我準備怎麼做？</h2>
        <select value={actionPreset} onChange={(event) => setActionPreset(event.target.value)} className="mt-4 min-h-12 w-full rounded-lg border border-slate-200 bg-white p-3 outline-none focus:border-team-blue focus:ring-4 focus:ring-blue-100">
          <option value="">請選擇一個具體行動</option>
          {nextActionOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
        {actionPreset === '其他' && (
          <input
            value={customAction}
            onChange={(event) => setCustomAction(event.target.value.slice(0, 80))}
            placeholder="請寫下具體行動"
            className="mt-3 min-h-12 w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-team-blue focus:ring-4 focus:ring-blue-100"
          />
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <HeartHandshake className="text-team-orange" size={22} />
          <h2 className="text-xl font-black text-team-navy">正向隊友肯定</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-team-muted">這次有沒有一位隊友值得肯定？這只會顯示在教練端。</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button type="button" variant={recognizePeer === 'yes' ? 'primary' : 'secondary'} onClick={() => setRecognizePeer('yes')}>有</Button>
          <Button type="button" variant={recognizePeer === 'skip' ? 'primary' : 'secondary'} onClick={() => setRecognizePeer('skip')}>這次先跳過</Button>
        </div>
        {recognizePeer === 'yes' && (
          <div className="mt-4 grid gap-3">
            <select value={peerStudentId} onChange={(event) => setPeerStudentId(event.target.value)} className="min-h-12 rounded-lg border border-slate-200 bg-white p-3">
              <option value="">選擇隊友姓名</option>
              {peers.map((peer) => <option key={peer.id} value={peer.id}>{peer.name}</option>)}
            </select>
            <input
              value={peerReason}
              onChange={(event) => setPeerReason(event.target.value.slice(0, 80))}
              placeholder="例如：整理場地時，他主動留下來幫忙。"
              className="min-h-12 rounded-lg border border-slate-200 p-3 outline-none focus:border-team-blue focus:ring-4 focus:ring-blue-100"
            />
          </div>
        )}
      </Card>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      {duplicate && <p className="rounded-lg bg-orange-50 p-3 text-sm font-semibold text-team-navy">這筆紀錄已送出，請到個人成長頁查看。</p>}
      <Button type="button" full disabled={isSaving || duplicate} onClick={() => void save()}>
        <CheckCircle2 size={18} />
        {isSaving ? '正在儲存...' : '儲存反思'}
      </Button>
    </div>
  )
}
