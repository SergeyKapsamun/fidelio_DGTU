// Оставлены только ключи, которые реально используются в текущем проекте.

export type RoomType = {
  id: number;
  name: string;
};

export type Room = {
  id: number;
  name: string;
};

export type RoomServiceData = {
  elements: Room[];
};

export type RoomTypesResponse = { items: RoomType[] };
export type RoomsResponse = { items: Room[] };
export type RoomServiceDataResponse = { data: RoomServiceData };

export const catalogEndpoints = {
  roomTypes: () => "/api/room-types",
  rooms: () => "/api/rooms",
  roomServiceData: () => "/api/room-service-data",
};

