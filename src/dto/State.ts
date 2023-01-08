import { TalkSession } from './TalkSession'

export class State {
  step: Step = Step.HOME

  currentTalk?: TalkSession
  extractDir?: string
}

export enum Step {
  HOME = 'HOME',
  CHOICE = 'CHOICE',
  SELECTED = 'SELECTED',
  PREPARE = 'PREPARE',
  RECORD = 'RECORD',
  EXPORT = 'EXPORT',
}