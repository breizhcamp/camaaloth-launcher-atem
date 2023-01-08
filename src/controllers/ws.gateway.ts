import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { StateUpdateEvt } from '../events/StateUpdateEvt'
import { OnEvent } from '@nestjs/event-emitter'
import { Server } from 'socket.io'

@WebSocketGateway()
export class WSGateway {

  @WebSocketServer()
  server: Server

  @OnEvent('state.update')
  sendState(evt: StateUpdateEvt) {
    this.server.emit('state', evt.state)
  }

}