import { TalkSession } from '../dto/TalkSession'
import AdmZip from 'adm-zip'

export class TalkService {
  readTalkSession(file: string, withLogo = false): TalkSession {
    let infos
    let logo

    new AdmZip(file).getEntries().forEach(entry => {
      if (entry.entryName === 'infos.json') {
        infos = JSON.parse(entry.getData().toString("utf8"))
      }

      if (withLogo && entry.entryName === 'logo.png') {
        logo = entry.getData().toString('base64')
      }
    })

    if (!infos) {
      throw `Cannot found [infos.json] in zip file [${file}]`
    }

    infos.logo = logo
    return infos
  }
}