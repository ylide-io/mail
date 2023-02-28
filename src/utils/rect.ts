export class Rect {
  x = 0
  y = 0
  width = 0
  height = 0

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  get right() {
    return this.x + this.width
  }

  get bottom() {
    return this.y + this.height
  }

  get centerX() {
    return this.x + this.width / 2
  }

  get centerY() {
    return this.y + this.height / 2
  }

  clone() {
    return new Rect(this.x, this.y, this.width, this.height)
  }
}
