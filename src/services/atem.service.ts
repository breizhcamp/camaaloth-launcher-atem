import { Atem, AtemConnectionStatus } from 'atem-connection'
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { State } from '../dto/State'
import { OnEvent } from '@nestjs/event-emitter'
import { StateUpdateEvt } from '../events/StateUpdateEvt'
import * as fs from 'fs'
import { ExecService } from './exec.service'
import path from 'path'

@Injectable()
export class AtemService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AtemService.name)

  private atem = new Atem()
  private atemIp = process.env.ATEM_IP
  private hasAtem = !!this.atemIp

  constructor(private readonly execSrv: ExecService) {}

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

    const isNewStep = evt.state.step !== evt.old.step
    if (!isNewStep) return
    const step = evt.state.step

    if (step === 'SELECTED') {
      this.updateStills(evt.state)
    }
  }

  private onAtemConnected() {
    this.logger.log('Connected to ATEM')
  }

  private onAtemStateChanged(state, path) {
    this.logger.log('State changed')
    // this.logger.log(state)
    this.logger.debug(path)
  }

  private async updateStills(state: State) {
    const dir = state.extractDir
    this.logger.log(`Uploading talk images to ATEM from directory [${dir}]`)

    const stills = [
      new Still(0, 'background.png', 'Background', 'Talk background'),
      new Still(1, 'title.png', 'Title', 'Talk title'),
      new Still(2, 'logo-full.png', 'Logo', 'User group logo'),
    ]

    await this.uploadStill(dir, stills)
  }

  private async uploadStill(dir: string, stills: Still[]) {
    if (stills.length === 0) return
    const still = stills.shift()

    this.logger.log(`Converting [${still.filename}] into RGBA`)
    const rgbaFile = dir + '/' + path.basename(still.filename, '.png') + '.rgba'
    await this.execSrv.execCmd(`ffmpeg -i "${dir}/${still.filename}" -pix_fmt rgba -f rawvideo "${rgbaFile}"`)

    this.logger.log(`Uploading [${still.filename}]`)
    await this.atem.uploadStill(still.atemIndex, fs.readFileSync(rgbaFile), still.name, still.description)

    this.logger.log(`End upload of [${still.filename}]`)
    setTimeout(() => this.uploadStill(dir, stills), 10)
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