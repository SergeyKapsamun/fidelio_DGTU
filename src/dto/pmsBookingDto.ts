import type { Booking, BookingGuest, CalendarList } from "../types/booking-calendar";
import {
  formatBookingUiDateTime,
  normalizeBookingDateKey,
  normalizeBookingDateTimeValue,
} from "../utils/bookingDateTime";

export type PmsBooking = {
  booking_id?: number | string;
  id?: number | string;
  code?: string | null;
  object_id?: number | string;
  room_id?: number | string;
  room?: number | string;
  category_id?: number | string;
  date_arrival?: string;
  date_of_departure?: string;
  date_from?: string;
  date_to?: string;
  full_price?: number | string;
  price?: number | string;
  payed?: number | string;
  paid?: number | string;
  status?: number | string;
  name?: string | null;
  date_of_payment?: string;
  href_of_payment?: string;
  additional_payment_link?: string;
  prepayment_percentage?: string | number | null;
  linked_lead?: number | string | null;
  client_type?: string | null;
  comment?: string | null;
  additional_place?: string | number | null;
  count_guest?: string | number | null;
  count_parking_plases?: string | number | null;
  guests?: string | BookingGuest[] | null;
  lead_guest?: {
    name?: string | null;
    phone?: string | null;
    emails?: string | null;
  };
  client_fio?: string | null;
  phone?: string | null;
  email?: string | null;
  [key: string]: unknown;
};

export type PmsCategoryPricePeriod = {
  type: "private" | "staff";
  from: {
    day: number;
    month: number;
    label: string;
  };
  to: {
    day: number;
    month: number;
    label: string;
  };
  price: number;
  key: string;
};

export type PmsCategory = {
  category_id?: number | string;
  id?: number | string;
  name?: string;
  title?: string;
  code?: string | null;
  price_staff_0104_3105?: string | number | null;
  price_staff_0106_1506?: string | number | null;
  price_staff_1606_3108?: string | number | null;
  price_staff_0209_2709?: string | number | null;
  price_private_0104_3105?: string | number | null;
  price_private_0106_1506?: string | number | null;
  price_private_1606_3108?: string | number | null;
  price_private_0209_2709?: string | number | null;
  payment_type?: string | null;
  price_additionally_place?: string | number | null;
  parking_plases_price?: string | number | null;
  parking_places_price?: string | number | null;
  parkingPlacesPrice?: string | number | null;
  pricePeriods?: PmsCategoryPricePeriod[];
  [key: string]: unknown;
};

export type PmsObject = {
  object_id?: number | string;
  room_id?: number | string;
  id?: number | string;
  number?: string | null;
  name?: string | null;
  code?: string | null;
  corpse?: string | number | null;
  floor?: string | number | null;
  capacity?: string | number | null;
  air_conditioning?: string | null;
  balcony?: string | null;
  bed_type?: string | null;
  view?: string | null;
  room_type?:
    | {
        id?: number | string | null;
        name?: string | null;
      }
    | string
    | null;
  category_id?: number | string | null;
  category?:
    | {
        category_id?: number | string | null;
        id?: number | string | null;
        name?: string | null;
        title?: string | null;
      }
    | string
    | null;
  category_name?: string | null;
  [key: string]: unknown;
};

type BookingLookupItem = {
  id: string | number;
  name: string;
};

type BookingLookups = {
  categories?: LookupMap;
  objects?: LookupMap;
};

export type BookingReverseLookups = {
  categoryIdByName?: Map<string, number | string>;
  objectIdByName?: Map<string, number | string>;
};

type LookupMap = Map<number | string, BookingLookupItem>;

type CategoryPriceType = "private" | "staff";

type CategoryPriceDate = {
  day: number;
  month: number;
  label: string;
};

const STATUS_PATTERNS = {
  cancelled: [/cancel/i, /отмен/i, /аннулир/i],
  request: [/заявк/i, /request/i],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const pickValue = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }
  return null;
};

const pickString = (record: Record<string, unknown>, keys: string[]) => {
  const value = pickValue(record, keys);
  if (value === null) {
    return "";
  }
  return String(value).trim();
};

