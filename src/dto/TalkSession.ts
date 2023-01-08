import { Speaker } from './Speaker'

export interface TalkSession {
  talk: string
  speakers: Speaker[]

  date: string //ISO LocalDate
  startTime: string //ISO LocalTime
  endTime: string //ISO LocalTime

  /** User group name */
  name: string

  /** User group logo in base64 */
  logo?: string
}