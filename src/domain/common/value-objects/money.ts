export class Money {
  private constructor(private readonly value: number) {}

  static from(value: string | number): Money {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) {
      throw new Error(`Invalid money value: ${value}`);
    }
    return new Money(Math.round(num * 100) / 100);
  }

  static zero(): Money {
    return new Money(0);
  }

  add(other: Money): Money {
    return new Money(
      Math.round((this.value + other.value) * 100) / 100
    );
  }

  subtract(other: Money): Money {
    return new Money(
      Math.round((this.value - other.value) * 100) / 100
    );
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this.value * factor * 100) / 100);
  }

  toNumber(): number {
    return this.value;
  }

  toString(): string {
    return this.value.toFixed(2);
  }
}