const pickNumber = (record: Record<string, unknown>, keys: string[]) => {
  const value = pickValue(record, keys);
  if (value === null) {
    return null;
  }
  const numberValue =
    typeof value === "string" ? Number(value.replace(/\s+/g, "")) : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const pickId = (record: Record<string, unknown>, keys: string[]) =>
  pickValue(record, keys);

const normalizeId = (value: unknown): string | number | null => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  return null;
};

const pickIdValue = (record: Record<string, unknown>, keys: string[]) =>
  normalizeId(pickId(record, keys));

const normalizeStatusToCalendar = (status: unknown) => {
  if (typeof status === "string") {
    return status.trim();
  }
  if (typeof status === "number") {
    return String(status);
  }
  return "";
};

const normalizeStatusToApi = (status: string) => status.trim();

const isCancelledStatus = (status: unknown) => {
  const normalized = normalizeStatusToCalendar(status);
  if (!normalized) {
    return false;
  }
  return STATUS_PATTERNS.cancelled.some((pattern) => pattern.test(normalized));
};

const isRequestStatus = (status: unknown) => {
  const normalized = normalizeStatusToCalendar(status);
  if (!normalized) {
    return false;
  }
  return STATUS_PATTERNS.request.some((pattern) => pattern.test(normalized));
};

const toNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined) {
    return fallback;
  }
  const normalized =
    typeof value === "string" ? value.replace(/\s+/g, "") : value;
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const normalizeBoolean = (value: unknown) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value > 0 : false;
  }
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      return false;
    }
    if (["1", "true", "yes", "да", "y"].includes(trimmed)) {
      return true;
    }
    if (["0", "false", "no", "нет", "n"].includes(trimmed)) {
      return false;
    }
    const numberValue = Number(trimmed.replace(/\s+/g, ""));
    return Number.isFinite(numberValue) ? numberValue > 0 : false;
  }
  return false;
};

const PRICE_PERIOD_PATTERN =
  /^price_(staff|private)_(\d{2})(\d{2})_(\d{2})(\d{2})$/;

const parseDayMonth = (dayRaw: string, monthRaw: string): CategoryPriceDate | null => {
  const day = Number(dayRaw);
  const month = Number(monthRaw);
  if (!Number.isFinite(day) || !Number.isFinite(month)) {
    return null;
  }
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return null;
  }
  return {
    day,
    month,
    label: `${dayRaw}.${monthRaw}`,
  };
};

const normalizePriceValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const numberValue = Number(trimmed.replace(/\s+/g, ""));
    return Number.isFinite(numberValue) ? numberValue : null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  return null;
};

export const extractCategoryPricePeriods = (
  category: PmsCategory
): PmsCategoryPricePeriod[] => {
  if (!category || typeof category !== "object") {
    return [];
  }
  const record = category as Record<string, unknown>;
  const periods: PmsCategoryPricePeriod[] = [];

  Object.entries(record).forEach(([key, value]) => {
    const match = PRICE_PERIOD_PATTERN.exec(key);
    if (!match) {
      return;
    }
    const price = normalizePriceValue(value);
    if (price === null) {
      return;
    }
    const from = parseDayMonth(match[2] ?? "", match[3] ?? "");
    const to = parseDayMonth(match[4] ?? "", match[5] ?? "");
    if (!from || !to) {
      return;
    }
    periods.push({
      type: match[1] as CategoryPriceType,
      from,
      to,
      price,
      key,
    });
  });

  const typeOrder: Record<CategoryPriceType, number> = {
    private: 0,
    staff: 1,
  };
  periods.sort((a, b) => {
    const typeDiff = typeOrder[a.type] - typeOrder[b.type];
    if (typeDiff !== 0) {
      return typeDiff;
    }
    if (a.from.month !== b.from.month) {
      return a.from.month - b.from.month;
    }
    if (a.from.day !== b.from.day) {
      return a.from.day - b.from.day;
    }
    if (a.to.month !== b.to.month) {
      return a.to.month - b.to.month;
    }
    return a.to.day - b.to.day;
  });

  return periods;
};

const formatUiDateTime = (value?: string | null) => {
  return {
    dateKey: normalizeBookingDateKey(value),
    ui: formatBookingUiDateTime(value),
  };
};

