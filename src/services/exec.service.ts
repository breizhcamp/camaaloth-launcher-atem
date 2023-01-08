import { Injectable } from '@nestjs/common'
import { exec } from 'node:child_process'

@Injectable()
export class ExecService {
  execCmd(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(cmd, (err, stdout, stderr) => {
        if (err) {
          reject(stderr)
        }

        resolve(stdout)
      })
    })
  }
}