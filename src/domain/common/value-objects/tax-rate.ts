import type { RoundingMethod } from "../entities/tax-settings";
import { Money } from "./money";

export class TaxRate {
  private constructor(
    private readonly rate: number,
    private readonly rounding: RoundingMethod
  ) {}

  static from(rate: string | number, rounding: RoundingMethod = "floor"): TaxRate {
    const num = typeof rate === "string" ? parseFloat(rate) : rate;
    return new TaxRate(num, rounding);
  }

  calculateTax(subtotal: Money): Money {
    const taxValue = subtotal.toNumber() * (this.rate / 100);
    const rounded = this.applyRounding(taxValue);
    return Money.from(rounded);
  }

  private applyRounding(value: number): number {
    switch (this.rounding) {
      case "floor":
        return Math.floor(value);
      case "ceil":
        return Math.ceil(value);
      case "round":
        return Math.round(value);
    }
  }

  toNumber(): number {
    return this.rate;
  }

  toString(): string {
    return this.rate.toFixed(2);
  }
}