const resolveName = (
  map: LookupMap | undefined,
  id: number | string | null | undefined,
  fallbackPrefix: string
) => {
  if (id === undefined || id === null) {
    return fallbackPrefix;
  }
  const match = map?.get(String(id));
  if (match?.name) {
    return match.name;
  }
  return `${fallbackPrefix} ${id}`;
};

const resolveNameWithLookup = (
  name: string,
  map: LookupMap | undefined,
  id: number | string | null | undefined,
  fallbackPrefix: string
) => {
  if (!name) {
    return resolveName(map, id, fallbackPrefix);
  }
  if (id !== null && id !== undefined && name === String(id)) {
    const lookup = map?.get(String(id));
    if (lookup?.name) {
      return lookup.name;
    }
  }
  return name;
};

const getCategoryId = (record: Record<string, unknown>) =>
  pickIdValue(record, ["category_id", "id", "categoryId"]);

const getCategoryName = (record: Record<string, unknown>) =>
  pickString(record, ["name", "title", "category_name", "categoryName"]);

const getObjectId = (record: Record<string, unknown>) =>
  pickIdValue(record, ["room", "room_id", "object_id", "objectId", "roomId", "id"]);

const getObjectName = (record: Record<string, unknown>) =>
  pickString(record, [
    "name",
    "number",
    "title",
    "room_name",
    "roomName",
  ]);

const getCorpseValue = (record: Record<string, unknown>) =>
  pickString(record, ["corpse", "building", "block"]);

const getCorpseLabel = (corpse: string) => {
  if (!corpse) {
    return "Без корпуса";
  }
  if (corpse === "3") {
    return "Корпус 3";
  }
  if (corpse === "10") {
    return "Ромашка";
  }
  return `Корпус ${corpse}`;
};

const normalizeCategoryName = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const extractCategoryNameFromRoom = (value: string) => {
  if (!value) {
    return "";
  }
  const parts = value.split(/\s+[—–-]\s+/);
  if (parts.length < 2) {
    return "";
  }
  return parts.slice(1).join(" - ").trim();
};

const buildCategoryNameMapFromLookup = (lookup?: LookupMap) => {
  const map = new Map<string, { id: string | number | null; name: string }>();
  if (!lookup) {
    return map;
  }
  lookup.forEach((value) => {
    if (!value?.name) {
      return;
    }
    map.set(normalizeCategoryName(value.name), {
      id: value.id ?? null,
      name: value.name,
    });
  });
  return map;
};

const getBookingCategoryId = (record: Record<string, unknown>) =>
  pickIdValue(record, [
    "category_id",
    "categoryId",
    "category",
    "room_type",
    "roomType",
  ]);


const extractGuestCount = (record: Record<string, unknown>) =>
  pickNumber(record, ["count_guest", "count_guests", "guests", "guest", "adults", "adult"]) ??
  0;

const normalizeGuestBirthDate = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }
  const isoMatch = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    if (!year || !month || !day) {
      return "";
    }
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const ruMatch = raw.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (ruMatch) {
    const [, day, month, year] = ruMatch;
    if (!year || !month || !day) {
      return "";
    }
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeGuestPhone = (value: unknown): string => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeGuestPhone(item);
      if (normalized) {
        return normalized;
      }
    }
    return "";
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "";
    }
    return String(value);
  }
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return normalizeGuestPhone(parsed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
};

const extractGuestPhone = (record: Record<string, unknown>) =>
  normalizeGuestPhone([
    pickValue(record, ["phone", "phone_number", "tel", "mobile"]),
    pickValue(record, ["phones", "phone_list", "phoneList", "phones_list"]),
  ]);

const mergeBookingPhones = (primaryPhone: string, guestPhones: string[]) => {
  const merged = new Set<string>();
  const normalizedPrimary = String(primaryPhone ?? "").trim();
  if (normalizedPrimary) {
    merged.add(normalizedPrimary);
  }
  (Array.isArray(guestPhones) ? guestPhones : []).forEach((phone) => {
    const normalized = String(phone ?? "").trim();
    if (normalized) {
      merged.add(normalized);
    }
  });
  return Array.from(merged).join(", ");
};

