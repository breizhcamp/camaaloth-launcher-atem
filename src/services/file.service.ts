import { Injectable } from '@nestjs/common'
import { ExecService } from './exec.service'
import { Device } from '../dto/Device'
import * as fs from 'fs'
import { FileMeta } from '../dto/FileMeta'

@Injectable()
export class FileService {
  constructor(private readonly execService: ExecService) {}

  async listHotPlugDevices(): Promise<Device[]> {
    const devices = await this.execService.execCmd('lsblk -o NAME,MOUNTPOINT,VENDOR,LABEL,MODEL,HOTPLUG,SIZE -J')
    return JSON.parse(devices).blockdevices
      .filter(it => (it.hotplug === "1" || it.hotplug === true) && it.children)
      .flatMap(device => device.children
        .filter(child => child.mountpoint)
        .map(child => this.createDevice(child, device))
      )
  }

  getFilesFromDevices(devices: Device[], suffix: string): FileMeta[] {
    return devices.flatMap(device => this.listFiles(device.mountPoint, suffix, device))
  }

  private listFiles(path, suffix, device): FileMeta[] {
    return fs.readdirSync(path)
      .filter(file => file.endsWith(suffix))
      .map(file => this.createFileMeta(file, path, device))
  }

  private createDevice(child, device): Device {
    return {
      mountPoint: child.mountpoint,
      deviceName: child.name,
      label: child.label,
      model: device.model?.trim(),
      vendor: device.vendor?.trim(),
      size: child.size
    }
  }

  private createFileMeta(file, path, device): FileMeta {
    const stats = fs.statSync(path + '/' + file)

    return {
      name: file,
      path: path,
      lastModified: stats.mtime,
      device: device,
      size: stats.size
    }
  }
}