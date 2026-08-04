import { useNavigate, useParams } from 'react-router-dom'
import { ButtonLink } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { StudentPicker } from '../components/StudentPicker'
import { useTeamProData } from '../hooks/useTeamProData'

export const StudentSelectPage = () => {
  const { mode } = useParams()
  const navigate = useNavigate()
  const { data } = useTeamProData()
  const isRecords = mode === 'records'

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-team-orange">{isRecords ? '查看成長紀錄' : '開始 3 至 5 分鐘反思'}</p>
          <h1 className="mt-1 text-2xl font-black text-team-navy sm:text-3xl">選擇自己的姓名</h1>
        </div>
        <ButtonLink to="/roster" variant="secondary">名單管理</ButtonLink>
      </div>

      {data.students.length === 0 ? (
        <EmptyState title="尚未建立學生名單" description="請先到名單管理新增學生。" action={<ButtonLink to="/roster">建立學生名單</ButtonLink>} />
      ) : (
        <StudentPicker
          students={data.students}
          records={data.records}
          onSelect={(student) => navigate(isRecords ? `/records/${student.id}` : `/role/${student.id}`)}
        />
      )}
    </div>
  )
}