const normalizePrepaymentPercentage = (value: unknown) => {
  const numeric = Math.round(toNumber(value, 0));
  return Math.min(100, Math.max(0, numeric));
};

const parseGuestListRaw = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const normalizeGuestListItem = (value: unknown): BookingGuest | null => {
  if (!isRecord(value)) {
    return null;
  }
  const fullName = pickString(value, [
    "full_name",
    "fullName",
    "name",
    "fio",
    "client_fio",
    "clientFio",
  ]);
  const birthDate = normalizeGuestBirthDate(
    pickValue(value, [
      "birth_date",
      "birthDate",
      "date_of_birth",
      "dateOfBirth",
      "dob",
    ]),
  );
  const phone = extractGuestPhone(value);
  if (!fullName && !birthDate && !phone) {
    return null;
  }
  return { fullName, birthDate, phone };
};

const extractGuestList = (record: Record<string, unknown>): BookingGuest[] => {
  const guestsRaw = pickValue(record, ["guests", "guest_list", "guestList"]);
  return parseGuestListRaw(guestsRaw)
    .map(normalizeGuestListItem)
    .filter((item): item is BookingGuest => Boolean(item));
};

const serializeGuestList = (guestList: BookingGuest[] | undefined) => {
  const normalizedGuests = (Array.isArray(guestList) ? guestList : [])
    .map((guest) => ({
      full_name: String(guest.fullName ?? "").trim(),
      birth_date: normalizeGuestBirthDate(guest.birthDate),
      phone: normalizeGuestPhone(guest.phone),
    }))
    .filter((guest) => {
      const fullName = String(guest.full_name ?? "").trim();
      const birthDate = String(guest.birth_date ?? "").trim();
      const phone = String(guest.phone ?? "").trim();
      return Boolean(fullName || birthDate || phone);
    });
  return JSON.stringify(normalizedGuests);
};

const extractParkingPlacesCount = (record: Record<string, unknown>) =>
  pickNumber(record, [
    "count_parking_plases",
    "count_parking_places",
    "parking_places",
    "parking",
  ]) ?? 0;

const buildCategoryLookup = (categories?: PmsCategory[]) => {
  const map = new Map<string, BookingLookupItem>();
  if (!Array.isArray(categories)) {
    return map;
  }
  categories.forEach((category) => {
    if (!category || typeof category !== "object") {
      return;
    }
    const record = category as Record<string, unknown>;
    const id = getCategoryId(record);
    if (id === undefined || id === null) {
      return;
    }
    const name = getCategoryName(record) || `Category ${id}`;
    map.set(String(id), { id, name });
  });
  return map;
};

const buildObjectLookup = (objects?: PmsObject[]) => {
  const map = new Map<string, BookingLookupItem>();
  if (!Array.isArray(objects)) {
    return map;
  }
  objects.forEach((object) => {
    if (!object || typeof object !== "object") {
      return;
    }
    const record = object as Record<string, unknown>;
    const id = getObjectId(record);
    if (id === undefined || id === null) {
      return;
    }
    const name = getObjectName(record) || `Room ${id}`;
    map.set(String(id), { id, name });
  });
  return map;
};

const buildLookupMap = <T extends Record<string, unknown>>(
  items: T[] | null | undefined,
  idKeys: string[],
  nameKeys: string[]
) => {
  const map = new Map<number | string, BookingLookupItem>();
  if (!Array.isArray(items)) {
    return map;
  }
  items.forEach((item) => {
    if (!item || typeof item !== "object") {
      return;
    }
    const idKey = idKeys.find((key) => item[key] !== undefined);
    if (!idKey) {
      return;
    }
    const id = item[idKey];
    const key = String(id);
    const nameKey = nameKeys.find((key) => item[key]);
    const name = nameKey ? String(item[nameKey]) : `#${id}`;
    map.set(key, { id: id as string | number, name });
  });
  return map;
};

