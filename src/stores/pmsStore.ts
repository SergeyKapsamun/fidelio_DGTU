import { defineStore } from "pinia";
import { ref } from "vue";
import { pmsApi } from "../api/pmsApi";
import type { ApiError } from "../api/pmsClient";
import type { PmsCategory, PmsObject } from "../dto/pmsBookingDto";

type RequestCallbacks<T> = {
  onSuccess?: (data: T | null) => void;
  onError?: (error: ApiError) => void;
};

const runWithState = async <T>(
  requestFactory: (callbacks: RequestCallbacks<T>) => Promise<T | null>,
  setLoading: (value: boolean) => void,
  setError: (value: string | null) => void
) => {
  setLoading(true);
  setError(null);
  const result = await requestFactory({
    onError: (error) => setError(error.message),
  });
  setLoading(false);
  return result;
};

export const usePmsStore = defineStore("pms", () => {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const categories = ref<PmsCategory[] | null>(null);
  const objects = ref<PmsObject[] | null>(null);
  const countParkingPlaces = ref<number | null>(null);

  const fetchCategories = async () => {
    const result = await runWithState<{
      categories: PmsCategory[];
      countParkingPlaces: number | null;
    }>(
      (callbacks) => pmsApi.getCategories({ ...callbacks }),
      (value) => (loading.value = value),
      (value) => (error.value = value)
    );
    categories.value = Array.isArray(result?.categories)
      ? result.categories
      : null;
    countParkingPlaces.value =
      result?.countParkingPlaces !== null &&
      result?.countParkingPlaces !== undefined
        ? result.countParkingPlaces
        : null;
    return categories.value;
  };

  const fetchObjects = async () => {
    const result = await runWithState<PmsObject[]>(
      (callbacks) => pmsApi.getObjects({ ...callbacks }),
      (value) => (loading.value = value),
      (value) => (error.value = value)
    );
    objects.value = Array.isArray(result) ? result : null;
    return objects.value;
  };

  const fetchBookings = async (
    params: { from?: string; to?: string } = {}
  ) => {
    const result = await runWithState(
      (callbacks) => pmsApi.getBookings({ ...params, ...callbacks }),
      (value) => (loading.value = value),
      (value) => (error.value = value)
    );
    return result;
  };

  const createBooking = async (payload: {
    data: unknown;
  }) => {
    return runWithState(
      (callbacks) => pmsApi.createBookings({ ...payload, ...callbacks }),
      (value) => (loading.value = value),
      (value) => (error.value = value)
    );
  };

  const updateBooking = async (payload: {
    bookingId: string | number;
    data: unknown;
  }) => {
    return runWithState(
      (callbacks) => pmsApi.changeBooking({ ...payload, ...callbacks }),
      (value) => (loading.value = value),
      (value) => (error.value = value)
    );
  };

  return {
    loading,
    error,
    categories,
    objects,
    countParkingPlaces,
    fetchCategories,
    fetchObjects,
    fetchBookings,
    createBooking,
    updateBooking,
  };
});
