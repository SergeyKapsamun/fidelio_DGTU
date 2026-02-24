import { request, type ApiError } from "./pmsClient";
import { endpoints, type QueryParam } from "./pmsEndpoints";
import { extractCategoryPricePeriods, type PmsCategory } from "../dto/pmsBookingDto";
import { resolveCurrentJwtToken } from "../auth/chessAuth";

type RequestCallbacks<T = unknown> = {
  onSuccess?: (data: T | null) => void;
  onError?: (error: ApiError) => void;
};

type PmsCategoriesResponse = {
  categories: PmsCategory[];
  countParkingPlaces: number | null;
};

type AdditionalPaymentLinkResponse = {
  additionalPaymentLink: string;
};

const pickList = <T = unknown>(payload: unknown, keys: string[]): T[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(record[key])) {
      return record[key] as T[];
    }
  }
  return [];
};

const resolveList = <T = unknown>(payload: unknown, keys: string[]): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  return pickList<T>(payload, keys);
};

const toFiniteNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized =
    typeof value === "string" ? value.trim().replace(/\s+/g, "") : value;
  const numericValue = Number(normalized);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const resolveCountParkingPlaces = (payload: unknown): number | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const record = payload as Record<string, unknown>;
  return (
    toFiniteNumber(record.count_parking_plases) ??
    toFiniteNumber(record.count_parking_places) ??
    toFiniteNumber(record.countParkingPlaces)
  );
};

const resolveParkingPlacesPrice = (payload: unknown): number | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const record = payload as Record<string, unknown>;
  return (
    toFiniteNumber(record.parking_plases_price) ??
    toFiniteNumber(record.parking_places_price) ??
    toFiniteNumber(record.parkingPlacesPrice)
  );
};

const resolveCategoryParkingPlacesPrice = (category: PmsCategory): number | null => {
  const record = category as Record<string, unknown>;
  return (
    toFiniteNumber(record.parking_plases_price) ??
    toFiniteNumber(record.parking_places_price) ??
    toFiniteNumber(record.parkingPlacesPrice)
  );
};

const toTrimmedString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const resolveAdditionalPaymentLink = (payload: unknown): string => {
  if (typeof payload === "string") {
    return payload.trim();
  }
  if (!payload || typeof payload !== "object") {
    return "";
  }
  const record = payload as Record<string, unknown>;
  const candidates = [
    record.additional_payment_link,
    record.additionalPaymentLink,
    record.additional_link,
    record.additionalLink,
    record.payment_link,
    record.paymentLink,
    record.link,
    record.url,
  ];
  for (const candidate of candidates) {
    const normalized = toTrimmedString(candidate);
    if (normalized) {
      return normalized;
    }
  }
  const nested = [record.data, record.result, record.payload];
  for (const value of nested) {
    const normalized = resolveAdditionalPaymentLink(value);
    if (normalized) {
      return normalized;
    }
  }
  return "";
};

const buildDateParams = ({
  from,
  to,
}: {
  from?: string;
  to?: string;
}): QueryParam[] => {
  const params: QueryParam[] = [];
  if (from) {
    params.push({ name: "date_from", value: from });
    params.push({ name: "from", value: from });
  }
  if (to) {
    params.push({ name: "date_to", value: to });
    params.push({ name: "to", value: to });
  }
  return params;
};

const buildJwtAuthorizationHeaders = () => {
  const jwt = resolveCurrentJwtToken();
  if (!jwt) {
    return undefined;
  }
  return {
    Authorization: `Bearer ${jwt}`,
  };
};

export const pmsApi = {
  getCategories: (
    params: RequestCallbacks<PmsCategoriesResponse> = {}
  ) => {
    const { ...callbacks } = params;
    return request({
      url: endpoints.categories(),
      errorMessage: "Не удалось получить категории",
      adapt: (payload) => {
        const parkingPlacesPrice = resolveParkingPlacesPrice(payload);
        return {
          categories: resolveList<PmsCategory>(payload, [
            "categories",
            "items",
            "data",
          ]).map((category) => {
            const categoryParkingPlacesPrice =
              resolveCategoryParkingPlacesPrice(category) ?? parkingPlacesPrice;
            return {
              ...category,
              parking_plases_price:
                categoryParkingPlacesPrice ?? category.parking_plases_price,
              pricePeriods: extractCategoryPricePeriods(category),
            };
          }),
          countParkingPlaces: resolveCountParkingPlaces(payload),
        };
      },
      ...callbacks,
    });
  },

  getObjects: (
    params: RequestCallbacks = {}
  ) => {
    const { ...callbacks } = params;
    return request({
      url: endpoints.objects(),
      errorMessage: "Не удалось получить список номеров",
      adapt: (payload) =>
        resolveList(payload, ["rooms", "objects", "items", "data"]),
      ...callbacks,
    });
  },

  getBookings: (
    params: {
      from?: string;
      to?: string;
    } & RequestCallbacks = {}
  ) => {
    const { from, to, ...callbacks } = params;
    return request({
      url: endpoints.bookings(),
      params: buildDateParams({ from, to }),
      headers: buildJwtAuthorizationHeaders(),
      errorMessage: "Не удалось получить бронирования",
      ...callbacks,
    });
  },

  createBookings: (
    params: {
      data: unknown;
    } & RequestCallbacks
  ) => {
    const { data, ...callbacks } = params;
    return request({
      url: endpoints.createBooking(),
      method: "POST",
      data,
      headers: buildJwtAuthorizationHeaders(),
      errorMessage: "Не удалось создать бронь",
      ...callbacks,
    });
  },

  changeBooking: (
    params: { bookingId: string | number; data: unknown } & RequestCallbacks
  ) => {
    const { bookingId, data, ...callbacks } = params;
    const requestData =
      data && typeof data === "object"
        ? { ...(data as Record<string, unknown>), booking_id: bookingId }
        : { booking_id: bookingId, data };
    return request({
      url: endpoints.updateBooking(),
      method: "POST",
      data: requestData,
      headers: buildJwtAuthorizationHeaders(),
      errorMessage: "Не удалось изменить бронь",
      ...callbacks,
    });
  },

  generateAdditionalPaymentLink: (
    params: {
      id: string;
    } & RequestCallbacks<AdditionalPaymentLinkResponse>
  ) => {
    const { id, ...callbacks } = params;
    return request({
      url: endpoints.generateAdditionalPaymentLink(),
      method: "POST",
      data: { id: String(id) },
      headers: buildJwtAuthorizationHeaders(),
      errorMessage: "Не удалось сгенерировать ссылку доп. оплаты",
      adapt: (payload) => {
        const additionalPaymentLink = resolveAdditionalPaymentLink(payload);
        if (!additionalPaymentLink) {
          throw new Error("Сервис не вернул ссылку доп. оплаты");
        }
        return { additionalPaymentLink };
      },
      ...callbacks,
    });
  },
};
