export type BookingDateTimeParts = {
  year: string;
  month: string;
  day: string;
  hours: string;
  minutes: string;
  seconds: string;
  hasTime: boolean;
};

const DEFAULT_TIME = "00:00:00";

const normalizeTimeValue = (value: string) => {
  const match = String(value ?? "").match(/(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) {
    return DEFAULT_TIME;
  }
  return `${match[1]}:${match[2]}:${match[3] ?? "00"}`;
};

export const parseBookingDateTime = (
  value: string | null | undefined,
): BookingDateTimeParts | null => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return null;
  }

  let datePart = trimmed;
  let timePart = "";

  if (trimmed.includes("T")) {
    const [date = "", time = ""] = trimmed.split("T");
    datePart = date;
    timePart = time;
  } else if (trimmed.includes(" ")) {
    const [date = "", time = ""] = trimmed.split(/\s+/, 2);
    datePart = date;
    timePart = time;
  }

  const isoMatch = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const isoSlashMatch = datePart.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  const ruMatch = datePart.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  const ruSlashMatch = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  let year = "";
  let month = "";
  let day = "";

  if (isoMatch || isoSlashMatch) {
    const match = isoMatch ?? isoSlashMatch;
    if (!match) {
      return null;
    }
    year = match[1] ?? "";
    month = match[2] ?? "";
    day = match[3] ?? "";
  } else if (ruMatch || ruSlashMatch) {
    const match = ruMatch ?? ruSlashMatch;
    if (!match) {
      return null;
    }
    day = match[1] ?? "";
    month = match[2] ?? "";
    year = match[3] ?? "";
  } else {
    return null;
  }

  if (!year || !month || !day) {
    return null;
  }

  const timeMatch = timePart.match(/(\d{2}):(\d{2})(?::(\d{2}))?/);
  return {
    year,
    month: month.padStart(2, "0"),
    day: day.padStart(2, "0"),
    hours: (timeMatch?.[1] ?? "00").padStart(2, "0"),
    minutes: (timeMatch?.[2] ?? "00").padStart(2, "0"),
    seconds: (timeMatch?.[3] ?? "00").padStart(2, "0"),
    hasTime: Boolean(timeMatch),
  };
};

export const normalizeBookingDateKey = (
  value: string | null | undefined,
): string => {
  const parts = parseBookingDateTime(value);
  if (!parts) {
    return "";
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const extractBookingTime = (
  value: string | null | undefined,
  fallback = "",
): string => {
  const parts = parseBookingDateTime(value);
  if (!parts?.hasTime) {
    return fallback;
  }
  return `${parts.hours}:${parts.minutes}`;
};

export const normalizeBookingDateTimeValue = (
  value: string | null | undefined,
  fallbackTime = DEFAULT_TIME,
): string => {
  const parts = parseBookingDateTime(value);
  if (!parts) {
    return "";
  }
  const normalizedTime = parts.hasTime
    ? `${parts.hours}:${parts.minutes}:${parts.seconds}`
    : normalizeTimeValue(fallbackTime);
  return `${parts.year}-${parts.month}-${parts.day} ${normalizedTime}`;
};

export const formatBookingUiDateTime = (
  value: string | null | undefined,
  fallbackTime = DEFAULT_TIME,
): string => {
  const parts = parseBookingDateTime(value);
  if (!parts) {
    return "";
  }
  const normalizedTime = parts.hasTime
    ? `${parts.hours}:${parts.minutes}`
    : normalizeTimeValue(fallbackTime).slice(0, 5);
  return `${parts.day}.${parts.month}.${parts.year} ${normalizedTime}`;
};

export const formatBookingUiDateTimeFromParts = (
  dateKey: string | null | undefined,
  timeValue: string | null | undefined,
): string => {
  const normalizedDateKey = normalizeBookingDateKey(dateKey);
  if (!normalizedDateKey) {
    return "";
  }
  const [year = "", month = "", day = ""] = normalizedDateKey.split("-");
  if (!year || !month || !day) {
    return "";
  }
  const time = normalizeTimeValue(timeValue ?? DEFAULT_TIME).slice(0, 5);
  return `${day}.${month}.${year} ${time}`;
};

export const toBookingDate = (
  value: string | null | undefined,
  fallbackTime = DEFAULT_TIME,
): Date | null => {
  const normalized = normalizeBookingDateTimeValue(value, fallbackTime);
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/,
  );
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hours = Number(match[4]);
  const minutes = Number(match[5]);
  const seconds = Number(match[6]);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds)
  ) {
    return null;
  }
  return new Date(year, month - 1, day, hours, minutes, seconds, 0);
};
