import { Injectable, Logger } from '@nestjs/common'
import { State, Step } from '../dto/State'
import { TalkService } from './talk.service'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { StateUpdateEvt } from '../events/StateUpdateEvt'
import * as fs from 'fs'
import dayjs from 'dayjs'
import AdmZip from 'adm-zip'
import path from 'path'

@Injectable()
export class StateService {
  private readonly logger = new Logger(StateService.name)

  private state = new State()

  constructor(
    private readonly talkService: TalkService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  getState(): State {
    return this.state
  }

  changeStep(step: Step) {
    const old = {...this.state}
    this.state.step = step
    this.emitUpdate(old)
  }

  selectTalk(zipFile: string) {
    this.logger.log(`Selecting talk from [${zipFile}]`)
    const old = {...this.state}

    this.state.currentTalk = this.talkService.readTalkSession(zipFile)
    this.state.step = Step.SELECTED
    this.state.extractDir = this.extractZip(zipFile)
    fs.copyFileSync(zipFile, this.state.extractDir + '/' + path.basename(zipFile))
    this.logger.log(`Talk metadata extracted in [${this.state.extractDir}]`)

    this.emitUpdate(old)
  }

  private extractZip(zipFile: string): string {
    const dirName = dayjs().format('YYYY-MM-DD') + ' - ' + this.state.currentTalk?.talk + ' - ' +
      this.state.currentTalk?.speakers?.map(s => s.name)?.join(' - ')

    const extractDir = (process.env.EXTRACT_DIR || '/tmp/camaaloth') + '/' + this.cleanForFilename(dirName)

    if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true })
    fs.mkdirSync(extractDir, { recursive: true })
    new AdmZip(zipFile).extractAllTo(extractDir)
    return extractDir
  }

  private emitUpdate(old: State) {
    this.eventEmitter.emit('state.update', new StateUpdateEvt(this.state, old))
  }

  private cleanForFilename(dirName: string) {
    return dirName.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[\\/:*?"<>|]/, '-')
      .replace(/[^A-Za-z0-9,\-\\ ]/, '')
  }
}