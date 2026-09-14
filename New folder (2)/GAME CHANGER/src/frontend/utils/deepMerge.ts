type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function deepMerge<T>(base: T, overrideValue: unknown): T {
  if (!isRecord(base) || !isRecord(overrideValue)) {
    return (overrideValue as T) ?? base;
  }

  const result: UnknownRecord = { ...base };

  for (const [key, value] of Object.entries(overrideValue)) {
    const current = result[key];

    if (Array.isArray(value)) {
      result[key] = value;
      continue;
    }

    if (isRecord(value) && isRecord(current)) {
      result[key] = deepMerge(current, value);
      continue;
    }

    if (value !== undefined) {
      result[key] = value;
    }
  }

  return result as T;
}
