<template>
  <div :class="[styles.root, themeClass]">
    <div :class="styles.toolbar">
      <div :class="styles.toolbarLeft">
        <el-button @click="setTimeToday">{{ texts.toolbar.today }}</el-button>
        <div :class="styles.toolbarDates">
          <el-button :size="size" @click="setTime('-', 30)">-30</el-button>

          <el-date-picker
            v-model="date"
            type="date"
            :size="size"
            format="DD.MM.YYYY"
            :clearable="false"
            :popper-class="calendarPopperClass"
            style="width: 120px"
          />
          <el-button :size="size" @click="setTime('+', 30)">+30</el-button>
        </div>
      </div>
      <div :class="styles.toolbarRight">
        <input
          ref="studentsImportInputRef"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          style="display: none"
          @change="handleStudentsImportFileChange"
        />
        <el-button
          :size="size"
          :class="styles.skudButton"
          :loading="skudDownloadLoading"
          @click="handleSkudDownload"
        >
          СКУД
        </el-button>
        <el-button
          :size="size"
          :class="styles.importButton"
          :loading="importDownloadLoading && importDialogOpen"
          @click="openImportDialog"
        >
          Экспорт
        </el-button>
        <el-button
          :size="size"
          :class="styles.studentsImportButton"
          :loading="studentsImportLoading"
          @click="openStudentsImportPicker"
        >
          Импорт
        </el-button>
        <el-button
          :size="size"
          :class="styles.requestsButton"
          @click="openRequestsDialog"
        >
          Заявки ({{ requests.length }})
        </el-button>
        <el-button
          :size="size"
          :class="styles.analyticsButton"
          :loading="analyticsLoading && analyticsDialogOpen"
          @click="openAnalyticsDialog"
        >
          Аналитика
        </el-button>
        <button
          type="button"
          :class="[
            styles.themeToggle,
            theme === 'dark' ? styles.themeToggleDark : styles.themeToggleLight,
          ]"
          :aria-pressed="theme === 'dark'"
          aria-label="Переключить тему"
          @click="toggleTheme"
        >
          <span :class="styles.themeToggleLabel">{{ themeLabel }}</span>
          <span :class="styles.themeToggleTrack">
            <span :class="styles.themeToggleThumb"></span>
          </span>
        </button>
      </div>
    </div>
    <BookingCalendar
      ref="calendarRef"
      v-model:lists="lists"
      :start-date="date"
      :status-options="statusOptions"
      :theme="theme"
      @change="handleCalendarChange"
      @action-open="handleActionOpen"
      @booking-open="handleBookingOpen"
    />
    <el-drawer
      v-model="requestsDialogOpen"
      :class="[
        styles.requestsDrawer,
        theme === 'dark'
          ? styles.requestsDrawerDark
          : styles.requestsDrawerLight,
      ]"
      title="Заявки"
      direction="rtl"
      size="520px"
      :modal="true"
      :close-on-click-modal="true"
      :lock-scroll="false"
    >
      <div v-if="!requests.length" :class="styles.requestsEmpty">
        Заявок нет
      </div>
      <div v-else>
        <el-input
          v-model="requestsSearch"
          :class="styles.requestsSearch"
          clearable
          placeholder="Поиск по ФИО"
        />
        <div v-if="!filteredRequests.length" :class="styles.requestsEmpty">
          Ничего не найдено
        </div>
        <div v-else :class="styles.requestsList">
          <div
            v-for="booking in filteredRequests"
            :key="booking.id"
            :class="styles.requestRow"
          >
            <span :class="styles.requestName">
              {{ booking.name || "Без ФИО" }}
            </span>
            <el-button
              type="primary"
              size="small"
              :disabled="!canManageBookings"
              @click="handleRequestBook(booking)"
            >
              Забронировать
            </el-button>
          </div>
        </div>
      </div>
    </el-drawer>
    <el-dialog
      v-model="importDialogOpen"
      title="Сводка"
      width="620px"
      :class="[
        styles.analyticsDialog,
        theme === 'dark'
          ? styles.analyticsDialogDark
          : styles.analyticsDialogLight,
      ]"
    >
      <div :class="styles.importDialogBody">
        <el-form label-position="top">
          <el-form-item label="Период">
            <el-date-picker
              v-model="importDateRange"
              type="daterange"
              format="DD.MM.YYYY"
              value-format="YYYY-MM-DD"
              range-separator="—"
              start-placeholder="Дата начала"
              end-placeholder="Дата окончания"
              :popper-class="calendarPopperClass"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
        <div :class="styles.importDialogActions">
          <el-button
            type="primary"
            :loading="importDownloadLoading"
            :disabled="!importDateRange || importDateRange.length < 2"
            @click="handleImportDownload"
          >
            Скачать Excel
          </el-button>
        </div>
      </div>
    </el-dialog>
    <el-dialog
      v-model="analyticsDialogOpen"
      title="Аналитика по корпусам"
      width="780px"
      :class="[
        styles.analyticsDialog,
        theme === 'dark'
          ? styles.analyticsDialogDark
          : styles.analyticsDialogLight,
      ]"
    >
      <div :class="styles.analyticsHeader">
        <span :class="styles.analyticsDateLabel">
          Дата: {{ analyticsDateLabel }}
        </span>
        <el-button
          :size="size"
          :loading="analyticsLoading"
          @click="loadAnalytics"
        >
          Обновить
        </el-button>
      </div>
      <div
        v-if="analyticsLoading && !analyticsRows.length"
        :class="styles.analyticsState"
      >
        Загрузка аналитики...
      </div>
      <div v-else-if="analyticsError" :class="styles.analyticsState">
        {{ analyticsError }}
      </div>
      <div v-else-if="!analyticsRows.length" :class="styles.analyticsState">
        Нет данных аналитики
      </div>
      <div v-else :class="styles.analyticsTableWrap">
        <table :class="styles.analyticsTable">
          <thead>
            <tr>
              <th>Корпус</th>
              <th>Всего номеров</th>
              <th>Занято</th>
              <th>Свободно</th>
              <th>Заполняемость</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in analyticsRows" :key="row.corpsId">
              <td>{{ row.corpsLabel }}</td>
              <td>{{ row.totalRooms }}</td>
              <td>{{ row.occupiedRooms }}</td>
              <td>{{ row.freeRooms }}</td>
              <td>{{ formatOccupancyPercent(row.occupancyPercent) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </el-dialog>
    <BookingDialog
      v-model="bookingDialogOpen"
      :booking="activeBookingDraft"
      :category-options="categoryOptions"
      :room-options="roomOptions"
      :room-options-by-category="roomOptionsByCategory"
      :calendar-lists="lists"
      :can-edit="canManageBookings"
      :theme="theme"
      @save="handleBookingSave"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useCssModule, watch } from "vue";
import { ElMessage } from "element-plus";
import BookingCalendar from "./BookingCalendar.vue";
import BookingDialog from "./BookingDialog.vue";
import { useBookingCalendarAdapter } from "../dto/bookingCalendarAdapter";
import { resolveKnownStatusColor } from "../data/statusColors";
import {
  isAdminRole,
  resolveCurrentJwtToken,
  resolveCurrentUserRole,
} from "../auth/chessAuth";
import type { BookingReverseLookups } from "../dto/pmsBookingDto";
import type { BookingForm } from "../types/booking-forms";
import type {
  Booking,
  CalendarChange,
  CalendarList,
  StatusOption,
} from "../types/booking-calendar";
const props = withDefaults(
  defineProps<{
    theme?: "light" | "dark";
  }>(),
  {
    theme: "light",
  },
);

const styles = useCssModule();
const theme = ref<"light" | "dark">(props.theme);
const themeClass = computed(() =>
  theme.value === "dark" ? styles.themeDark : styles.themeLight,
);
const calendarPopperClass = computed(
  () => `${styles.popper} ${themeClass.value}`,
);
const themeLabel = computed(() =>
  theme.value === "dark" ? "Темная тема" : "Светлая тема",
);
const toggleTheme = () => {
  theme.value = theme.value === "dark" ? "light" : "dark";
};
const texts = {
  toolbar: {
    today: "Сегодня",
  },
};
// Текущая дата, от которой строится сетка календаря.
const date = ref(new Date());
// Списки календаря, которые отображаются в компоненте.
const lists = ref<CalendarList[]>([]);
// Динамические статусы из данных календаря.
const statusOptions = computed<StatusOption[]>(() => {
  const map = new Map<string, StatusOption>();
  for (const list of lists.value) {
    for (const item of list.items ?? []) {
      for (const booking of item.bookings ?? []) {
        const status = booking.status?.trim();
        if (!status || map.has(status)) {
          continue;
        }
        const color = resolveKnownStatusColor(status);
        map.set(status, {
          value: status,
          label: status,
          color: color || undefined,
        });
      }
    }
  }
  if (map.size) {
    return Array.from(map.values());
  }
  const fallbackColor = resolveKnownStatusColor("Ожидает оплаты");
  return [
    {
      value: "Ожидает оплаты",
      label: "Ожидает оплаты",
      color: fallbackColor || undefined,
    },
  ];
});
// Размер контролов для тулбара и даты.
const size = ref<"default" | "large" | "small">("default");
// Варианты тарифов для селекта в диалоге брони.
// Варианты категорий для селекта в диалоге брони.
const categoryOptions = ref<string[]>([]);
// Общий список номеров для селектов.
const roomOptions = ref<string[]>([]);
// Номера, сгруппированные по категории.
const roomOptionsByCategory = ref<Record<string, string[]>>({});
// Брони со статусом "Заявка", которые не показываются в календаре.
const requests = ref<Booking[]>([]);
const skudDownloadLoading = ref(false);
const studentsImportLoading = ref(false);
const studentsImportInputRef = ref<HTMLInputElement | null>(null);
const importDialogOpen = ref(false);
const importDateRange = ref<[string, string] | null>(null);
const importDownloadLoading = ref(false);
const requestsSearch = ref("");
const normalizeSearchValue = (value: string) =>
  value.toLowerCase().replace(/\s+/g, " ").trim();
const filteredRequests = computed(() => {
  const needle = normalizeSearchValue(requestsSearch.value);
  if (!needle) {
    return requests.value;
  }
  return requests.value.filter((booking) =>
    normalizeSearchValue(String(booking.name ?? "")).includes(needle),
  );
});
const currentUserRole = computed(() => resolveCurrentUserRole());
const canManageBookings = computed(() => isAdminRole(currentUserRole.value));
const notifyEditForbidden = () => {
  ElMessage.warning(
    "Недостаточно прав: только администратор может создавать и редактировать брони",
  );
};
// Ссылка на компонент календаря для вызова его методов.
const calendarRef = ref<InstanceType<typeof BookingCalendar> | null>(null);
// Адаптер, который грузит данные и отправляет изменения в API.
const calendarAdapter = useBookingCalendarAdapter();
// Текст ошибки из адаптера, если запросы завершились неуспешно.
const adapterError = calendarAdapter.error;
// Состояние диалога бронирования.
const bookingDialogOpen = ref(false);
// Состояние диалога заявок.
const requestsDialogOpen = ref(false);
// Источник открытия формы брони.
const bookingDialogSource = ref<"calendar" | "request">("calendar");
// Черновик текущей брони для редактирования.
const activeBookingDraft = ref<Booking | null>(null);
// Обратные справочники для преобразования названий в id.
const reverseLookups = ref<BookingReverseLookups>({
  categoryIdByName: new Map(),
  objectIdByName: new Map(),
});
const SKUD_FILE_URL = "https://sok-raduga.donstu.ru/api/file.php";
const STUDENTS_IMPORT_URL =
  "https://sok-raduga.donstu.ru/api/import-students.php";
const IMPORT_EXPORT_URL =
  "https://sok-raduga.donstu.ru/api/for-director-info.php";
const ANALYTICS_URL = "https://sok-raduga.donstu.ru/api/analytics.php";

type AnalyticsCorpsStat = {
  total_rooms: number;
  occupied_rooms: number;
  free_rooms: number;
  occupancy_percent: number;
};

type AnalyticsResponse = {
  date: string;
  corps: Record<string, AnalyticsCorpsStat>;
};

type AnalyticsRow = {
  corpsId: string;
  corpsLabel: string;
  totalRooms: number;
  occupiedRooms: number;
  freeRooms: number;
  occupancyPercent: number;
};

const analyticsDialogOpen = ref(false);
const analyticsLoading = ref(false);
const analyticsError = ref("");
const analyticsDate = ref("");
const analyticsCorps = ref<Record<string, AnalyticsCorpsStat>>({});

const parseAnalyticsNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveCorpsLabel = (corpsId: string) => {
  if (corpsId === "10") {
    return "Корпус - Ромашка";
  }
  return `Корпус ${corpsId}`;
};

const analyticsRows = computed<AnalyticsRow[]>(() =>
  Object.entries(analyticsCorps.value)
    .sort(([leftId], [rightId]) => {
      const leftNumber = Number(leftId);
      const rightNumber = Number(rightId);
      if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
        return leftNumber - rightNumber;
      }
      return leftId.localeCompare(rightId, "ru");
    })
    .map(([corpsId, stats]) => ({
      corpsId,
      corpsLabel: resolveCorpsLabel(corpsId),
      totalRooms: parseAnalyticsNumber(stats.total_rooms),
      occupiedRooms: parseAnalyticsNumber(stats.occupied_rooms),
      freeRooms: parseAnalyticsNumber(stats.free_rooms),
      occupancyPercent: parseAnalyticsNumber(stats.occupancy_percent),
    })),
);