const buildReverseLookupMap = <T extends Record<string, unknown>>(
  items: T[] | null | undefined,
  idKeys: string[],
  nameKeys: string[]
) => {
  const map = new Map<string, number | string>();
  if (!Array.isArray(items)) {
    return map;
  }
  items.forEach((item) => {
    if (!item || typeof item !== "object") {
      return;
    }
    const idKey = idKeys.find((key) => item[key] !== undefined);
    if (!idKey) {
      return;
    }
    const id = item[idKey];
    if (id === undefined || id === null) {
      return;
    }
    nameKeys.forEach((key) => {
      const raw = item[key];
      if (!raw) {
        return;
      }
      const name = String(raw).trim();
      if (!name || map.has(name)) {
        return;
      }
      map.set(name, id as string | number);
    });
  });
  return map;
};

const buildOptionsFromLists = (lists: CalendarList[]) => {
  const roomSet = new Set<string>();
  lists.forEach((list) => {
    list.items.forEach((item) => {
      if (item.name) {
        roomSet.add(item.name);
      }
    });
  });

  return {
    roomOptions: Array.from(roomSet),
  };
};

const buildRoomOptionsByCategory = (objects?: PmsObject[]) => {
  const map: Record<string, string[]> = {};
  if (!Array.isArray(objects)) {
    return map;
  }
  objects.forEach((object) => {
    if (!object || typeof object !== "object") {
      return;
    }
    const record = object as Record<string, unknown>;
    const name = getObjectName(record);
    if (!name) {
      return;
    }
    const category = extractCategoryNameFromRoom(name);
    if (!category) {
      return;
    }
    if (!map[category]) {
      map[category] = [];
    }
    if (!map[category].includes(name)) {
      map[category].push(name);
    }
  });
  return map;
};

export type BookingCalendarViewData = {
  lists: CalendarList[];
  requests: Booking[];
  categoryOptions: string[];
  roomOptions: string[];
  roomOptionsByCategory: Record<string, string[]>;
  reverseLookups: BookingReverseLookups;
};

const buildCalendarLists = ({
  categories,
  objects,
  bookings,
  lookups = {},
}: {
  categories?: PmsCategory[] | null;
  objects?: PmsObject[] | null;
  bookings?: PmsBooking[] | null;
  lookups?: BookingLookups;
}): CalendarList[] => {
  const categoryLookup =
    lookups.categories ??
    buildCategoryLookup(Array.isArray(categories) ? categories : []);
  const objectLookup =
    lookups.objects ??
    buildObjectLookup(Array.isArray(objects) ? objects : []);
  const resolvedLookups: BookingLookups = {
    ...lookups,
    categories: categoryLookup,
    objects: objectLookup,
  };

  const listById = new Map<string, CalendarList>();
  const itemById = new Map<string, CalendarList["items"][number]>();
  const itemByName = new Map<string, CalendarList["items"][number]>();
  const order: string[] = [];

  const ensureList = (id: string, name: string) => {
    let list = listById.get(id);
    if (!list) {
      list = { id, name, items: [] };
      listById.set(id, list);
      order.push(id);
    }
    return list;
  };

  const ensureItem = (list: CalendarList, id: string, name: string) => {
    let item = list.items.find((entry) => entry.id === id);
    if (!item) {
      item = { id, name, bookings: [] };
      list.items.push(item);
    }
    itemById.set(id, item);
    if (name) {
      itemByName.set(name, item);
    }
    return item;
  };

  if (Array.isArray(objects)) {
    const hasObjects = objects.length > 0;
    objects.forEach((object) => {
      if (!object || typeof object !== "object") {
        return;
      }
      const objectId = getObjectId(object);
      if (objectId === undefined || objectId === null) {
        return;
      }
      const objectName = getObjectName(object) || `Room ${objectId}`;
      const corpse = getCorpseValue(object);
      const listId = corpse || "unknown";
      const listName = getCorpseLabel(corpse);
      const list = ensureList(String(listId), listName);
      ensureItem(list, String(objectId), objectName);
    });

    if (!hasObjects && Array.isArray(categories)) {
      categories.forEach((category) => {
        if (!category || typeof category !== "object") {
          return;
        }
        const id = getCategoryId(category);
        if (id === undefined || id === null) {
          return;
        }
        const name = getCategoryName(category) || `Category ${id}`;
        ensureList(String(id), name);
      });
    }
  }

  if (Array.isArray(bookings)) {
    bookings.forEach((booking, index) => {
      if (!booking || typeof booking !== "object") {
        return;
      }
      const record = booking as Record<string, unknown>;
      const roomValue = pickIdValue(record, [
        "room",
        "room_id",
        "object_id",
        "objectId",
        "roomId",
      ]);
      const dateFrom = pickString(record, [
        "date_from",
        "dateFrom",
        "date_arrival",
        "dateArrival",
        "check_in",
        "checkIn",
        "start",
        "from",
      ]);
      const dateTo = pickString(record, [
        "date_to",
        "dateTo",
        "date_of_departure",
        "dateDeparture",
        "check_out",
        "checkOut",
        "end",
        "to",
      ]);
      if (!dateFrom || !dateTo) {
        return;
      }
      const status = pickValue(record, ["status", "state"]);
      if (isCancelledStatus(status)) {
        return;
      }
      if (isRequestStatus(status)) {
        return;
      }
      const objectId = roomValue ?? null;
      const objectName = pickString(record, [
        "room_name",
        "room",
        "object_name",
        "number",
        "roomName",
      ]);
      let item = objectId !== null && objectId !== undefined
        ? itemById.get(String(objectId))
        : undefined;
      if (!item && objectName) {
        item = itemByName.get(objectName);
      }
      if (!item) {
        const listId = "unknown";
        const listName = getCorpseLabel("");
        const list = ensureList(String(listId), listName);
        const fallbackItemId =
          objectId !== null && objectId !== undefined
            ? String(objectId)
            : `room-${index}`;
        const fallbackItemName =
          objectName ||
          (objectId !== null && objectId !== undefined
            ? resolveName(objectLookup, objectId, "Room")
            : `Room ${index + 1}`);
        item = ensureItem(list, fallbackItemId, fallbackItemName);
      }
      item.bookings.push(toCalendarBooking(booking, resolvedLookups));
    });
  }

  const lists = order.map((id) => listById.get(id)).filter(Boolean) as CalendarList[];
  listById.forEach((list, id) => {
    if (!order.includes(id)) {
      lists.push(list);
    }
  });

  return lists;
};

