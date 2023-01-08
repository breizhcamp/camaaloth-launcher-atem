import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Input } from '@julusian/midi'

@Injectable()
export class MidiService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MidiService.name)

  private midiIn = new Input()

  onModuleInit(): any {
    const midiPort = this.getMidiPort()
    this.logger.log('Connecting to midi device [' + this.midiIn.getPortName(midiPort) + ']')
    this.midiIn.on('message', this.onReceive.bind(this))
    this.midiIn.openPort(midiPort)
  }

  onModuleDestroy(): any {
    this.midiIn.closePort()
  }

  private onReceive(deltaTime, message) {
    console.log(`m: ${message} d: ${deltaTime}`)
  }

  private getMidiPort(): number {
    const ports = this.midiIn.getPortCount()
    for (let i = 0; i < ports; i++) {
      const name = this.midiIn.getPortName(i)
      if (name.indexOf('XIAO') !== -1) return i
    }
  }

}