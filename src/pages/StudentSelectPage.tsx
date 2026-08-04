import { useNavigate, useParams } from 'react-router-dom'
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
      </div>

      {data.students.length === 0 ? (
        <EmptyState title="尚未建立學生名單" description="請請教練先到教練管理建立學生名單。" />
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