export const buildBookingCalendarViewData = ({
  categories,
  objects,
  bookings,
}: {
  categories?: PmsCategory[] | null;
  objects?: PmsObject[] | null;
  bookings?: PmsBooking[] | null;
}): BookingCalendarViewData => {
  const categoriesList = Array.isArray(categories) ? categories : [];
  const objectsList = Array.isArray(objects) ? objects : [];

  const reverseLookups: BookingReverseLookups = {
    categoryIdByName: buildReverseLookupMap(
      categoriesList,
      ["category_id", "id"],
      ["name", "title", "category_name"]
    ),
    objectIdByName: buildReverseLookupMap(
      objectsList,
      ["object_id", "room_id", "id"],
      ["name", "number", "title", "room_name", "roomName"]
    ),
  };

  const categoryOptions = Array.from(
    new Set(
      categoriesList
        .map((category) => getCategoryName(category))
        .filter(Boolean)
    )
  );
  const roomOptionsByCategory = buildRoomOptionsByCategory(objectsList);
  const lookups: BookingLookups = {
    categories: buildLookupMap(categoriesList, ["category_id", "id"], [
      "name",
      "title",
      "category_name",
    ]),
    objects: buildLookupMap(objectsList, ["object_id", "room_id", "id"], [
      "name",
      "number",
      "title",
      "room_name",
      "roomName",
    ]),
  };

  const lists = buildCalendarLists({
    categories: categoriesList,
    objects: objectsList,
    bookings,
    lookups,
  });
  const requests = (Array.isArray(bookings) ? bookings : [])
    .filter((booking) => {
      if (!booking || typeof booking !== "object") {
        return false;
      }
      const record = booking as Record<string, unknown>;
      const status = pickValue(record, ["status", "state"]);
      return isRequestStatus(status);
    })
    .map((booking) => toCalendarBooking(booking, lookups));

  return {
    lists,
    requests,
    reverseLookups,
    categoryOptions,
    roomOptionsByCategory,
    ...buildOptionsFromLists(lists),
  };
};

