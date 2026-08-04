import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadData, saveData } from '../services/storage'
import type { TeamProData } from '../types/domain'

export const useTeamProData = () => {
  const [data, setDataState] = useState<TeamProData>(() => loadData())

  useEffect(() => {
    saveData(data)
  }, [data])

  const setData = useCallback((updater: TeamProData | ((current: TeamProData) => TeamProData)) => {
    setDataState((current) => (typeof updater === 'function' ? updater(current) : updater))
  }, [])

  const activeRound = useMemo(
    () => data.rounds.find((round) => round.id === data.settings.currentRoundId) ?? data.rounds.find((round) => round.isActive),
    [data.rounds, data.settings.currentRoundId],
  )

  return { data, setData, activeRound }
}
