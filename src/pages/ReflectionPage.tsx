import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { questions, roleLabels, scoreDescriptions, shortScoreLabels } from '../data/questions'
import { useTeamProData } from '../hooks/useTeamProData'
import type { PreviousActionStatus, ReflectionDraft, ReflectionRole } from '../types/domain'
import { analyzeAnswers, getPreviousRecord } from '../utils/score'

type FlowStep = 'previous-action' | 'recent-reminder' | 'questions'

export const ReflectionPage = () => {
  const { studentId, role } = useParams()
  const navigate = useNavigate()
  const { data, activeRound } = useTeamProData()
  const student = data.students.find((item) => item.id === studentId)
  const validRole = role === 'senior' || role === 'junior' ? role : undefined
  const storageKey = studentId && validRole ? `teampro-draft-${studentId}-${validRole}` : ''

  const [flowStep, setFlowStep] = useState<FlowStep>('previous-action')
  const [answers, setAnswers] = useState<number[]>([])
  const [step, setStep] = useState(0)
  const [previousActionStatus, setPreviousActionStatus] = useState<PreviousActionStatus | undefined>()

  const previous = student && validRole ? getPreviousRecord(data.records, student.id, validRole) : undefined
  const currentQuestions = validRole ? questions[validRole] : []
  const selected = answers[step]
  const progress = useMemo(() => Math.round(((step + 1) / 10) * 100), [step])

  useEffect(() => {
    if (!storageKey) return
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return
    try {
      const draft = JSON.parse(raw) as Pick<ReflectionDraft, 'answers' | 'previousActionStatus'>
      setAnswers(Array.isArray(draft.answers) ? draft.answers : [])
      setPreviousActionStatus(draft.previousActionStatus)
      setFlowStep(draft.previousActionStatus ? 'questions' : 'previous-action')
    } catch {
      sessionStorage.removeItem(storageKey)
    }
  }, [storageKey])

  useEffect(() => {
    if (!storageKey || !student || !validRole) return
    sessionStorage.setItem(storageKey, JSON.stringify({ studentId: student.id, role: validRole, answers, previousActionStatus }))
  }, [answers, previousActionStatus, storageKey, student, validRole])

  if (!student || !validRole) return <Navigate to="/students/reflect" replace />

  const setScore = (score: number) => {
    const next = [...answers]
    next[step] = score
    setAnswers(next)
  }

  const completeQuestions = () => {
    if (answers.length !== 10 || answers.some((answer) => !answer)) return
    const analysis = analyzeAnswers(validRole, answers)
    const draft: ReflectionDraft = {
      id: `draft-${crypto.randomUUID()}`,
      studentId: student.id,
      role: validRole as ReflectionRole,
      answers,
      ...analysis,
      previousActionStatus: previousActionStatus ?? 'first_time',
      reflectionEvent: '',
      nextAction: '',
      createdAt: new Date().toISOString(),
    }
    sessionStorage.setItem(draft.id, JSON.stringify(draft))
    sessionStorage.removeItem(storageKey)
    navigate(`/result/${draft.id}`)
  }

  const nextQuestion = () => {
    if (!selected) return
    if (step < 9) {
      setStep(step + 1)
      return
    }
    completeQuestions()
  }

  if (flowStep === 'previous-action') {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <Link to={`/role/${student.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-team-muted hover:text-team-navy">
          <ArrowLeft size={17} />
          返回身分選擇
        </Link>
        <Card className="p-6 sm:p-7">
          <p className="text-sm font-bold text-team-orange">{student.name} / {roleLabels[validRole]}</p>
          {activeRound?.teamGoal && (
            <div className="mt-4 rounded-lg bg-orange-50 p-4">
              <p className="text-sm font-semibold text-team-muted">本輪團隊共同目標</p>
              <p className="mt-1 font-black leading-7 text-team-navy">{activeRound.teamGoal}</p>
            </div>
          )}
          {previous ? (
            <>
              <h1 className="mt-6 text-2xl font-black text-team-navy">上次你答應自己：</h1>
              <p className="mt-4 rounded-lg bg-slate-50 p-4 text-lg font-bold leading-8 text-team-ink">「{previous.nextAction}」</p>
              <p className="mt-5 text-lg font-semibold text-team-ink">這次做到了嗎？</p>
              <div className="mt-4 grid gap-3">
                {[
                  ['completed', '我做到了'],
                  ['partial', '我做到一部分'],
                  ['not_completed', '我還沒做到'],
                ].map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    variant={previousActionStatus === value ? 'primary' : 'secondary'}
                    onClick={() => setPreviousActionStatus(value as PreviousActionStatus)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <Button className="mt-5" type="button" full disabled={!previousActionStatus} onClick={() => setFlowStep('recent-reminder')}>
                繼續本次反思
                <ArrowRight size={17} />
              </Button>
            </>
          ) : (
            <>
              <h1 className="mt-6 text-2xl font-black text-team-navy">這是你的第一次反思。</h1>
              <p className="mt-4 leading-7 text-team-muted">請誠實想想最近兩週真正發生的事情。</p>
              <Button
                className="mt-6"
                type="button"
                full
                onClick={() => {
                  setPreviousActionStatus('first_time')
                  setFlowStep('recent-reminder')
                }}
              >
                開始第一次反思
                <ArrowRight size={17} />
              </Button>
            </>
          )}
        </Card>
      </div>
    )
  }

  if (flowStep === 'recent-reminder') {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <Card className="p-6 sm:p-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-team-orange">
            <CheckCircle2 size={26} />
          </div>
          <h1 className="mt-5 text-2xl font-black text-team-navy">評估最近的真實表現</h1>
          <p className="mt-4 text-lg font-semibold leading-8 text-team-ink">請想最近兩週真正發生的事情。</p>
          <p className="mt-3 leading-7 text-team-muted">不要評自己希望成為什麼樣的人，而是評自己最近實際做到了多少。</p>
          {activeRound?.teamGoal && (
            <div className="mt-5 rounded-lg bg-orange-50 p-4">
              <p className="text-sm font-semibold text-team-muted">本輪團隊共同目標</p>
              <p className="mt-1 font-black leading-7 text-team-navy">{activeRound.teamGoal}</p>
            </div>
          )}
          <Button className="mt-6" type="button" full onClick={() => setFlowStep('questions')}>
            開始10題評分
            <ArrowRight size={17} />
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to={`/role/${student.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-team-muted hover:text-team-navy">
        <ArrowLeft size={17} />
        返回身分選擇
      </Link>
      <Card className="p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-team-orange">{student.name} / {roleLabels[validRole]}</p>
            <h1 className="mt-1 text-xl font-black text-team-navy">第 {step + 1} 題 / 共 10 題</h1>
          </div>
          <span className="text-sm font-black text-team-navy">{progress}%</span>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-team-orange transition-all" style={{ width: `${progress}%` }} />
        </div>

        <p className="mt-8 text-2xl font-black leading-9 text-team-ink">{currentQuestions[step].text}</p>
        <div className="mt-7 grid grid-cols-1 gap-2 sm:grid-cols-5 sm:gap-3">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => setScore(score)}
              className={`flex min-h-14 items-center justify-center rounded-lg px-3 text-lg font-black transition sm:flex-col ${
                selected === score ? 'bg-team-navy text-white ring-4 ring-orange-200' : 'bg-slate-100 text-team-navy hover:bg-orange-100'
              }`}
            >
              <span className="text-2xl">{score}</span>
              <span className="text-sm">{shortScoreLabels[score]}</span>
            </button>
          ))}
        </div>
        {selected && (
          <p className="mt-5 rounded-lg bg-blue-50 p-3 text-sm font-semibold leading-6 text-team-navy">
            {selected}分：{scoreDescriptions[selected]}
          </p>
        )}
        <div className="mt-8 flex gap-3">
          <Button type="button" variant="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>
            上一題
          </Button>
          <Button type="button" full disabled={!selected} onClick={nextQuestion}>
            {step === 9 ? '查看分數' : '下一題'}
            <ArrowRight size={17} />
          </Button>
        </div>
      </Card>
    </div>
  )
}
