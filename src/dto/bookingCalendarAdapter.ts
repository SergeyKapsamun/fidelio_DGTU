import { storeToRefs } from "pinia";
import { usePmsStore } from "../stores/pmsStore";
import type { Booking, CalendarChange } from "../types/booking-calendar";
import {
  buildBookingCalendarViewData,
  buildCreateBookingPayload,
  buildUpdateBookingPayload,
  type BookingCalendarViewData,
  type BookingReverseLookups,
  type PmsBooking,
  type PmsCategory,
  type PmsObject,
} from "./pmsBookingDto";

export type CalendarLoadParams = {
  from?: string;
  to?: string;
};

export type BookingCalendarAdapterOptions = {
  loadParams?: CalendarLoadParams;
};

export const useBookingCalendarAdapter = (
  options: BookingCalendarAdapterOptions = {}
) => {
  const pmsStore = usePmsStore();
  const { error } = storeToRefs(pmsStore);
  const resolvedLoadParams: CalendarLoadParams = {
    from: options.loadParams?.from ?? "2026-01-12",
    to: options.loadParams?.to ?? "2026-02-11",
  };

  const loadCalendarData = async (
    overrides: CalendarLoadParams = {}
  ): Promise<BookingCalendarViewData> => {
    const mergedOverrides = Object.fromEntries(
      Object.entries(overrides).filter(([, value]) => value !== undefined)
    ) as CalendarLoadParams;
    const loadParams: CalendarLoadParams = {
      ...resolvedLoadParams,
      ...mergedOverrides,
    };
    const [categories, roomsPayload, bookingsPayload] = (await Promise.all([
      pmsStore.fetchCategories(),
      pmsStore.fetchObjects(),
      pmsStore.fetchBookings({
        from: loadParams.from,
        to: loadParams.to,
      }),
    ])) as [
      PmsCategory[] | null,
      PmsObject[] | null,
      unknown[] | Record<string, unknown> | null,
    ];

    const bookings: PmsBooking[] | null =
      Array.isArray(bookingsPayload)
        ? (bookingsPayload as PmsBooking[])
        : bookingsPayload && typeof bookingsPayload === "object"
          ? (bookingsPayload as { bookings?: PmsBooking[] }).bookings ?? null
          : null;

    const roomsFromBookings =
      bookingsPayload && typeof bookingsPayload === "object"
        ? (bookingsPayload as { rooms?: PmsObject[] }).rooms ?? null
        : null;

    const rooms = Array.isArray(roomsPayload) ? roomsPayload : [];
    const roomsById = new Map<string, PmsObject>();
    rooms.forEach((item) => {
      if (!item || typeof item !== "object") {
        return;
      }
      const id = item.id ?? item.object_id;
      if (id === undefined || id === null) {
        return;
      }
      roomsById.set(String(id), item);
    });

    const objects: PmsObject[] | null = Array.isArray(roomsFromBookings)
      ? roomsFromBookings
          .map((item) => {
            if (!item || typeof item !== "object") {
              return null;
            }
            const record = item as Record<string, unknown>;
            const id = record.id ?? record.object_id ?? record.room_id;
            if (id === undefined || id === null) {
              return null;
            }
            const merged = { ...record };
            const fromRooms = roomsById.get(String(id));
            if (fromRooms) {
              Object.assign(merged, fromRooms);
            }
            return merged as PmsObject;
          })
          .filter((item): item is PmsObject => Boolean(item))
      : roomsPayload;

    return buildBookingCalendarViewData({
      categories,
      objects,
      bookings,
    });
  };

  const createBooking = async (
    booking: Booking,
    reverseLookups: BookingReverseLookups
  ) => {
    const data = buildCreateBookingPayload(booking, reverseLookups);
    const result = await pmsStore.createBooking({
      data,
    });
    const createdId = (result as { booking_id?: string | number } | null)
      ?.booking_id;
    if (createdId !== undefined && createdId !== null) {
      booking.id = createdId;
    }
    return Boolean(result);
  };

  const updateBooking = async (
    booking: Booking,
    reverseLookups: BookingReverseLookups
  ) => {
    const data = buildUpdateBookingPayload(booking, reverseLookups);
    const result = await pmsStore.updateBooking({
      bookingId: booking.id,
      data,
    });
    const updatedId = (result as { booking_id?: string | number } | null)
      ?.booking_id;
    if (updatedId !== undefined && updatedId !== null) {
      booking.id = updatedId;
    }
    return Boolean(result);
  };

  const applyCalendarChange = async (
    payload: CalendarChange,
    reverseLookups: BookingReverseLookups
  ) => {
    if (payload.type === "booking:create") {
      return createBooking(payload.booking, reverseLookups);
    }

    if (payload.type === "booking:update") {
      return updateBooking(payload.booking, reverseLookups);
    }
    return true;
  };

  return {
    loadCalendarData,
    applyCalendarChange,
    error,
  };
};
