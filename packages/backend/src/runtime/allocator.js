import { isPortOpen } from "./port-utils.js";

export class Allocator {
  constructor(min, max, label) {
    this.min = min;
    this.max = max;
    this.label = label;
    this.used = new Set();
  }

  reserve(value) {
    this.used.add(value);
  }

  release(value) {
    if (value !== undefined && value !== null) this.used.delete(value);
  }

  async allocatePort() {
    for (let value = this.min; value <= this.max; value += 1) {
      if (this.used.has(value)) continue;
      if (await isPortOpen(value)) continue;
      this.used.add(value);
      return value;
    }
    throw new Error(`No free ${this.label} in range ${this.min}-${this.max}`);
  }

  allocateNumber() {
    for (let value = this.min; value <= this.max; value += 1) {
      if (this.used.has(value)) continue;
      this.used.add(value);
      return value;
    }
    throw new Error(`No free ${this.label} in range ${this.min}-${this.max}`);
  }
}
