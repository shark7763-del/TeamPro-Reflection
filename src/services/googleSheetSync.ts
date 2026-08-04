import type { TeamProData } from '../types/domain'
import { isValidGoogleScriptUrl } from './storage'

export interface SyncResult {
  ok: boolean
  message: string
  data?: TeamProData
}

const request = async (url: string, action: string, data?: TeamProData): Promise<SyncResult> => {
  if (!isValidGoogleScriptUrl(url)) {
    return { ok: false, message: 'Google Apps Script URL 格式錯誤，請使用結尾為 /exec 的 Web App URL。' }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, data }),
    })
    const result = (await response.json()) as SyncResult
    return result
  } catch {
    return { ok: false, message: '無法連線到 Google Sheet，同步暫時失敗。' }
  }
}

export const pushToGoogleSheet = (url: string, data: TeamProData) => request(url, 'saveAll', data)

export const pullFromGoogleSheet = async (url: string): Promise<SyncResult> => request(url, 'loadAll')
