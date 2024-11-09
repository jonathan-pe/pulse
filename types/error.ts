export class PulseError extends Error {
  description: string
  status: number
  constructor(message: string, description: string, status: number) {
    super(message)
    this.description = description
    this.status = status
  }
}
