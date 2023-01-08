import { Controller, Get, Query } from '@nestjs/common'
import { FileService } from '../services/file.service'
import { FileMeta } from '../dto/FileMeta'
import { TalkSession } from '../dto/TalkSession'
import { TalkService } from '../services/talk.service'

@Controller('files')
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private readonly talkService: TalkService,
  ) {}

  @Get()
  async listHotPlug(): Promise<FileMeta[]> {
    const devices = await this.fileService.listHotPlugDevices()
    return this.fileService.getFilesFromDevices(devices, '.ug.zip')
  }

  @Get('/talk')
  readTalkSession(@Query('file') file: string): TalkSession {
    return this.talkService.readTalkSession(file, true)
  }
}