import type { BookingGuest } from "./booking-calendar";

export type BookingForm = {
  id?: number | string;
  status: string;
  room: string;
  dateFrom: string;
  dateTo: string;
  bookingName: string;
  clientFio: string;
  phone: string;
  email: string;
  clientType?: string;
  guests: number;
  parkingPlaces: number;
  price: number;
  paid: number;
  dateOfPayment: string;
  paymentHref: string;
  additionalPaymentLink: string;
  prepaymentPercentage: number;
  guestList: BookingGuest[];
  category?: string;
  extraPlace?: boolean;
};
