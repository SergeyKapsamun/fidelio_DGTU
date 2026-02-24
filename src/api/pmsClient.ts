import { addParamsToUrl, type QueryParam } from "./pmsEndpoints";
import axios from "axios";

export type ApiError = {
  status: number | null;
  message: string;
};

export type RequestOptions<T> = {
  url: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  params?: QueryParam[];
  data?: unknown;
  formData?: FormData;
  headers?: Record<string, string>;
  errorMessage?: string;
  adapt?: (data: unknown) => T;
  onSuccess?: (data: T | null) => void;
  onError?: (error: ApiError) => void;
};

export const request = async <T>(options: RequestOptions<T>) => {
  const {
    url,
    method = "GET",
    params,
    data,
    formData,
    headers: extraHeaders,
    errorMessage = "Что-то пошло не так",
    adapt,
    onSuccess,
    onError,
  } = options;
  let result: T | null = null;
  let responseStatus: number | null = null;

  try {
    const requestUrl = addParamsToUrl(url, params);
    const headers: Record<string, string> = { ...(extraHeaders ?? {}) };

    const requestPayload = data !== null && data !== undefined ? data : formData;
    if (data !== null && data !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await axios.request({
      url: requestUrl,
      method,
      headers,
      data: requestPayload,
    });
    responseStatus = response.status;
    const responseData = response.data;

    if (responseData && typeof responseData === "object") {
      const record = responseData as Record<string, unknown>;
      if ("status" in record && record.status !== "success") {
        throw new Error((record.message as string) ?? errorMessage);
      }
      if ("success" in record && record.success !== true) {
        throw new Error((record.message as string) ?? errorMessage);
      }
    }

    const responsePayload = responseData?.data ?? responseData;
    result = adapt ? adapt(responsePayload) : (responsePayload as T);
    onSuccess?.(result);
  } catch (error) {
    let message = errorMessage;
    if (axios.isAxiosError(error)) {
      responseStatus = error.response?.status ?? responseStatus;
      const responseData = error.response?.data as { message?: string } | undefined;
      message = responseData?.message ?? error.message ?? errorMessage;
    } else if (error instanceof Error) {
      message = error.message;
    }
    onError?.({
      status: responseStatus,
      message,
    });
  }

  return result;
};
