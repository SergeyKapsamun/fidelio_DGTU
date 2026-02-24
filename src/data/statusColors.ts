const STATUS_COLOR_BY_KEY: Record<string, string> = {
  "ожидает оплаты": "#f87171",
  "внесена предоплата": "#fbbf24",
  "оплачена вся сумма": "#4ade80",
  "успешно заселен": "#38bdf8",
  "отменено": "#94a3b8",
  cancelled: "#94a3b8",
};

export const normalizeStatusKey = (value: string) =>
  value.toLowerCase().replace(/\s+/g, " ").trim();

export const resolveKnownStatusColor = (status: string) => {
  const key = normalizeStatusKey(status ?? "");
  if (!key) {
    return "";
  }
  return STATUS_COLOR_BY_KEY[key] ?? "";
};
