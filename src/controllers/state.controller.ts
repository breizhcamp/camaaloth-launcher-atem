import { StateService } from '../services/state.service'
import { State } from '../dto/State'
import { Body, Controller, Get, HttpCode, Patch, Put } from '@nestjs/common'

@Controller('state')
export class StateController {
  constructor(
    private readonly stateService: StateService
  ) {}

  @Get()
  getState(): State {
    return this.stateService.getState()
  }

  @Patch() @HttpCode(204)
  update(@Body() up: Partial<State>) {
    if (up.step) this.stateService.changeStep(up.step)
  }

  @Put('talk')
  selectTalk(@Body() select: SelectTalkApi) {
    const file = select.path + '/' + select.name
    this.stateService.selectTalk(file)
  }
}

export interface SelectTalkApi {
  path: string
  name: string
}