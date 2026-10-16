import assert from "node:assert/strict";
export function must<T>(value: T | null | undefined): T {
  assert(value !== undefined && value !== null);
  return value;
}
