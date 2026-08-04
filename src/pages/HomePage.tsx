import { CalendarDays, Database, Play, Users } from 'lucide-react'
import { ButtonLink } from '../components/Button'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { useTeamProData } from '../hooks/useTeamProData'
import { formatDate } from '../utils/score'

export const HomePage = () => {
  const { data } = useTeamProData()
  const latest = [...data.records].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
        <div className="rounded-lg bg-team-navy p-6 text-white shadow-sm sm:p-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
            <Users size={16} />
            TeamPro
          </div>
          <h1 className="max-w-2xl text-3xl font-black leading-tight sm:text-5xl">TeamPro 團隊反思系統</h1>
          <p className="mt-3 text-xl font-semibold text-orange-100">看見自己的責任，成為更好的隊友</p>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-100">分數不是用來比較，而是幫助你看見自己有沒有進步。</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <ButtonLink to="/students/reflect" className="bg-team-orange text-team-ink hover:bg-[#f5a142]">
              <Play size={18} />
              學生開始反思
            </ButtonLink>
            <ButtonLink to="/coach" variant="secondary">
              <Database size={18} />
              教練管理
            </ButtonLink>
          </div>
        </div>

        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-team-navy">
              <CalendarDays size={22} />
              <h2 className="text-xl font-black">最近一次團隊反思</h2>
            </div>
            {latest ? (
              <div className="mt-6 space-y-3">
                <p className="text-4xl font-black text-team-navy">{formatDate(latest.createdAt)}</p>
                <p className="text-team-muted">已累積 {data.records.length} 筆反思紀錄，資料保存在本機瀏覽器。</p>
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="目前還沒有反思紀錄"
                  description="完成第一次反思後，就能開始看見自己的成長。"
                />
              </div>
            )}
          </div>
          <div className="mt-6 rounded-lg bg-orange-50 p-4 text-sm leading-6 text-slate-700">
            目前輪次：{data.rounds.find((round) => round.id === data.settings.currentRoundId)?.title ?? '尚未設定'}
            {data.rounds.find((round) => round.id === data.settings.currentRoundId)?.teamGoal && (
              <div className="mt-2 font-semibold text-team-navy">
                團隊共同目標：{data.rounds.find((round) => round.id === data.settings.currentRoundId)?.teamGoal}
              </div>
            )}
          </div>
        </Card>
      </section>
    </div>
  )
}
