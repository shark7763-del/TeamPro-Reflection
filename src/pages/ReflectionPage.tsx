import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { questions, roleLabels, scoreDescriptions } from '../data/questions'
import { useTeamProData } from '../hooks/useTeamProData'
import type { ReflectionDraft, ReflectionRole } from '../types/domain'
import { analyzeAnswers } from '../utils/score'

export const ReflectionPage = () => {
  const { studentId, role } = useParams()
  const navigate = useNavigate()
  const { data } = useTeamProData()
  const student = data.students.find((item) => item.id === studentId)
  const validRole = role === 'senior' || role === 'junior' ? role : undefined
  const [answers, setAnswers] = useState<number[]>([])
  const [step, setStep] = useState(0)

  const currentQuestions = validRole ? questions[validRole] : []
  const selected = answers[step]
  const progress = useMemo(() => Math.round(((step + 1) / 10) * 100), [step])

  if (!student || !validRole) return <Navigate to="/students/reflect" replace />

  const setScore = (score: number) => {
    const next = [...answers]
    next[step] = score
    setAnswers(next)
  }

  const next = () => {
    if (!selected) return
    if (step < 9) {
      setStep(step + 1)
      return
    }
    const analysis = analyzeAnswers(validRole, answers)
    const draft: ReflectionDraft = {
      id: `draft-${crypto.randomUUID()}`,
      studentId: student.id,
      role: validRole as ReflectionRole,
      answers,
      ...analysis,
      createdAt: new Date().toISOString(),
    }
    sessionStorage.setItem(draft.id, JSON.stringify(draft))
    navigate(`/result/${draft.id}`)
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
            <h1 className="mt-1 text-xl font-black text-team-navy">第 {step + 1} 題，共 10 題</h1>
          </div>
          <span className="text-sm font-black text-team-navy">{progress}%</span>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-team-orange transition-all" style={{ width: `${progress}%` }} />
        </div>

        <p className="mt-8 text-2xl font-black leading-9 text-team-ink">{currentQuestions[step]}</p>
        <div className="mt-7 grid grid-cols-5 gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => setScore(score)}
              className={`flex aspect-square min-h-14 items-center justify-center rounded-lg text-2xl font-black transition ${
                selected === score ? 'bg-team-navy text-white ring-4 ring-orange-200' : 'bg-slate-100 text-team-navy hover:bg-orange-100'
              }`}
              aria-label={`${score}分：${scoreDescriptions[score]}`}
            >
              {score}
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-2 text-sm text-team-muted sm:grid-cols-5">
          {[1, 2, 3, 4, 5].map((score) => (
            <p key={score} className={selected === score ? 'font-bold text-team-navy' : ''}>{score}分：{scoreDescriptions[score]}</p>
          ))}
        </div>
        <div className="mt-8 flex gap-3">
          <Button type="button" variant="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>
            上一題
          </Button>
          <Button type="button" full disabled={!selected} onClick={next}>
            {step === 9 ? '查看結果' : '下一題'}
            <ArrowRight size={17} />
          </Button>
        </div>
      </Card>
    </div>
  )
}
