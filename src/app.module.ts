import { Module } from '@nestjs/common'
import { FileController } from './controllers/file.controller'
import { FileService } from './services/file.service'
import { ExecService } from './services/exec.service'
import { TalkService } from './services/talk.service'
import { StateService } from './services/state.service'
import { StateController } from './controllers/state.controller'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { WSGateway } from './controllers/ws.gateway'
import { AtemService } from './services/atem.service'

@Module({
  imports: [ EventEmitterModule.forRoot() ],
  controllers: [ FileController, StateController ],
  providers: [ FileService, ExecService, TalkService, StateService, WSGateway, AtemService ],
})
export class AppModule {}
