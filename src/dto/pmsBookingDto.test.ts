import { describe, expect, it } from "vitest";
import {
  buildBookingCalendarViewData,
  buildCreateBookingPayload,
  extractCategoryPricePeriods,
  type PmsBooking,
  type PmsCategory,
  type PmsObject,
} from "./pmsBookingDto";
import type { Booking } from "../types/booking-calendar";

const categoriesFixture: PmsCategory[] = [
  {
    id: 19182,
    name: "Комфорт+ (корпус №3, этаж 1)",
    code: "",
    price_staff_0104_3105: "7500",
    price_staff_0106_1506: "8500",
    price_staff_1606_3108: "10500",
    price_staff_0109_2709: "11000",
    price_private_0104_3105: "7500",
    price_private_0106_1506: "8500",
    price_private_1606_3108: "11000",
    price_private_0109_2709: "10500",
    payment_type: "За номер",
    price_additionally_place: "2150",
  },
  {
    id: 19183,
    name: "Стандарт с кондиционером (корпус №3)",
    code: "",
    price_private_0104_3105: "6200",
    price_private_0106_1506: "6400",
    price_private_1606_3108: "7500",
    price_private_0109_2709: "7300",
    payment_type: "За номер",
    price_additionally_place: "2150",
  },
];

const objectsFixture: PmsObject[] = [
  {
    id: 21354,
    name: "Номер 101 — Комфорт +",
    code: "",
    corpse: "3",
    floor: "1",
    number: "101",
    room_type: {
      id: 19182,
      name: "Комфорт+ (корпус №3, этаж 1)",
    },
    capacity: "4",
    air_conditioning: "Да",
    balcony: "Да",
    bed_type: "двухспальная",
    view: "вид во внутренний двор",
  },
  {
    id: 21383,
    name: "Номер 217 — Стандарт с кондиционером",
    code: "",
    corpse: "3",
    floor: "2",
    number: "217",
    room_type: {
      id: 19183,
      name: "Стандарт с кондиционером (корпус №3)",
    },
    capacity: "2",
    air_conditioning: "Да",
    balcony: "Да",
    bed_type: "2 односпальных",
    view: "вид во внутренний двор",
  },
];

describe("extractCategoryPricePeriods", () => {
  it("parses live PMS price period keys including September ranges", () => {
    const periods = extractCategoryPricePeriods(categoriesFixture[0] as PmsCategory);

    expect(periods.map((period) => period.key)).toEqual([
      "price_private_0104_3105",
      "price_private_0106_1506",
      "price_private_1606_3108",
      "price_private_0109_2709",
      "price_staff_0104_3105",
      "price_staff_0106_1506",
      "price_staff_1606_3108",
      "price_staff_0109_2709",
    ]);
  });
});

describe("buildBookingCalendarViewData", () => {
  it("builds reverse category lookups from rooms returned by PMS", () => {
    const viewData = buildBookingCalendarViewData({
      categories: categoriesFixture,
      objects: objectsFixture,
      bookings: [],
    });

    expect(
      viewData.reverseLookups.categoryIdByName?.get(
        "Комфорт+ (корпус №3, этаж 1)",
      ),
    ).toBe(19182);
    expect(
      viewData.reverseLookups.categoryIdByRoomName?.get("Номер 101 — Комфорт +"),
    ).toBe(19182);
    expect(
      viewData.reverseLookups.categoryNameByRoomName?.get(
        "Номер 101 — Комфорт +",
      ),
    ).toBe("Комфорт+ (корпус №3, этаж 1)");
  });

  it("resolves booking.category ids from bookings.php into category names", () => {
    const bookingsFixture: PmsBooking[] = [
      {
        id: 22126,
        name: "Бронь: Тестовый гость",
        room: "21383",
        category: "19183",
        date_from: "15.07.2026 18:00:00",
        date_to: "27.07.2026 14:00:00",
        status: "Внесена предоплата",
        price: "90000",
        paid: "27000",
        client_fio: "Тестовый гость",
        client_type: "Гость",
        phone: "+7 (999) 000-00-00",
        email: "guest@example.com",
        count_guest: "2",
        guests: "[]",
        count_parking_plases: "0",
        prepayment_percentage: "30",
      },
    ];

    const viewData = buildBookingCalendarViewData({
      categories: categoriesFixture,
      objects: objectsFixture,
      bookings: bookingsFixture,
    });

    const roomRow = viewData.lists
      .flatMap((list) => list.items)
      .find((item) => item.id === "21383");
    const booking = roomRow?.bookings[0];

    expect(booking?.room).toBe("Номер 217 — Стандарт с кондиционером");
    expect(booking?.category).toBe("Стандарт с кондиционером (корпус №3)");
  });
});

describe("buildCreateBookingPayload", () => {
  it("prefers the room-based category id over free-form category text", () => {
    const { reverseLookups } = buildBookingCalendarViewData({
      categories: categoriesFixture,
      objects: objectsFixture,
      bookings: [],
    });

    const booking: Booking = {
      id: "tmp-21354-2026-04-13-2026-04-17",
      status: "Ожидает оплаты",
      name: "1111",
      phone: "+7 (958) 479-85-74",
      guests: 1,
      parkingPlaces: 0,
      clientType: "Гость",
      category: "Комфорт +",
      room: "Номер 101 — Комфорт +",
      checkIn: "13.04.2026 15:35",
      checkOut: "17.04.2026 20:35",
      total: 30000,
      paid: 0,
      startKey: "2026-04-13",
      endKey: "2026-04-17",
      email: "qweqwe",
      bookingName: "tttttt",
      comment: "",
      paymentDate: "",
      paymentHref: "",
      additionalPaymentLink: "",
      prepaymentPercentage: 0,
      guestList: [],
      extraPlace: false,
    };

    const payload = buildCreateBookingPayload(booking, reverseLookups);

    expect(payload).toMatchObject({
      room: 21354,
      category: "Комфорт+ (корпус №3, этаж 1)",
      category_id: 19182,
      date_from: "2026-04-13 15:35:00",
      date_to: "2026-04-17 20:35:00",
      status: "Ожидает оплаты",
      count_guest: 1,
    });
  });
});