const toCalendarBooking = (
  apiBooking: PmsBooking,
  lookups: BookingLookups = {}
): Booking => {
  const record = (apiBooking ?? {}) as Record<string, unknown>;
  const categoryNameMap = buildCategoryNameMapFromLookup(lookups.categories);
  const arrivalRaw = pickString(record, [
    "date_from",
    "dateFrom",
    "date_arrival",
    "dateArrival",
    "check_in",
    "checkIn",
    "start",
    "from",
  ]);
  const departureRaw = pickString(record, [
    "date_to",
    "dateTo",
    "date_of_departure",
    "dateDeparture",
    "check_out",
    "checkOut",
    "end",
    "to",
  ]);
  let arrival = formatUiDateTime(arrivalRaw);
  let departure = formatUiDateTime(departureRaw);
  if (
    arrival.dateKey &&
    departure.dateKey &&
    arrival.dateKey > departure.dateKey
  ) {
    const temp = arrival;
    arrival = departure;
    departure = temp;
  }

  const leadGuest = isRecord(record.lead_guest)
    ? (record.lead_guest as Record<string, unknown>)
    : null;

  const bookingName = pickString(record, [
    "booking_name",
    "bookingName",
    "title",
    "name",
  ]);

  const name =
    pickString(record, [
      "client_fio",
      "client_name",
      "fio",
      "name",
      "guest_name",
      "full_name",
    ]) || (leadGuest ? pickString(leadGuest, ["name", "full_name", "fio"]) : "");
  const primaryPhone =
    pickString(record, ["phone", "phone_number", "tel", "mobile"]) ||
    (leadGuest ? pickString(leadGuest, ["phone", "phone_number", "tel", "mobile"]) : "");
  const email =
    pickString(record, ["email", "emails", "mail"]) ||
    (leadGuest ? pickString(leadGuest, ["email", "emails", "mail"]) : "");

  const paymentDate = pickString(record, [
    "date_of_payment",
    "payment_date",
    "paid_at",
    "datePayment",
    "paymentDate",
  ]);
  const paymentHref = pickString(record, [
    "href_of_payment",
    "payment_href",
    "payment_link",
    "payment_url",
    "paymentUrl",
  ]);
  const additionalPaymentLink = pickString(record, [
    "additional_payment_link",
    "additionalPaymentLink",
    "additional_link",
    "additionalLink",
  ]);
  const comment = pickString(record, ["comment"]);
  const extraPlaceRaw = pickValue(record, [
    "additional_place",
    "additionalPlace",
  ]);
  const priceRaw = pickValue(record, ["full_price", "price", "total", "amount"]);
  const paidRaw = pickValue(record, ["payed", "paid", "payment", "pay"]);
  const total = toNumber(priceRaw, 0);
  const paid = toNumber(paidRaw, 0);

  const statusRaw = pickValue(record, ["status", "state"]);
  const normalizedStatus = normalizeStatusToCalendar(statusRaw);

  const roomId = pickIdValue(record, [
    "room",
    "room_id",
    "object_id",
    "objectId",
    "roomId",
  ]);
  const objectName = pickString(record, [
    "room_name",
    "room",
    "object_name",
    "number",
    "roomName",
  ]);
  const categoryId = getBookingCategoryId(record);
  const categoryName = pickString(record, [
    "category",
    "category_name",
    "categoryName",
  ]);

  const guestList = extractGuestList(record);
  const guestPhones = guestList
    .map((guest) => String(guest.phone ?? "").trim())
    .filter(Boolean);
  const guestTotal = Math.max(extractGuestCount(record), guestList.length);
  const parkingPlaces = extractParkingPlacesCount(record);
  const prepaymentPercentage = normalizePrepaymentPercentage(
    pickValue(record, ["prepayment_percentage", "prepaymentPercentage"]),
  );

  const fallbackBookingId =
    pickIdValue(record, ["booking_id", "id", "bookingId", "order_id"]) ??
    `tmp-${String(roomId ?? "booking")}-${arrival.dateKey || "unknown"}-${departure.dateKey || "unknown"}`;

  const resolvedRoomName = objectName
    ? resolveNameWithLookup(objectName, lookups.objects, roomId, "Room")
    : roomId !== null && roomId !== undefined
      ? resolveName(lookups.objects, roomId, "Room")
      : "";
  const categoryFromRoom = extractCategoryNameFromRoom(resolvedRoomName);
  const resolvedCategoryName = (() => {
    if (categoryName) {
      return resolveNameWithLookup(categoryName, lookups.categories, categoryId, "Category");
    }
    if (categoryFromRoom) {
      const normalized = normalizeCategoryName(categoryFromRoom);
      const mapped = categoryNameMap.get(normalized);
      return mapped?.name ?? categoryFromRoom;
    }
    return resolveName(lookups.categories, categoryId, "Category");
  })();

  return {
    id: fallbackBookingId as string | number,
    status: normalizedStatus,
    name,
    bookingName,
    phone: mergeBookingPhones(primaryPhone, guestPhones),
    clientType: pickString(record, ["client_type", "clientType"]),
    guests: guestTotal,
    parkingPlaces,
    category: resolvedCategoryName,
    room: resolvedRoomName,
    checkIn: arrival.ui,
    checkOut: departure.ui,
    total,
    paid,
    startKey: arrival.dateKey,
    endKey: departure.dateKey,
    email,
    comment,
    paymentDate,
    paymentHref,
    additionalPaymentLink,
    prepaymentPercentage,
    guestList,
    extraPlace: normalizeBoolean(extraPlaceRaw),
  };
};

