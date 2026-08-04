import { ArrowLeft, ChevronRight, Shield, Users } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { roleDescriptions } from '../data/questions'
import { useTeamProData } from '../hooks/useTeamProData'
import type { ReflectionRole } from '../types/domain'

const roles: Array<{ role: ReflectionRole; title: string; icon: typeof Shield }> = [
  { role: 'senior', title: '我是學長姐', icon: Shield },
  { role: 'junior', title: '我是學弟妹', icon: Users },
]

export const RolePage = () => {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const { data } = useTeamProData()
  const student = data.students.find((item) => item.id === studentId)

  if (!studentId || !student) return <Navigate to="/students/reflect" replace />

  return (
    <div className="space-y-5">
      <Link to="/students/reflect" className="inline-flex items-center gap-2 text-sm font-semibold text-team-muted hover:text-team-navy">
        <ArrowLeft size={17} />
        重新選擇學生
      </Link>
      <div>
        <p className="text-sm font-bold text-team-orange">{student.name}，{student.grade}</p>
        <h1 className="mt-1 text-2xl font-black text-team-navy sm:text-3xl">選擇本次反思身分</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((item) => {
          const Icon = item.icon
          return (
            <button key={item.role} type="button" onClick={() => navigate(`/reflect/${student.id}/${item.role}`)} className="text-left">
              <Card className="h-full border-2 border-transparent p-6 transition hover:-translate-y-0.5 hover:border-team-orange">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-team-navy text-white">
                    <Icon size={24} />
                  </div>
                  <ChevronRight className="text-team-orange" />
                </div>
                <h2 className="mt-5 text-2xl font-black text-team-navy">{item.title}</h2>
                <p className="mt-3 leading-7 text-team-muted">{roleDescriptions[item.role]}</p>
              </Card>
            </button>
          )
        })}
      </div>
    </div>
  )
}
