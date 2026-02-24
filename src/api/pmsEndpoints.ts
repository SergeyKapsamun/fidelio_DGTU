export const BASE_URL = "https://sok-raduga.donstu.ru/api";

export type QueryParam = {
  name: string;
  value: string | number | boolean;
};

export const addParamsToUrl = (url: string, params: QueryParam[] = []) => {
  if (!Array.isArray(params) || !params.length) {
    return url;
  }
  let result = url;
  params.forEach((param) => {
    if (param.value === undefined || param.value === null) {
      return;
    }
    const separator = result.includes("?") ? "&" : "?";
    result = `${result}${separator}${encodeURIComponent(
      param.name,
    )}=${encodeURIComponent(String(param.value))}`;
  });
  return result;
};

export const endpoints = {
  categories: () => `${BASE_URL}/categories.php`,
  objects: () => `${BASE_URL}/rooms.php`,
  bookings: () => `${BASE_URL}/bookings.php`,
  createBooking: () => `${BASE_URL}/create-booking-chess.php`,
  updateBooking: () => `${BASE_URL}/update-booking-chess.php`,
  generateAdditionalPaymentLink: () => `${BASE_URL}/link.php`,
};
