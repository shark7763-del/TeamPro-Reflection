import type { Grade, Student } from '../types/domain'

interface DefaultStudentSeed {
  name: string
  grade: Grade
  note: string
}

const defaultStudentSeeds: DefaultStudentSeed[] = [
  { name: '陸品蓉', grade: '七年級', note: '班級701' },
  { name: '黃梓晴', grade: '七年級', note: '班級701' },
  { name: '蘇虹睿', grade: '七年級', note: '班級701' },
  { name: '陳夏銘', grade: '七年級', note: '班級701' },
  { name: '趙婕妤', grade: '七年級', note: '班級701' },
  { name: '甄仁邦', grade: '七年級', note: '班級701' },
  { name: '王曉田', grade: '七年級', note: '班級701' },
  { name: '鄭家有', grade: '七年級', note: '班級701' },
  { name: '郭宇杰', grade: '七年級', note: '班級701' },
  { name: '曾弈橙', grade: '七年級', note: '班級701' },
  { name: '田宸鑫', grade: '七年級', note: '班級701' },
  { name: '游鈞翔', grade: '七年級', note: '班級701' },
  { name: '陳芊彤', grade: '八年級', note: '班級801' },
  { name: '林駿堯', grade: '八年級', note: '班級801' },
  { name: '王柏鈞', grade: '八年級', note: '班級801 / 座號1 / 男 / 品勢' },
  { name: '許景皓', grade: '八年級', note: '班級801 / 座號06 / 男 / 對打' },
  { name: '上官哲忻', grade: '八年級', note: '班級801 / 座號15 / 男 / 品勢' },
  { name: '徐洧翎', grade: '八年級', note: '班級801 / 座號25 / 女 / 對打' },
  { name: '張晏慈', grade: '八年級', note: '班級801 / 座號26 / 女 / 對打' },
  { name: '曹絮綺', grade: '八年級', note: '班級801 / 座號27 / 女 / 對打' },
  { name: '王宥霖', grade: '九年級', note: '班級901 / 座號01 / 男 / 對打' },
  { name: '葉承祐', grade: '九年級', note: '班級901 / 座號07 / 男 / 品勢' },
  { name: '謝昊恩', grade: '九年級', note: '班級901 / 座號10 / 男 / 對打' },
  { name: '蘇宥嘉', grade: '九年級', note: '班級901 / 座號12 / 男 / 品勢' },
  { name: '吳昀蓁', grade: '九年級', note: '班級901 / 座號22 / 女 / 對打' },
  { name: '林子棠', grade: '九年級', note: '班級901 / 座號23 / 女 / 對打/品勢' },
  { name: '吳宥豪', grade: '九年級', note: '班級901' },
  { name: '唐寧昕', grade: '九年級', note: '班級901 / 座號24 / 女 / 對打' },
]

export const createDefaultStudents = (createdAt: string, makeId: (prefix: string) => string): Student[] =>
  defaultStudentSeeds.map((student) => ({
    id: makeId('student'),
    name: student.name,
    grade: student.grade,
    note: student.note,
    createdAt,
  }))

export const createMissingDefaultStudents = (
  existingNames: Set<string>,
  createdAt: string,
  makeId: (prefix: string) => string,
): Student[] =>
  defaultStudentSeeds
    .filter((student) => !existingNames.has(student.name))
    .map((student) => ({
      id: makeId('student'),
      name: student.name,
      grade: student.grade,
      note: student.note,
      createdAt,
    }))
