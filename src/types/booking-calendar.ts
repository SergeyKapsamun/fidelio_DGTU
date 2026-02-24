export type BookingId = string | number;

export type BookingGuest = {
  fullName: string;
  birthDate: string;
  phone?: string;
};

export type Booking = {
  id: BookingId;
  status: string;
  name: string;
  phone: string;
  guests: number;
  parkingPlaces?: number;
  clientType?: string;
  category?: string;
  room?: string;
  checkIn: string;
  checkOut: string;
  total: number;
  paid: number;
  startKey: string;
  endKey: string;
  email?: string;
  bookingName?: string;
  paymentDate?: string;
  paymentHref?: string;
  additionalPaymentLink?: string;
  prepaymentPercentage?: number;
  guestList?: BookingGuest[];
  extraPlace?: boolean;
};

export type CalendarItem = {
  id: string;
  name: string;
  bookings: Booking[];
};

export type CalendarList = {
  id: string;
  name: string;
  items: CalendarItem[];
};

export type StatusOption = {
  value: string;
  label: string;
  color?: string;
};

export type CalendarChange =
  | {
      type: "booking:create" | "booking:update";
      listId: string;
      itemId: string;
      booking: Booking;
    };
