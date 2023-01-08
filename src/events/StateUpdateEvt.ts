import { State } from '../dto/State'

export class StateUpdateEvt {
  state: State
  old: State


  constructor(state: State, old: State) {
    this.state = state
    this.old = old
  }
}