const formatAnalyticsDate = (value: string) => {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value || "—";
  }
  return `${day}.${month}.${year}`;
};

const analyticsDateLabel = computed(() =>
  formatAnalyticsDate(analyticsDate.value),
);

const formatOccupancyPercent = (value: number) =>
  `${value.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}%`;

const formatDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const extractFileNameFromDisposition = (value: string | null) => {
  if (!value) {
    return "";
  }
  const utf8Match = value.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }
  const plainMatch = value.match(/filename\s*=\s*"?([^";]+)"?/i);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }
  return "";
};

const resolveSkudFileName = (response: Response) => {
  const fromHeader = extractFileNameFromDisposition(
    response.headers.get("content-disposition"),
  );
  if (fromHeader) {
    return fromHeader;
  }
  return `skud-${formatDateKey(new Date())}.txt`;
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName || `skud-${formatDateKey(new Date())}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};

const handleSkudDownload = async () => {
  if (skudDownloadLoading.value) {
    return;
  }
  skudDownloadLoading.value = true;
  try {
    const headers: Record<string, string> = {};
    const jwt = resolveCurrentJwtToken();
    if (jwt) {
      headers.Authorization = `Bearer ${jwt}`;
    }
    headers.Accept = "text/plain,application/octet-stream,*/*";
    const response = await fetch(SKUD_FILE_URL, {
      method: "GET",
      headers,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    if (!blob.size) {
      throw new Error("Пустой файл");
    }
    downloadBlob(blob, resolveSkudFileName(response));
  } catch {
    window.open(SKUD_FILE_URL, "_blank", "noopener,noreferrer");
    ElMessage.warning(
      "Не удалось скачать напрямую, открываю файл в новой вкладке",
    );
  } finally {
    skudDownloadLoading.value = false;
  }
};

const resetStudentsImportInput = () => {
  if (studentsImportInputRef.value) {
    studentsImportInputRef.value.value = "";
  }
};

const openStudentsImportPicker = () => {
  if (studentsImportLoading.value) {
    return;
  }
  studentsImportInputRef.value?.click();
};

const handleStudentsImportFileChange = async (event: Event) => {
  if (studentsImportLoading.value) {
    return;
  }
  const target = event.target as HTMLInputElement | null;
  const file = target?.files?.[0];
  if (!file) {
    return;
  }
  if (!/\.xlsx$/i.test(file.name)) {
    ElMessage.warning("Выберите файл в формате .xlsx");
    resetStudentsImportInput();
    return;
  }

  studentsImportLoading.value = true;
  try {
    const formData = new FormData();
    formData.append("file", file, "bookings.xlsx");
    const headers: Record<string, string> = {};
    const jwt = resolveCurrentJwtToken();
    if (jwt) {
      headers.Authorization = `Bearer ${jwt}`;
    }
    const response = await fetch(STUDENTS_IMPORT_URL, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    ElMessage.success("Импорт студентов выполнен");
    await loadCalendarData();
  } catch (error) {
    console.warn("Students import error:", error);
    ElMessage.error("Не удалось импортировать студентов");
  } finally {
    studentsImportLoading.value = false;
    resetStudentsImportInput();
  }
};

const normalizeDateRangeForExport = (range: [string, string]) => {
  const [rawFrom = "", rawTo = ""] = range;
  const from = String(rawFrom).trim();
  const to = String(rawTo).trim();
  if (!from || !to) {
    return null;
  }
  if (from <= to) {
    return { from, to };
  }
  return { from: to, to: from };
};

const buildImportExportUrl = (dateFrom: string, dateTo: string) => {
  const url = new URL(IMPORT_EXPORT_URL);
  url.searchParams.set("date_from", dateFrom);
  url.searchParams.set("date_to", dateTo);
  return url.toString();
};

const resolveImportFileName = (
  response: Response,
  dateFrom: string,
  dateTo: string,
) => {
  const fromHeader = extractFileNameFromDisposition(
    response.headers.get("content-disposition"),
  );
  if (fromHeader) {
    return fromHeader;
  }
  return `import-${dateFrom}-${dateTo}.xlsx`;
};

const openImportDialog = () => {
  if (!importDateRange.value || importDateRange.value.length < 2) {
    const baseDate = new Date(date.value);
    const normalizedBase = Number.isNaN(baseDate.getTime())
      ? new Date()
      : baseDate;
    const endDate = new Date(normalizedBase);
    endDate.setDate(normalizedBase.getDate() + 5);
    importDateRange.value = [
      formatDateKey(normalizedBase),
      formatDateKey(endDate),
    ];
  }
  importDialogOpen.value = true;
};

const handleImportDownload = async () => {
  if (importDownloadLoading.value) {
    return;
  }
  const range = importDateRange.value;
  if (!range || range.length < 2) {
    ElMessage.warning("Выберите период для выгрузки");
    return;
  }
  const normalizedRange = normalizeDateRangeForExport(range);
  if (!normalizedRange) {
    ElMessage.warning("Некорректный период выгрузки");
    return;
  }

  const requestUrl = buildImportExportUrl(
    normalizedRange.from,
    normalizedRange.to,
  );
  importDownloadLoading.value = true;
  try {
    const headers: Record<string, string> = {
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/octet-stream,*/*",
    };
    const jwt = resolveCurrentJwtToken();
    if (jwt) {
      headers.Authorization = `Bearer ${jwt}`;
    }
    const response = await fetch(requestUrl, {
      method: "GET",
      headers,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    if (!blob.size) {
      throw new Error("Пустой файл");
    }
    downloadBlob(
      blob,
      resolveImportFileName(response, normalizedRange.from, normalizedRange.to),
    );
    importDialogOpen.value = false;
  } catch {
    window.open(requestUrl, "_blank", "noopener,noreferrer");
    ElMessage.warning(
      "Не удалось скачать напрямую, пробую открыть файл в новой вкладке",
    );
  } finally {
    importDownloadLoading.value = false;
  }
};

const loadAnalytics = async () => {
  if (analyticsLoading.value) {
    return;
  }
  analyticsLoading.value = true;
  analyticsError.value = "";
  try {
    const response = await fetch(ANALYTICS_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = (await response.json()) as Partial<AnalyticsResponse>;
    if (
      !payload ||
      typeof payload !== "object" ||
      typeof payload.date !== "string" ||
      typeof payload.corps !== "object" ||
      !payload.corps
    ) {
      throw new Error("Некорректный формат ответа");
    }
    analyticsDate.value = payload.date;
    analyticsCorps.value = payload.corps as Record<string, AnalyticsCorpsStat>;
  } catch (error) {
    analyticsDate.value = "";
    analyticsCorps.value = {};
    analyticsError.value = "Не удалось загрузить аналитику";
    console.warn("Analytics error:", error);
  } finally {
    analyticsLoading.value = false;
  }
};

const openAnalyticsDialog = () => {
  analyticsDialogOpen.value = true;
  void loadAnalytics();
};

const getCalendarRange = (value: Date | string | null | undefined) => {
  const base = value ? new Date(value) : new Date();
  if (Number.isNaN(base.getTime())) {
    return null;
  }
  const end = new Date(base);
  end.setDate(base.getDate() + 29);
  return {
    from: formatDateKey(base),
    to: formatDateKey(end),
  };
};
// Сдвигает текущую дату вперед или назад, чтобы изменить диапазон видимых дат.
const setTime = (sign: "-" | "+", day: number): void => {
  const baseDate = date.value ? new Date(date.value) : new Date();
  if (sign === "-") {
    baseDate.setDate(baseDate.getDate() - day);
  } else {
    baseDate.setDate(baseDate.getDate() + day);
  }

  date.value = baseDate;
};
// Сбрасывает календарь на сегодняшнюю дату.
const setTimeToday = () => {
  date.value = new Date();
};

const normalizeBookingRange = (dateFrom: string, dateTo: string) => {
  if (dateFrom && dateTo) {
    if (dateFrom <= dateTo) {
      return { startKey: dateFrom, endKey: dateTo };
    }
    return { startKey: dateTo, endKey: dateFrom };
  }
  return { startKey: dateFrom, endKey: dateTo };
};

const extractTime = (value: string, fallback: string) => {
  const match = value.match(/(\d{2}):(\d{2})/);
  if (!match) {
    return fallback;
  }
  return `${match[1]}:${match[2]}`;
};

const formatDateTime = (dateKey: string, time: string) => {
  const [year, month, day] = dateKey.split("-");
  if (!year || !month || !day) {
    return "";
  }
  return `${day}.${month}.${year} ${time}`;
};

const applyFormToBooking = (booking: Booking, form: BookingForm) => {
  booking.status = form.status;
  booking.bookingName = form.bookingName;
  booking.name = form.clientFio;
  booking.phone = form.phone;
  booking.clientType = form.clientType ?? booking.clientType;
  booking.guests = Number(form.guests) || 1;
  booking.parkingPlaces = Math.max(0, Number(form.parkingPlaces) || 0);
  booking.category = form.category ? form.category : booking.category;
  booking.room = form.room;
  booking.total = Number(form.price) || 0;
  booking.paid = Number(form.paid) || 0;
  booking.email = form.email;
  booking.paymentDate = form.dateOfPayment;
  booking.paymentHref = form.paymentHref;
  booking.additionalPaymentLink = form.additionalPaymentLink;
  booking.prepaymentPercentage = Math.max(
    0,
    Math.min(100, Number(form.prepaymentPercentage) || 0),
  );
  booking.guestList = (form.guestList ?? []).slice(0, booking.guests);
  booking.extraPlace = Boolean(form.extraPlace);

  const normalized = normalizeBookingRange(form.dateFrom, form.dateTo);
  const startKey = normalized.startKey || booking.startKey;
  const endKey = normalized.endKey || booking.endKey;
  const checkInTime = extractTime(booking.checkIn, "00:00");
  const checkOutTime = extractTime(booking.checkOut, "00:00");
  booking.startKey = startKey;
  booking.endKey = endKey;
  if (startKey) {
    booking.checkIn = formatDateTime(startKey, checkInTime);
  }
  if (endKey) {
    booking.checkOut = formatDateTime(endKey, checkOutTime);
  }
};

const openRequestsDialog = () => {
  requestsSearch.value = "";
  requestsDialogOpen.value = true;
};

const handleRequestBook = (booking: Booking) => {
  if (!canManageBookings.value) {
    notifyEditForbidden();
    return;
  }
  const normalizedStatus = (booking.status ?? "").trim().toLowerCase();
  const nextStatus =
    normalizedStatus.includes("заявк") || normalizedStatus.includes("request")
      ? "Ожидает оплаты"
      : booking.status;
  activeBookingDraft.value = {
    ...booking,
    status: nextStatus || "Ожидает оплаты",
  };
  bookingDialogSource.value = "request";
  requestsDialogOpen.value = false;
  bookingDialogOpen.value = true;
};

// Передает изменения бронирований в DTO для отправки на API.
const handleCalendarChange = async (payload: CalendarChange) => {
  if (
    (payload.type === "booking:create" || payload.type === "booking:update") &&
    !canManageBookings.value
  ) {
    notifyEditForbidden();
    await loadCalendarData();
    return;
  }
  const success = await calendarAdapter.applyCalendarChange(
    payload,
    reverseLookups.value,
  );
  if (payload.type === "booking:create") {
    if (success) {
      await loadCalendarData();
    } else {
      ElMessage.error(adapterError.value ?? "Не удалось создать бронирование");
    }
    return;
  }
  if (!success) {
    ElMessage.error(adapterError.value ?? "Не удалось обновить бронирование");
    await loadCalendarData();
  }
};

// Сразу открывает форму брони по выделенному диапазону.
const handleActionOpen = () => {
  calendarRef.value?.startBookingFromSelection();
};

// Открывает диалог брони и сохраняет выбранную бронь для редактирования.
const handleBookingOpen = (payload: {
  booking: Booking;
  mode: "create" | "edit";
}) => {
  bookingDialogSource.value = "calendar";
  activeBookingDraft.value = payload.booking;
  bookingDialogOpen.value = true;
};

// Передает данные формы брони в календарь и закрывает диалог.
const handleBookingSave = async (form: BookingForm) => {
  if (!canManageBookings.value) {
    notifyEditForbidden();
    return;
  }
  if (bookingDialogSource.value === "request") {
    const draft = activeBookingDraft.value;
    if (!draft) {
      bookingDialogOpen.value = false;
      return;
    }
    const booking = { ...draft };
    applyFormToBooking(booking, form);
    const changeType =
      typeof booking.id === "string" && booking.id.startsWith("tmp-")
        ? "booking:create"
        : "booking:update";
    const success = await calendarAdapter.applyCalendarChange(
      {
        type: changeType,
        listId: "requests",
        itemId: String(booking.room ?? booking.id ?? "request"),
        booking,
      },
      reverseLookups.value,
    );
    bookingDialogOpen.value = false;
    if (success) {
      await loadCalendarData();
    } else {
      ElMessage.error(adapterError.value ?? "Не удалось обновить бронирование");
    }
    return;
  }
  calendarRef.value?.saveBooking(form);
  bookingDialogOpen.value = false;
};

// При закрытии диалога брони отменяет редактирование и очищает драфт.
watch(bookingDialogOpen, (isOpen) => {
  if (!isOpen) {
    if (bookingDialogSource.value === "calendar") {
      calendarRef.value?.cancelBookingEdit();
    }
    activeBookingDraft.value = null;
    bookingDialogSource.value = "calendar";
  }
});

// Получает данные календаря из DTO и обновляет состояние компонента.
const loadCalendarData = async () => {
  const range = getCalendarRange(date.value);
  const {
    lists: calendarLists,
    requests: nextRequests,
    categoryOptions: nextCategoryOptions,
    roomOptions: nextRoomOptions,
    roomOptionsByCategory: nextRoomOptionsByCategory,
    reverseLookups: nextReverseLookups,
  } = await calendarAdapter.loadCalendarData(range ?? undefined);

  lists.value = calendarLists;
  requests.value = nextRequests;
  categoryOptions.value = nextCategoryOptions;
  roomOptions.value = nextRoomOptions;
  roomOptionsByCategory.value = nextRoomOptionsByCategory;
  reverseLookups.value = nextReverseLookups;

  if (adapterError.value) {
    console.warn("PMS error:", adapterError.value);
  }
};

// Загружает данные календаря при первом открытии компонента.
onMounted(() => {
  void loadCalendarData();
});

watch(
  () => date.value,
  () => {
    void loadCalendarData();
  },
);

watch(
  () => props.theme,
  (value) => {
    theme.value = value ?? "light";
  },
);
</script>

<style module>
.root {
  --toolbar-sticky-height: 65px;
  font-family: "Space Grotesk", "Segoe UI", sans-serif;
}

.themeDark {
  --toolbar-bg: linear-gradient(
    90deg,
    rgba(15, 23, 42, 0.9) 0%,
    rgba(15, 23, 42, 0.65) 100%
  );
  --surface-2: #0f1b2d;
  --surface-3: #0b1220;
  --border-subtle: rgba(148, 163, 184, 0.2);
  --border-strong: rgba(226, 232, 240, 0.18);
  --text-secondary: #a3b0c2;
  --text-primary: #e5e7eb;
  --accent: #2563eb;
  --accent-soft: rgba(37, 99, 235, 0.15);
  --text-on-accent: #f8fafc;
  --shadow-2: 0 18px 40px rgba(2, 6, 23, 0.45);
}

.themeLight {
  --toolbar-bg: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.85) 100%
  );
  --surface-2: #f8fafc;
  --surface-3: #f1f5f9;
  --border-subtle: rgba(15, 23, 42, 0.12);
  --border-strong: rgba(15, 23, 42, 0.18);
  --text-secondary: #475569;
  --text-primary: #0f172a;
  --accent: #2563eb;
  --accent-soft: rgba(37, 99, 235, 0.12);
  --text-on-accent: #f8fafc;
  --shadow-2: 0 18px 40px rgba(15, 23, 42, 0.16);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--toolbar-bg);
  box-shadow: none;
  height: 65px;
  padding: 0 30px;
  width: 100%;
  border-radius: 0;
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 60;
}

.toolbarLeft {
  display: flex;
  gap: 25px;
}

.toolbarDates {
  display: flex;
  gap: 2px;
}

.toolbarRight {
  display: flex;
  align-items: center;
  gap: 12px;
}

.requestsButton {
  border-radius: 999px;
  font-weight: 600;
}

.skudButton {
  border-radius: 999px;
  font-weight: 600;
}

.importButton {
  border-radius: 999px;
  font-weight: 600;
}

.studentsImportButton {
  border-radius: 999px;
  font-weight: 600;
}

.analyticsButton {
  border-radius: 999px;
  font-weight: 600;
}

.themeToggle {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border-radius: 999px;
  border: 1px solid var(--border-strong);
  background: var(--surface-3);
  color: var(--text-primary);
  padding: 6px 12px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.themeToggle:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-2);
}

.themeToggleLabel {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.themeToggleTrack {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.4);
  border: 1px solid var(--border-subtle);
  display: inline-flex;
  align-items: center;
}

.themeToggleThumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--text-on-accent);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.25);
  transition: transform 0.2s ease;
}

.themeToggleDark .themeToggleTrack {
  background: var(--accent);
  border-color: var(--accent);
}

.themeToggleDark .themeToggleThumb {
  transform: translateX(20px);
}

.themeToggleLight .themeToggleTrack {
  background: rgba(148, 163, 184, 0.4);
}

.toolbarDates :global(.el-button) {
  margin: 0;
}

.toolbar :global(.el-button:not(.el-button--primary)) {
  background: var(--surface-3);
  border-color: var(--border-subtle);
  color: var(--text-secondary);
}

.toolbar :global(.el-button:not(.el-button--primary):hover) {
  background: var(--surface-2);
  color: var(--text-primary);
  border-color: rgba(37, 99, 235, 0.4);
}

.toolbar :global(.el-input__wrapper) {
  background: var(--surface-3);
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}

.toolbar :global(.el-input__inner) {
  color: var(--text-primary);
}

.popper :global(.el-select-dropdown),
.popper :global(.el-picker-panel) {
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
}

.popper :global(.el-picker-panel__footer) {
  background: var(--surface-2);
  border-top: 1px solid var(--border-subtle);
}

.popper :global(.el-picker-panel__shortcut) {
  color: var(--text-secondary);
}

.popper :global(.el-date-table td .el-date-table-cell) {
  color: var(--text-secondary);
}

.popper :global(.el-date-table td.current .el-date-table-cell__text) {
  background: var(--accent);
  color: var(--text-on-accent);
  border-radius: 6px;
}

.popper :global(.el-date-table td.today .el-date-table-cell__text) {
  box-shadow: inset 0 0 0 1px var(--accent);
  border-radius: 6px;
}

.popper :global(.el-select-dropdown__item) {
  color: var(--text-secondary);
}

.popper :global(.el-select-dropdown__item.is-selected) {
  color: var(--text-primary);
  background: var(--accent-soft);
}

.requestsDrawerDark {
  --requests-surface-2: #0f1b2d;
  --requests-surface-3: #0b1220;
  --requests-border-subtle: rgba(148, 163, 184, 0.2);
  --requests-border-strong: rgba(226, 232, 240, 0.18);
  --requests-text-primary: #e5e7eb;
  --requests-text-secondary: #a3b0c2;
  --requests-accent: #2563eb;
  --requests-text-on-accent: #f8fafc;
}

.requestsDrawerLight {
  --requests-surface-2: #f8fafc;
  --requests-surface-3: #f1f5f9;
  --requests-border-subtle: rgba(15, 23, 42, 0.12);
  --requests-border-strong: rgba(15, 23, 42, 0.18);
  --requests-text-primary: #0f172a;
  --requests-text-secondary: #475569;
  --requests-accent: #2563eb;
  --requests-text-on-accent: #f8fafc;
}

.requestsDrawer {
  background: var(--requests-surface-2);
  border: 1px solid var(--requests-border-strong);
  height: 100vh;
  max-height: 100vh;
  border-radius: 0;
  display: flex;
  flex-direction: column;
}

.requestsDrawer :global(.el-drawer__header) {
  background: var(--requests-surface-2);
  margin-bottom: 0;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--requests-border-subtle);
  color: var(--requests-text-primary);
}

.requestsDrawer :global(.el-drawer__body) {
  background: var(--requests-surface-2);
  padding: 12px 16px 16px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.requestsDrawer :global(.el-drawer__close-btn) {
  color: var(--requests-text-secondary);
}

.requestsDrawer :global(.el-input__wrapper) {
  background: var(--requests-surface-3);
  box-shadow: inset 0 0 0 1px var(--requests-border-subtle);
}

.requestsDrawer :global(.el-input__inner) {
  color: var(--requests-text-primary);
}

.requestsDrawer :global(.el-input__inner::placeholder) {
  color: var(--requests-text-secondary);
}

.requestsDrawer :global(.el-button:not(.el-button--primary)) {
  background: var(--requests-surface-3);
  border-color: var(--requests-border-subtle);
  color: var(--requests-text-secondary);
}

.requestsDrawer :global(.el-button:not(.el-button--primary):hover) {
  background: var(--requests-surface-2);
  color: var(--requests-text-primary);
  border-color: rgba(37, 99, 235, 0.45);
}

.requestsDrawer :global(.el-button--primary) {
  background: var(--requests-accent);
  border-color: var(--requests-accent);
  color: var(--requests-text-on-accent);
}

.analyticsDialogDark {
  --analytics-surface-2: #0f1b2d;
  --analytics-surface-3: #0b1220;
  --analytics-border-subtle: rgba(148, 163, 184, 0.2);
  --analytics-border-strong: rgba(226, 232, 240, 0.18);
  --analytics-text-primary: #e5e7eb;
  --analytics-text-secondary: #a3b0c2;
}

.analyticsDialogLight {
  --analytics-surface-2: #f8fafc;
  --analytics-surface-3: #f1f5f9;
  --analytics-border-subtle: rgba(15, 23, 42, 0.12);
  --analytics-border-strong: rgba(15, 23, 42, 0.18);
  --analytics-text-primary: #0f172a;
  --analytics-text-secondary: #475569;
}

.analyticsDialog {
  background: var(--analytics-surface-2);
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--analytics-border-strong);
}

.analyticsDialog :global(.el-dialog__header) {
  margin: 0;
  padding: 16px 20px 10px;
  border-bottom: 1px solid var(--analytics-border-subtle);
}

.analyticsDialog :global(.el-dialog__title) {
  color: var(--analytics-text-primary);
  font-weight: 700;
}

.analyticsDialog :global(.el-dialog__body) {
  padding: 14px 20px 20px;
  background: var(--analytics-surface-2);
}

.analyticsDialog :global(.el-dialog__close) {
  color: var(--analytics-text-secondary);
}

.analyticsHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.importDialogBody {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.importDialogActions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.analyticsDateLabel {
  color: var(--analytics-text-secondary);
  font-weight: 600;
}

.analyticsState {
  padding: 20px 0;
  color: var(--analytics-text-secondary);
}

.analyticsTableWrap {
  overflow-x: auto;
}

.analyticsTable {
  width: 100%;
  border-collapse: collapse;
  min-width: 640px;
  border: 1px solid var(--analytics-border-subtle);
}

.analyticsTable th,
.analyticsTable td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--analytics-border-subtle);
}

.analyticsTable th {
  color: var(--analytics-text-primary);
  background: var(--analytics-surface-3);
  font-weight: 700;
}

.analyticsTable td {
  color: var(--analytics-text-secondary);
  background: var(--analytics-surface-2);
}

.analyticsTable tbody tr:last-child td {
  border-bottom: none;
}

.requestsEmpty {
  color: var(--requests-text-secondary);
}

.requestsSearch {
  margin-bottom: 10px;
}

.requestsList {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.requestRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--requests-border-subtle);
  border-radius: 10px;
  background: var(--requests-surface-3);
}

.requestName {
  color: var(--requests-text-primary);
  font-weight: 600;
}
</style>
