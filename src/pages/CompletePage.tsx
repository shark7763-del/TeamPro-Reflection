import { BarChart3, Home, RotateCcw } from 'lucide-react'
import { Navigate, useParams } from 'react-router-dom'
import { ButtonLink } from '../components/Button'
import { Card } from '../components/Card'
import { useTeamProData } from '../hooks/useTeamProData'
import { formatDate, getRecordCategoryScores } from '../utils/score'

export const CompletePage = () => {
  const { recordId } = useParams()
  const { data } = useTeamProData()
  const record = data.records.find((item) => item.id === recordId)
  const round = record ? data.rounds.find((item) => item.id === record.roundId) : undefined

  if (!record) return <Navigate to="/" replace />

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Card className="p-6 text-center sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-orange-100 text-team-orange">
          <BarChart3 size={32} />
        </div>
        <h1 className="mt-5 text-3xl font-black text-team-navy">反思完成</h1>
        <p className="mt-3 leading-7 text-team-muted">真正的進步，不只是分數提高，<br />而是把答應自己的事情做到。</p>
        <div className="mt-6 grid gap-3 rounded-lg bg-slate-50 p-4 text-left">
          <p><span className="font-semibold text-team-muted">本次分數：</span><span className="font-black text-team-navy">{record.totalScore} / 50 分</span></p>
          <div>
            <p className="font-semibold text-team-muted">三個面向分數：</p>
            <div className="mt-2 grid gap-2">
              {getRecordCategoryScores(record).map((item) => (
                <p key={item.category} className="rounded-md bg-white p-2 text-sm">
                  <span className="font-bold text-team-navy">{item.label}</span>：{item.score} / {item.maxScore}
                </p>
              ))}
            </div>
          </div>
          <p><span className="font-semibold text-team-muted">下一次行動：</span>{record.nextAction}</p>
          {round?.teamGoal && <p><span className="font-semibold text-team-muted">本輪團隊共同目標：</span>{round.teamGoal}</p>}
          <p><span className="font-semibold text-team-muted">完成日期：</span>{formatDate(record.createdAt)}</p>
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-3">
        <ButtonLink to={`/records/${record.studentId}`}><BarChart3 size={18} />查看我的成長</ButtonLink>
        <ButtonLink to="/" variant="secondary"><Home size={18} />返回首頁</ButtonLink>
        <ButtonLink to="/students/reflect" variant="secondary"><RotateCcw size={18} />下一位學生</ButtonLink>
      </div>
    </div>
  )
}
