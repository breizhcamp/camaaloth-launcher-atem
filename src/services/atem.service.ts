import { Atem, AtemConnectionStatus } from 'atem-connection'
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { State, Step } from '../dto/State'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { StateUpdateEvt } from '../events/StateUpdateEvt'
import * as fs from 'fs'
import { ExecService } from './exec.service'
import path from 'path'
import { PrepareEvt } from '../events/PrepareEvt'
import { StateService } from './state.service'

@Injectable()
export class AtemService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AtemService.name)

  private atem = new Atem()
  private atemIp = process.env.ATEM_IP
  private hasAtem = !!this.atemIp

  constructor(
    private readonly execSrv: ExecService,
    private readonly eventEmitter: EventEmitter2,
    private readonly stateSrv: StateService,
  ) {}

  onModuleInit(): any {
    if (this.hasAtem) {
      this.atem.on('connected', () => this.onAtemConnected())
      this.atem.on('stateChanged', (state, path) => this.onAtemStateChanged(state, path))
      this.logger.log(`Connecting to ATEM on [${this.atemIp}]`)
      this.atem.connect(this.atemIp)

    } else {
      this.logger.log('No ATEM IP is defined, disabling ATEM connection')
    }
  }

  onModuleDestroy(): any {
    if (this.atem.status === AtemConnectionStatus.CONNECTED) {
      this.logger.log('Disconnecting from ATEM')
      this.atem.disconnect()
    }
  }

  @OnEvent('state.update')
  sendState(evt: StateUpdateEvt) {
    if (!this.hasAtem) return
    const state = evt.state

    const isNewStep = state.step !== evt.old.step
    if (!isNewStep) return
    const step = state.step

    if (step === 'SELECTED') {
      this.prepare(state)
    }
  }

  private onAtemConnected() {
    this.logger.log('Connected to ATEM')
  }

  private onAtemStateChanged(state, path) {
    this.logger.log('State changed')
    // this.logger.log(state)
    this.logger.debug(path.join(', '))
  }

  private prepare(state: State) {
    this.stateSrv.changeStep(Step.PREPARE)
    this.updateStills(state)
  }

  private endPrepare() {
    this.stateSrv.changeStep(Step.RECORD)
  }

  private async updateStills(state: State) {
    const dir = state.extractDir
    this.sendEvt(`Uploading talk images to ATEM from directory [${dir}]`)

    const stills = [
      new Still(0, 'background.png', 'Background', 'Talk background'),
      new Still(1, 'title.png', 'Title', 'Talk title'),
      new Still(2, 'logo-full.png', 'Logo', 'User group logo'),
    ]

    await this.uploadStill(dir, stills)
  }

  private async uploadStill(dir: string, stills: Still[]) {
    if (stills.length === 0) {
      this.endPrepare()
      return
    }
    const still = stills.shift()

    this.logger.log(`Converting [${still.filename}] into RGBA`)
    const rgbaFile = dir + '/' + path.basename(still.filename, '.png') + '.rgba'
    await this.execSrv.execCmd(`ffmpeg -i "${dir}/${still.filename}" -pix_fmt rgba -f rawvideo "${rgbaFile}"`)

    this.sendEvt(`Uploading [${still.filename}]`)
    await this.atem.uploadStill(still.atemIndex, fs.readFileSync(rgbaFile), still.name, still.description)

    this.sendEvt(`End upload of [${still.filename}]`)
    setTimeout(() => this.uploadStill(dir, stills), 100)
  }

  private sendEvt(msg: string) {
    this.logger.log(msg)
    this.eventEmitter.emit('prepare.message', new PrepareEvt(msg))
  }
}

class Still {
  atemIndex: number
  filename: string
  name: string
  description: string

  constructor(atemIndex: number, filename: string, name: string, description: string) {
    this.atemIndex = atemIndex
    this.filename = filename
    this.name = name
    this.description = description
  }
}