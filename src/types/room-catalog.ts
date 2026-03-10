// Типы каталога комнат и ответов PMS `/api/rooms.php`, `/api/categories.php`, `/api/bookings.php`.

export type RoomType = {
  id: number;
  name: string;
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
};

export type Room = {
  id: number;
  name: string;
  code?: string | null;
  corpse?: string | number | null;
  floor?: string | number | null;
  number?: string | null;
  room_type?: RoomType | null;
  capacity?: string | number | null;
  air_conditioning?: string | null;
  balcony?: string | null;
  bed_type?: string | null;
  view?: string | null;
};

export type RoomServiceData = {
  elements: Room[];
};

export type BookingGuestPayload = {
  full_name?: string | null;
  birth_date?: string | null;
  phone?: string | null;
  [key: string]: unknown;
};

export type BookingRecord = {
  booking_id?: number | string;
  id?: number | string;
  name?: string | null;
  code?: string | null;
  room?: number | string | null;
  room_id?: number | string | null;
  object_id?: number | string | null;
  category?: number | string | null;
  category_id?: number | string | null;
  date_from?: string | null;
  date_to?: string | null;
  date_arrival?: string | null;
  date_of_departure?: string | null;
  status?: string | number | null;
  price?: string | number | null;
  full_price?: string | number | null;
  paid?: string | number | null;
  payed?: string | number | null;
  date_of_payment?: string | null;
  href_of_payment?: string | null;
  client_fio?: string | null;
  client_type?: string | null;
  phone?: string | null;
  email?: string | null;
  additional_place?: string | number | null;
  count_guest?: string | number | null;
  comment?: string | null;
  count_parking_plases?: string | number | null;
  count_parking_places?: string | number | null;
  countParkingPlaces?: string | number | null;
  guests?: string | BookingGuestPayload[] | null;
  prepayment_percentage?: string | number | null;
  additional_payment_link?: string | null;
  linked_lead?: number | string | null;
  [key: string]: unknown;
};

export type RoomTypesPhpResponse = {
  success: boolean;
  count: number;
  parking_plases_price?: string | number | null;
  parking_places_price?: string | number | null;
  parkingPlacesPrice?: string | number | null;
  count_parking_plases?: string | number | null;
  count_parking_places?: string | number | null;
  countParkingPlaces?: string | number | null;
  categories: RoomType[];
};
export type RoomTypesItemsResponse = { items: RoomType[] };
export type RoomTypesResponse = RoomTypesPhpResponse;
export type RoomsPhpResponse = {
  success: boolean;
  count: number;
  rooms: Room[];
};
export type RoomsItemsResponse = { items: Room[] };
export type RoomsResponse = RoomsPhpResponse;
export type BookingsPhpResponse = {
  success: boolean;
  count: number;
  bookings: BookingRecord[];
  rooms?: Room[];
};
export type BookingsItemsResponse = { items: BookingRecord[] };
export type BookingsResponse = BookingsPhpResponse;
export type RoomServiceDataResponse = { data: RoomServiceData };

export const catalogEndpoints = {
  roomTypes: () => "/api/room-types",
  rooms: () => "/api/rooms",
  roomServiceData: () => "/api/room-service-data",
};
