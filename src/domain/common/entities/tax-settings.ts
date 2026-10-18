export type RoundingMethod = "floor" | "round" | "ceil";
export type DisplayMode = "exclusive" | "inclusive";

export interface TaxSettings {
  id: string;
  taxRate: string;
  roundingMethod: RoundingMethod;
  displayMode: DisplayMode;
  effectiveFrom: string;
  createdAt: Date;
}
