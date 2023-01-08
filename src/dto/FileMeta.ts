import { Device } from './Device'

export interface FileMeta {
  name: string
  path: string
  lastModified: Date
  device: Device
  size: number
}