const buildDateTimeValueFromUi = (
  value: string | undefined,
  fallbackDateKey?: string,
) =>
  normalizeBookingDateTimeValue(value) ||
  normalizeBookingDateTimeValue(fallbackDateKey);

export const toPmsBookingPayload = (
  booking: Booking,
  lookups: BookingReverseLookups = {}
) => {
  const roomName = booking.room ?? "";
  const roomId =
    lookups.objectIdByName?.get(roomName) ??
    (Number.isFinite(Number(roomName)) ? Number(roomName) : roomName) ??
    null;
  const categoryName = booking.category ?? "";
  const categoryId =
    lookups.categoryIdByName?.get(categoryName) ??
    (Number.isFinite(Number(categoryName)) ? Number(categoryName) : categoryName) ??
    null;

  const dateFrom = buildDateTimeValueFromUi(booking.checkIn, booking.startKey);
  const dateTo = buildDateTimeValueFromUi(booking.checkOut, booking.endKey);
  const parkingPlaces = Math.max(0, Math.round(toNumber(booking.parkingPlaces, 0)));
  const guestList = Array.isArray(booking.guestList) ? booking.guestList : [];
  const guestCount = Math.max(
    0,
    Math.round(toNumber(booking.guests, 0)),
    guestList.length,
  );
  const prepaymentPercentage = normalizePrepaymentPercentage(
    booking.prepaymentPercentage,
  );

  return {
    room: roomId,
    category: categoryName,
    category_id: categoryId,
    date_from: dateFrom,
    date_to: dateTo,
    status: normalizeStatusToApi(booking.status ?? ""),
    price: booking.total ?? 0,
    paid: booking.paid ?? 0,
    date_of_payment: booking.paymentDate ?? "",
    href_of_payment: booking.paymentHref ?? "",
    additional_payment_link: booking.additionalPaymentLink ?? "",
    prepayment_percentage: prepaymentPercentage,
    additional_place: booking.extraPlace ? 1 : 0,
    count_guest: guestCount,
    guests: serializeGuestList(guestList),
    count_parking_plases: parkingPlaces,
    name: booking.bookingName ?? "",
    client_fio: booking.name ?? "",
    client_type: booking.clientType ?? "",
    comment: booking.comment ?? "",
    phone: booking.phone ?? "",
    email: booking.email ?? "",
  };
};

export const buildCreateBookingPayload = (
  booking: Booking,
  lookups: BookingReverseLookups = {}
) => toPmsBookingPayload(booking, lookups);

export const buildUpdateBookingPayload = (
  booking: Booking,
  lookups: BookingReverseLookups = {}
) => toPmsBookingPayload(booking, lookups);
