import process from 'node:process';

export class DurationTime {
  public start: [number, number];
  public finish: [number, number] = [0, 0];
  public ms = 0;

  public constructor() {
    this.start = process.hrtime();
  }

  public milliseconds() {
    if (this.ms > 0) return this.ms;
    this.finish = process.hrtime(this.start);
    this.ms = this.finish[0] * 1e3 + this.finish[1] * 1e-6;
    return this.ms;
  }

  public format(digits = 3) {
    return `${this.milliseconds().toFixed(digits)}ms`;
  }
}

export interface DurationTimeInterface {
  milliseconds(): number;
  format(): string;
}
