<template>
  <div :class="[styles.root, themeClass]">
    <div class="calendar-sticky">
      <div class="header">
        <div class="object"></div>
        <div class="months-grid">
          <div
            class="month"
            v-for="group in monthGroups"
            :key="group.key"
            :style="{ gridColumn: `span ${group.count}` }"
          >
            {{ group.label }}
          </div>
        </div>
      </div>
      <div class="wrapper-days-numbers">
        <div class="object">{{ texts.calendar.objectLabel }}</div>
        <div class="days-grid">
          <div
            class="day-cell"
            v-for="day in days"
            :key="day.key"
            :class="{ weekend: day.isWeekend }"
          >
            <div class="days-numbers">{{ day.day }}</div>
            <div class="days">{{ day.weekday }}</div>
          </div>
        </div>
      </div>
    </div>
    <el-collapse v-model="activeCollapse" expand-icon-position="left">
      <el-collapse-item
        v-for="list in listsState"
        :key="list.id"
        :title="list.name"
        :name="list.id"
      >
        <div
          v-for="itemChild in list.items"
          :key="itemChild.id"
          class="calendar-item"
        >
          <div class="object object-name">
            <span class="object-name__text">{{ itemChild.name }}</span>
          </div>
          <div class="days-grid days-grid--collapse">
            <div
              v-if="
                draftSelection &&
                draftSelection.rowKey === rowKey(list.id, itemChild.id)
              "
              class="selection-bar selection-bar--draft"
              :style="selectionStyle"
            ></div>
            <template
              v-for="booking in itemChild.bookings || []"
              :key="booking.id"
            >
              <div
                v-if="getBookingStyle(booking)"
                class="chess-block__occupied"
                :style="getBookingStyle(booking)"
                @mouseenter="showPopover(booking)"
                @mouseleave="hidePopover"
                @mousedown.stop
                @click.stop="
                  handleBookingClick(rowKey(list.id, itemChild.id), booking)
                "
              >
                <div
                  class="resize-handle resize-handle--left"
                  @mousedown.stop="
                    onResizeStart(
                      'left',
                      rowKey(list.id, itemChild.id),
                      booking,
                      $event,
                    )
                  "
                ></div>
                <div
                  class="resize-handle resize-handle--right"
                  @mousedown.stop="
                    onResizeStart(
                      'right',
                      rowKey(list.id, itemChild.id),
                      booking,
                      $event,
                    )
                  "
                ></div>
                <span class="book-id"
                  >{{ texts.calendar.bookingIdPrefix }}{{ booking.id }}</span
                >
                <span class="booker-name">{{ booking.name }}</span>
                <span class="booker-phone"
                  >{{ texts.calendar.bookingPhonePrefix }}
                  {{ booking.phone }}</span
                >
              </div>
            </template>
            <div
              class="day-cell day-cell-collapse"
              v-for="(day, dayIndex) in days"
              :key="day.key"
              :class="{ weekendCollapse: day.isWeekend }"
              @mousedown="
                onDayMouseDown(rowKey(list.id, itemChild.id), dayIndex)
              "
              @mouseenter="
                onDayMouseEnter(rowKey(list.id, itemChild.id), dayIndex)
              "
            >
              <!-- Placeholder for booking data -->
            </div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
    <BookingPopover
      v-model="popoverOpen"
      :offset-x="12"
      :offset-y="12"
      :theme="props.theme"
    >
      <div v-if="activeBooking" class="booking-popover-card">
        <div class="booking-popover-card__status" :style="statusBadgeStyle">
          {{ getStatusLabel(activeBooking.status) }}
          {{ texts.calendar.bookingIdPrefix }}{{ activeBooking.id }}
        </div>
        <div class="booking-popover-card__row">
          <span class="booking-popover-card__label">
            {{ texts.calendar.popoverLabels.customer }}
          </span>
          <span class="booking-popover-card__value">
            {{ activeBooking.name }}
          </span>
        </div>
        <div class="booking-popover-card__row">
          <span class="booking-popover-card__label">
            {{ texts.calendar.popoverLabels.phone }}
          </span>
          <span class="booking-popover-card__value">
            {{ activeBooking.phone }}
          </span>
        </div>
        <div class="booking-popover-card__row">
          <span class="booking-popover-card__label">
            {{ texts.calendar.popoverLabels.guests }}
          </span>
          <span class="booking-popover-card__value">
            {{ activeBooking.guests }}
          </span>
        </div>
        <div class="booking-popover-card__row">
          <span class="booking-popover-card__label">
            {{ texts.calendar.popoverLabels.checkIn }}
          </span>
          <span class="booking-popover-card__value">
            {{ activeBooking.checkIn }}
          </span>
        </div>
        <div class="booking-popover-card__row">
          <span class="booking-popover-card__label">
            {{ texts.calendar.popoverLabels.checkOut }}
          </span>
          <span class="booking-popover-card__value">
            {{ activeBooking.checkOut }}
          </span>
        </div>
        <div class="booking-popover-card__row">
          <span class="booking-popover-card__label">
            {{ texts.calendar.popoverLabels.total }}
          </span>
          <span class="booking-popover-card__value">
            {{ activeBooking.total }}
          </span>
        </div>
        <div class="booking-popover-card__row">
          <span class="booking-popover-card__label">
            {{ texts.calendar.popoverLabels.paid }}
          </span>
          <span class="booking-popover-card__value">
            {{ activeBooking.paid }}
          </span>
        </div>
      </div>
    </BookingPopover>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useCssModule,
  watch,
} from "vue";
import BookingPopover from "./BookingPopover.vue";
import {
  normalizeStatusKey,
  resolveKnownStatusColor,
} from "../data/statusColors";
import type { BookingForm } from "../types/booking-forms";
import type {
  Booking,
  CalendarChange,
  CalendarList,
  StatusOption,
} from "../types/booking-calendar";
import {
  extractBookingTime,
  formatBookingUiDateTime,
  formatBookingUiDateTimeFromParts,
  normalizeBookingDateKey,
  normalizeBookingDateTimeValue,
} from "../utils/bookingDateTime";

type DayItem = {
  key: string;
  dateKey: string;
  day: number;
  weekday: string;
  isWeekend: boolean;
  month: number;
  year: number;
};

type MonthGroup = {
  key: string;
  label: string;
  count: number;
  month: number;
  year: number;
};

const STATUS_COLOR_PALETTE = [
  "#38bdf8",
  "#fbbf24",
  "#4ade80",
  "#f97316",
  "#a78bfa",
  "#f472b6",
  "#22d3ee",
  "#facc15",
  "#94a3b8",
  "#fb7185",
];

const CANCELLED_STATUS = "cancelled";
const WEEKDAY_LABELS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const MONTH_LABELS = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
];
const MONTH_LABELS_SHORT = [
  "янв",
  "фев",
  "мар",
  "апр",
  "май",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];

const props = withDefaults(
  defineProps<{
    startDate: Date;
    lists?: CalendarList[];
    statusOptions?: StatusOption[];
    theme?: "light" | "dark";
  }>(),
  {
    lists: () => [],
    statusOptions: () => [],
    theme: "light",
  },
);

const styles = useCssModule();
const themeClass = computed(() =>
  props.theme === "dark" ? styles.themeDark : styles.themeLight,
);

const emit = defineEmits<{
  (event: "update:lists", value: CalendarList[]): void;
  (event: "change", payload: CalendarChange): void;
  (
    event: "action-open",
    payload: { rowKey: string; startKey: string; endKey: string },
  ): void;
  (
    event: "booking-open",
    payload: { booking: Booking; mode: "create" | "edit" },
  ): void;
}>();

const cloneLists = (lists: CalendarList[]) =>
  (lists ?? []).map((list) => ({
    ...list,
    items: (list.items ?? []).map((item) => ({
      ...item,
      bookings: (item.bookings ?? [])
        .filter(Boolean)
        .map((booking) => ({ ...booking })),
    })),
  }));

const listsState = ref<CalendarList[]>(cloneLists(props.lists ?? []));

watch(
  () => props.lists,
  (value) => {
    listsState.value = cloneLists(value ?? []);
  },
  { deep: true },
);

const commitListsChange = () => {
  emit("update:lists", cloneLists(listsState.value));
};

const activeCollapse = ref<string[]>(
  (props.lists ?? []).map((list) => list.id),
);
const collapseInitialized = ref((props.lists ?? []).length > 0);

const texts = {
  calendar: {
    objectLabel: "Объект",
    bookingIdPrefix: "#",
    bookingPhonePrefix: "тел.",
    popoverLabels: {
      customer: "Заказчик",
      phone: "Телефон",
      guests: "Кол-во гостей",
      checkIn: "Заезд",
      checkOut: "Выезд",
      total: "Итого",
      paid: "Оплачено",
    },
  },
};
const statusOptions = computed(() => props.statusOptions);

const statusColorMap = computed(() => {
  const map = new Map<string, string>();
  let index = 0;
  statusOptions.value.forEach((option) => {
    const raw = option.value || option.label || "";
    const key = normalizeStatusKey(raw);
    if (!key || map.has(key)) {
      return;
    }
    const preferred = option.color ?? resolveKnownStatusColor(raw);
    const color =
      preferred ||
      STATUS_COLOR_PALETTE[index % STATUS_COLOR_PALETTE.length] ||
      STATUS_COLOR_PALETTE[0] ||
      "#2563eb";
    map.set(key, color);
    index += 1;
  });
  return map;
});

const resolveStatusColor = (statusValue: string) => {
  const key = normalizeStatusKey(statusValue ?? "");
  if (!key) {
    return "";
  }
  return (
    statusColorMap.value.get(key) ||
    resolveKnownStatusColor(statusValue) ||
    STATUS_COLOR_PALETTE[0]
  );
};

const statusLabelMap = computed(
  () =>
    new Map(statusOptions.value.map((option) => [option.value, option.label])),
);

const getStatusLabel = (statusValue: string) =>
  statusLabelMap.value.get(statusValue) ?? statusValue;

const statusBadgeStyle = computed(() => {
  const status = activeBooking.value?.status;
  if (!status) {
    return {};
  }
  const color = resolveStatusColor(status);
  if (!color) {
    return {};
  }
  return { backgroundColor: color, color: "#000000" };
});

watch(
  () => props.lists,
  (value) => {
    const ids = (value ?? []).map((list) => list.id);
    if (!ids.length) {
      activeCollapse.value = [];
      return;
    }
    if (!collapseInitialized.value) {
      activeCollapse.value = [...ids];
      collapseInitialized.value = true;
      return;
    }
    activeCollapse.value = activeCollapse.value.filter((id) =>
      ids.includes(id),
    );
  },
  { immediate: true },
);

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateTime = (dateKey: string, time: string) => {
  return formatBookingUiDateTimeFromParts(dateKey, time);
};

const extractTime = (value: string, fallback: string) =>
  extractBookingTime(value, fallback);

const days = computed<DayItem[]>(() => {
  const result: DayItem[] = [];
  const base = props.startDate ? new Date(props.startDate) : new Date();

  if (Number.isNaN(base.getTime())) {
    return result;
  }

  for (let i = 0; i < 30; i += 1) {
    const current = new Date(base);
    current.setDate(base.getDate() + i);
    const month = current.getMonth();
    const year = current.getFullYear();

    const weekdayIndex = current.getDay();
    result.push({
      key: `${year}-${month}-${current.getDate()}`,
      dateKey: formatDateKey(current),
      day: current.getDate(),
      weekday: WEEKDAY_LABELS[weekdayIndex] ?? "",
      isWeekend: weekdayIndex === 0 || weekdayIndex === 6,
      month,
      year,
    });
  }

  return result;
});

const dateIndexMap = computed(() => {
  const map = new Map<string, number>();
  days.value.forEach((day, index) => {
    map.set(day.dateKey, index);
  });
  return map;
});

const monthGroups = computed<MonthGroup[]>(() => {
  const groups: MonthGroup[] = [];

  for (const day of days.value) {
    const last = groups[groups.length - 1];
    if (!last || last.month !== day.month || last.year !== day.year) {
      groups.push({
        key: `${day.year}-${day.month}`,
        label: MONTH_LABELS[day.month] ?? "",
        count: 1,
        month: day.month,
        year: day.year,
      });
    } else {
      last.count += 1;
    }
  }

  return groups.map((group) => ({
    ...group,
    label:
      group.count === 1
        ? (MONTH_LABELS_SHORT[group.month] ?? group.label)
        : group.label,
  }));
});

const isDragging = ref(false);
const dragStartKey = ref<string | null>(null);
const dragHoverKey = ref<string | null>(null);
const activeRowKey = ref<string | null>(null);
const activeBooking = ref<Booking | null>(null);
const popoverOpen = ref(false);
const modalBooking = ref<Booking | null>(null);
const bookingMode = ref<"create" | "edit" | null>(null);
const bookingRowKey = ref<string | null>(null);
const pendingSelection = ref<{
  rowKey: string;
  startKey: string;
  endKey: string;
} | null>(null);
const pendingResize = ref<{
  rowKey: string;
  bookingId: Booking["id"];
  startKey: string;
  endKey: string;
  checkIn: string;
  checkOut: string;
} | null>(null);
const activeBookingRef = ref<Booking | null>(null);
const activeGrid = ref<HTMLElement | null>(null);
const dragMode = ref<"create" | "resize-left" | "resize-right" | null>(null);

const rowKey = (listId: string, itemId: string) => `${listId}::${itemId}`;

const parseRowKey = (rowKeyValue: string) => {
  const [listId, itemId] = rowKeyValue.split("::");
  if (!listId || !itemId) {
    return null;
  }
  return { listId, itemId };
};

const getItemByRowKey = (rowKeyValue: string) => {
  const parsed = parseRowKey(rowKeyValue);
  if (!parsed) {
    return null;
  }
  const { listId, itemId } = parsed;
  const list = listsState.value.find((entry) => entry.id === listId);
  const item = list?.items.find((entry) => entry.id === itemId);
  if (!list || !item) {
    return null;
  }
  return { list, item };
};

const getRangeIndices = (startKey: string, endKey: string) => {
  const startIndex = dateIndexMap.value.get(startKey);
  const endIndex = dateIndexMap.value.get(endKey);
  if (startIndex === undefined || endIndex === undefined) {
    return null;
  }
  return {
    startIndex: Math.min(startIndex, endIndex),
    endIndex: Math.max(startIndex, endIndex),
  };
};

const normalizeRange = (startKey: string, endKey: string) => {
  const startIndex = dateIndexMap.value.get(startKey);
  const endIndex = dateIndexMap.value.get(endKey);
  if (startIndex === undefined || endIndex === undefined) {
    return null;
  }
  return startIndex <= endIndex
    ? { startKey, endKey }
    : { startKey: endKey, endKey: startKey };
};

const applyBookingRange = (
  booking: Booking,
  startKey: string,
  endKey: string,
) => {
  const normalized = normalizeRange(startKey, endKey);
  if (!normalized) {
    return;
  }
  const startTime = extractTime(booking.checkIn, "00:00");
  const endTime = extractTime(booking.checkOut, "00:00");
  booking.startKey = normalized.startKey;
  booking.endKey = normalized.endKey;
  booking.checkIn = formatDateTime(normalized.startKey, startTime);
  booking.checkOut = formatDateTime(normalized.endKey, endTime);
};

const parseDateKey = (dateKey: string) => {
  const [yearStr, monthStr, dayStr] = dateKey.split("-");
  if (!yearStr || !monthStr || !dayStr) {
    return new Date(Number.NaN);
  }
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  return new Date(year, month - 1, day);
};

const normalizeBookingRange = (dateFrom: string, dateTo: string) => {
  const startDateTime = normalizeBookingDateTimeValue(dateFrom);
  const endDateTime = normalizeBookingDateTimeValue(dateTo);
  if (startDateTime && endDateTime) {
    if (startDateTime <= endDateTime) {
      return { startDateTime, endDateTime };
    }
    return { startDateTime: endDateTime, endDateTime: startDateTime };
  }
  return { startDateTime, endDateTime };
};

const getBookingStyle = (booking: Booking | null | undefined) => {
  if (!booking || !booking.startKey || !booking.endKey || !days.value.length) {
    return null;
  }
  const firstDay = days.value[0];
  const lastDay = days.value[days.value.length - 1];
  if (!firstDay || !lastDay) {
    return null;
  }
  const windowStartKey = firstDay.dateKey;
  const windowEndKey = lastDay.dateKey;
  const windowStart = parseDateKey(windowStartKey).getTime();
  const windowEnd = parseDateKey(windowEndKey).getTime();
  const bookingStart = parseDateKey(booking.startKey).getTime();
  const bookingEnd = parseDateKey(booking.endKey).getTime();

  const visibleStart = Math.max(windowStart, bookingStart);
  const visibleEnd = Math.min(windowEnd, bookingEnd);

  if (visibleStart > visibleEnd) {
    return null;
  }

  const visibleStartKey = formatDateKey(new Date(visibleStart));
  const visibleEndKey = formatDateKey(new Date(visibleEnd));
  const range = getRangeIndices(visibleStartKey, visibleEndKey);
  if (!range) {
    return null;
  }
  const total = days.value.length || 30;
  const widthPercent = ((range.endIndex - range.startIndex + 1) / total) * 100;
  const leftPercent = (range.startIndex / total) * 100;

  const style: Record<string, string> = {
    width: `calc(${widthPercent}% - 2px)`,
    left: `calc(${leftPercent}% + 1px)`,
  };

  const color = resolveStatusColor(booking.status);
  if (color) {
    style.backgroundColor = color;
    style.borderColor = color;
  }

  style.color = "#000000";

  return style;
};

const draftSelection = computed(() => {
  if (
    !isDragging.value ||
    dragMode.value !== "create" ||
    !activeRowKey.value ||
    !dragStartKey.value ||
    !dragHoverKey.value
  ) {
    return null;
  }
  const range = getRangeIndices(dragStartKey.value, dragHoverKey.value);
  if (!range) {
    return null;
  }
  return {
    rowKey: activeRowKey.value,
    startIndex: range.startIndex,
    endIndex: range.endIndex,
  };
});

const selectionStyle = computed(() => {
  if (!draftSelection.value) {
    return {};
  }
  const total = days.value.length || 30;
  const start = draftSelection.value.startIndex;
  const end = draftSelection.value.endIndex;
  const widthPercent = ((end - start + 1) / total) * 100;
  const leftPercent = (start / total) * 100;

  return {
    width: `calc(${widthPercent}% - 2px)`,
    left: `calc(${leftPercent}% + 1px)`,
    height: "38px",
  };
});

const generateBookingId = () =>
  `tmp-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;

const extractCategoryFromRoomName = (value: string) => {
  const parts = value.split(/\s+[—–-]\s+/);
  if (parts.length < 2) {
    return "";
  }
  return parts.slice(1).join(" - ").trim();
};

const removeBookingFromRow = (rowKeyValue: string, booking: Booking) => {
  const row = getItemByRowKey(rowKeyValue);
  if (!row) {
    return;
  }
  row.item.bookings = (row.item.bookings ?? []).filter(
    (entry) => entry !== booking,
  );
};

const buildBookingDraft = (
  rowKeyValue: string,
  startKey: string,
  endKey: string,
): Booking | null => {
  const row = getItemByRowKey(rowKeyValue);
  if (!row) {
    return null;
  }
  const listName = row.list.name ?? "";
  const roomName = row.item.name ?? "";
  const derivedCategory = extractCategoryFromRoomName(roomName);
  const normalized = normalizeRange(startKey, endKey);
  if (!normalized) {
    return null;
  }
  const id = generateBookingId();
  return {
    id,
    status: statusOptions.value[0]?.value ?? "Ожидает оплаты",
    name: "",
    phone: "",
    guests: 1,
    parkingPlaces: 0,
    category: derivedCategory || listName,
    room: roomName,
    checkIn: formatDateTime(normalized.startKey, "15:35"),
    checkOut: formatDateTime(normalized.endKey, "20:35"),
    total: 0,
    paid: 0,
    startKey: normalized.startKey,
    endKey: normalized.endKey,
    email: "",
    bookingName: "",
    comment: "",
    paymentDate: "",
    paymentHref: "",
    additionalPaymentLink: "",
    prepaymentPercentage: 0,
    guestList: [],
    extraPlace: false,
  };
};

const onDayMouseDown = (rowKeyValue: string, index: number) => {
  const day = days.value[index];
  if (!day) {
    return;
  }
  dragMode.value = "create";
  isDragging.value = true;
  dragStartKey.value = day.dateKey;
  dragHoverKey.value = day.dateKey;
  activeRowKey.value = rowKeyValue;
};

const onDayMouseEnter = (rowKeyValue: string, index: number) => {
  if (
    !isDragging.value ||
    dragMode.value !== "create" ||
    activeRowKey.value !== rowKeyValue
  ) {
    return;
  }
  const day = days.value[index];
  if (!day || !dragStartKey.value) {
    return;
  }
  dragHoverKey.value = day.dateKey;
};

const openActionDialog = (
  rowKeyValue: string,
  startKey: string,
  endKey: string,
) => {
  const normalized = normalizeRange(startKey, endKey);
  if (!normalized) {
    return;
  }
  pendingSelection.value = {
    rowKey: rowKeyValue,
    startKey: normalized.startKey,
    endKey: normalized.endKey,
  };
  emit("action-open", pendingSelection.value);
};

const clearPendingSelection = () => {
  pendingSelection.value = null;
};

const restorePendingResize = () => {
  if (!pendingResize.value) {
    return;
  }
  const row = getItemByRowKey(pendingResize.value.rowKey);
  if (!row) {
    pendingResize.value = null;
    return;
  }
  const booking = row.item.bookings.find(
    (item) => item.id === pendingResize.value?.bookingId,
  );
  if (!booking) {
    pendingResize.value = null;
    return;
  }
  booking.startKey = pendingResize.value.startKey;
  booking.endKey = pendingResize.value.endKey;
  booking.checkIn = pendingResize.value.checkIn;
  booking.checkOut = pendingResize.value.checkOut;
  pendingResize.value = null;
};

const startBookingFromSelection = () => {
  if (!pendingSelection.value) {
    return;
  }
  const draft = buildBookingDraft(
    pendingSelection.value.rowKey,
    pendingSelection.value.startKey,
    pendingSelection.value.endKey,
  );
  if (!draft) {
    clearPendingSelection();
    return;
  }
  modalBooking.value = draft;
  bookingMode.value = "create";
  bookingRowKey.value = pendingSelection.value.rowKey;
  emit("booking-open", { booking: draft, mode: "create" });
  clearPendingSelection();
};

const stopDragging = () => {
  if (!isDragging.value) {
    return;
  }
  if (dragMode.value === "create") {
    if (activeRowKey.value && dragStartKey.value && dragHoverKey.value) {
      openActionDialog(
        activeRowKey.value,
        dragStartKey.value,
        dragHoverKey.value,
      );
    }
  } else if (
    dragMode.value === "resize-left" ||
    dragMode.value === "resize-right"
  ) {
    if (activeBookingRef.value) {
      openBookingModal(activeRowKey.value, activeBookingRef.value);
    }
  }
  isDragging.value = false;
  dragMode.value = null;
  dragStartKey.value = null;
  dragHoverKey.value = null;
  activeRowKey.value = null;
  activeBookingRef.value = null;
  activeGrid.value = null;
};

const onResizeStart = (
  edge: "left" | "right",
  rowKeyValue: string,
  booking: Booking,
  event: MouseEvent,
) => {
  dragMode.value = edge === "left" ? "resize-left" : "resize-right";
  isDragging.value = true;
  dragStartKey.value = null;
  dragHoverKey.value = null;
  activeRowKey.value = rowKeyValue;
  activeBookingRef.value = booking;
  pendingResize.value = {
    rowKey: rowKeyValue,
    bookingId: booking.id,
    startKey: booking.startKey,
    endKey: booking.endKey,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
  };
  const target = event.currentTarget as HTMLElement | null;
  activeGrid.value = target
    ? (target.closest(".days-grid--collapse") as HTMLElement | null)
    : null;
};

const onGlobalMouseMove = (event: MouseEvent) => {
  if (
    !isDragging.value ||
    !activeGrid.value ||
    !activeBookingRef.value ||
    (dragMode.value !== "resize-left" && dragMode.value !== "resize-right")
  ) {
    return;
  }
  const rect = activeGrid.value.getBoundingClientRect();
  const totalDays = days.value.length || 30;
  const cellWidth = rect.width / totalDays;
  const rawIndex = Math.floor((event.clientX - rect.left) / cellWidth);
  const index = Math.max(0, Math.min(totalDays - 1, rawIndex));
  const day = days.value[index];
  if (!day) {
    return;
  }
  if (dragMode.value === "resize-left") {
    applyBookingRange(
      activeBookingRef.value,
      day.dateKey,
      activeBookingRef.value.endKey,
    );
  } else {
    applyBookingRange(
      activeBookingRef.value,
      activeBookingRef.value.startKey,
      day.dateKey,
    );
  }
};

const findRowKeyForBookingId = (bookingId: Booking["id"]) => {
  for (const list of listsState.value) {
    for (const item of list.items) {
      if (item.bookings.some((booking) => booking.id === bookingId)) {
        return rowKey(list.id, item.id);
      }
    }
  }
  return null;
};

const handleBookingClick = (rowKeyValue: string, booking: Booking) => {
  openBookingModal(rowKeyValue, booking);
};

const openBookingModal = (rowKeyValue: string | null, booking: Booking) => {
  modalBooking.value = booking;
  bookingMode.value = "edit";
  bookingRowKey.value = rowKeyValue;
  emit("booking-open", { booking, mode: "edit" });
  popoverOpen.value = false;
};

const applyBookingForm = (booking: Booking, form: BookingForm) => {
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
  booking.comment = form.comment;
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
  const startDateTime =
    normalized.startDateTime ||
    normalizeBookingDateTimeValue(booking.checkIn) ||
    normalizeBookingDateTimeValue(booking.startKey);
  const endDateTime =
    normalized.endDateTime ||
    normalizeBookingDateTimeValue(booking.checkOut) ||
    normalizeBookingDateTimeValue(booking.endKey);
  const startKey = normalizeBookingDateKey(startDateTime) || booking.startKey;
  const endKey = normalizeBookingDateKey(endDateTime) || booking.endKey;
  booking.startKey = startKey;
  booking.endKey = endKey;
  if (startDateTime) {
    booking.checkIn = formatBookingUiDateTime(startDateTime);
  }
  if (endDateTime) {
    booking.checkOut = formatBookingUiDateTime(endDateTime);
  }
};

const handleModalSave = (form: BookingForm) => {
  const booking = modalBooking.value;
  if (!booking) {
    return;
  }
  applyBookingForm(booking, form);
  const rowKeyValue = bookingRowKey.value ?? findRowKeyForBookingId(booking.id);
  const parsed = rowKeyValue ? parseRowKey(rowKeyValue) : null;
  if (form.status === CANCELLED_STATUS) {
    if (bookingMode.value === "edit" && rowKeyValue && parsed) {
      removeBookingFromRow(rowKeyValue, booking);
      emit("change", {
        type: "booking:update",
        listId: parsed.listId,
        itemId: parsed.itemId,
        booking,
      });
      commitListsChange();
    }
    pendingResize.value = null;
    modalBooking.value = null;
    bookingMode.value = null;
    bookingRowKey.value = null;
    return;
  }
  if (bookingMode.value === "create" && rowKeyValue && parsed) {
    const { listId, itemId } = parsed;
    emit("change", { type: "booking:create", listId, itemId, booking });
  } else if (bookingMode.value === "edit" && rowKeyValue && parsed) {
    const { listId, itemId } = parsed;
    emit("change", { type: "booking:update", listId, itemId, booking });
    commitListsChange();
  }
  pendingResize.value = null;
  modalBooking.value = null;
  bookingMode.value = null;
  bookingRowKey.value = null;
};

const showPopover = (booking: Booking) => {
  activeBooking.value = booking;
  popoverOpen.value = true;
};

const hidePopover = () => {
  popoverOpen.value = false;
  activeBooking.value = null;
};

const cancelBookingEdit = () => {
  restorePendingResize();
  modalBooking.value = null;
  bookingMode.value = null;
  bookingRowKey.value = null;
};

defineExpose({
  startBookingFromSelection,
  clearPendingSelection,
  saveBooking: handleModalSave,
  cancelBookingEdit,
});

onMounted(() => {
  window.addEventListener("mouseup", stopDragging);
  window.addEventListener("mousemove", onGlobalMouseMove);
});

onBeforeUnmount(() => {
  window.removeEventListener("mouseup", stopDragging);
  window.removeEventListener("mousemove", onGlobalMouseMove);
});
</script>

<style module>
.themeDark {
  --calendar-bg: linear-gradient(
    180deg,
    rgba(15, 23, 42, 0.92) 0%,
    rgba(11, 18, 32, 0.95) 100%
  );
  --calendar-header-bg: rgba(11, 18, 32, 0.85);
  --calendar-cell-bg: rgba(15, 23, 42, 0.55);
  --calendar-collapse-header-bg: rgba(11, 18, 32, 0.9);
  --calendar-collapse-content-bg: rgba(11, 18, 32, 0.85);
  --calendar-weekend-bg: rgba(251, 191, 36, 0.12);
  --surface-1: #101827;
  --border-subtle: rgba(148, 163, 184, 0.2);
  --border-strong: rgba(226, 232, 240, 0.18);
  --text-primary: #e5e7eb;
  --text-secondary: #a3b0c2;
  --text-muted: #64748b;
  --accent: #2563eb;
  --accent-strong: #1d4ed8;
  --accent-soft: rgba(37, 99, 235, 0.15);
  --text-on-accent: #f8fafc;
  --text-on-warning: #1f2937;
  --warning: #fbbf24;
  --shadow-1: 0 24px 60px rgba(2, 6, 23, 0.6);
  --shadow-2: 0 18px 40px rgba(2, 6, 23, 0.45);
}

.themeLight {
  --calendar-bg: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.96) 100%
  );
  --calendar-header-bg: rgba(248, 250, 252, 0.9);
  --calendar-cell-bg: rgba(255, 255, 255, 0.95);
  --calendar-collapse-header-bg: rgba(248, 250, 252, 0.92);
  --calendar-collapse-content-bg: rgba(248, 250, 252, 0.88);
  --calendar-weekend-bg: rgba(251, 191, 36, 0.18);
  --surface-1: #ffffff;
  --border-subtle: rgba(15, 23, 42, 0.12);
  --border-strong: rgba(15, 23, 42, 0.18);
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --accent: #2563eb;
  --accent-strong: #1d4ed8;
  --accent-soft: rgba(37, 99, 235, 0.12);
  --text-on-accent: #f8fafc;
  --text-on-warning: #1f2937;
  --warning: #d97706;
  --shadow-1: 0 24px 60px rgba(15, 23, 42, 0.12);
  --shadow-2: 0 18px 40px rgba(15, 23, 42, 0.16);
}

.root {
  width: 100%;
  background: var(--calendar-bg);

  box-shadow: none;
  overflow: visible;
}

.root :global(.header),
.root :global(.wrapper-days-numbers) {
  display: flex;
  align-items: center;
  background: var(--calendar-header-bg);
}

.root :global(.calendar-sticky) {
  position: sticky;
  top: var(--toolbar-sticky-height, 0px);
  z-index: 35;
  box-shadow: var(--shadow-2);
}

.root :global(.object) {
  flex: 0 0 140px;
  font-size: 22px;
  font-weight: 600;
  color: var(--text-muted);
  padding: 0 12px 0 16px;
  text-align: left;
}

.root :global(.object-name) {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  font-size: 14px;
  line-height: 1.1;
  white-space: normal;
  word-break: break-word;
  overflow: hidden;
  height: 45px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 0;
  position: relative;
}

.root :global(.object-name__text) {
  display: block;
  width: 100%;
  min-height: 45px;
  padding: 6px 12px 4px 16px;
  white-space: normal;
  word-break: break-word;
  background: var(--surface-1);
  line-height: normal;
}

.root :global(.object-name:hover) {
  overflow: visible;
  z-index: 30;
}

.root :global(.object-name:hover) .object-name__text {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: var(--surface-1);
  box-shadow: var(--shadow-2);
}

.root :global(.months-grid),
.root :global(.days-grid) {
  display: grid;
  grid-template-columns: repeat(30, minmax(0, 1fr));
  flex: 1;
}

.root :global(.days-grid) {
  position: relative;
}

.root :global(.days-grid) {
  border-left: 1px solid var(--border-subtle);
}

.root :global(.wrapper-days-numbers .days-grid) {
  border-top: 1px solid var(--border-subtle);
}

.root :global(.days-grid--collapse) {
  border-top: 0;
}

.root :global(.days-grid--collapse) {
  min-height: 45px;
  overflow: hidden;
}

.root :global(.month) {
  text-align: center;
  font-weight: 600;
  padding: 8px 0;
  border-right: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}

.root :global(.selection-bar) {
  position: absolute;
  top: 3px;
  border-radius: 8px;
  z-index: 2;
  pointer-events: none;
}

.root :global(.selection-bar--draft) {
  height: 38px;
  background: var(--accent-soft);
  border: 1px solid var(--accent-strong);
}

.root :global(.day-cell) {
  min-width: 32px;
  text-align: center;
  padding: 6px 0;
  border-right: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--calendar-cell-bg);
}

.root :global(.day-cell-collapse) {
  height: 45px;
  cursor: pointer;
}

.root :global(.chess-block__occupied) {
  height: 38px;
  max-height: 38px;
  position: absolute;
  top: 3px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px;
  font-size: 0.7rem;
  border: 1px solid var(--border-strong);
  font-weight: 700;
  overflow: hidden;
  white-space: nowrap;
  z-index: 5;
  background-color: var(--accent);
  color: #000000;
  box-sizing: border-box;
  transition:
    max-height 0.15s ease,
    box-shadow 0.15s ease;
}

.root :global(.chess-block__occupied:hover) {
  z-index: 20;
  box-shadow: var(--shadow-2);
}

.root :global(.resize-handle) {
  position: absolute;
  top: 0;
  width: 8px;
  height: 100%;
  cursor: ew-resize;
}

.root :global(.resize-handle--left) {
  left: 0;
}

.root :global(.resize-handle--right) {
  right: 0;
}

.root :global(.book-id),
.root :global(.booker-name),
.root :global(.booker-phone) {
  white-space: nowrap;
}

.root :global(.days-numbers) {
  font-weight: 600;
  font-size: 15px;
  height: 45px;
  text-align: center;
  box-sizing: border-box;
  padding: 11px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.root :global(.days) {
  font-weight: 600;
  font-size: 15px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.root :global(.weekend) :global(.days-numbers),
.root :global(.weekend) :global(.days) {
  color: var(--warning);
}

.root :global(.weekendCollapse) {
  background-color: var(--calendar-weekend-bg);
}

.root :global(.calendar-item) {
  display: flex;
  align-items: center;
}

.root :global(.el-collapse) {
  border: none;
}

.root :global(.el-collapse-item__header) {
  height: 45px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 0 8px;
  background: var(--calendar-collapse-header-bg);
  border-bottom: 1px solid var(--border-subtle);
}

.root :global(.el-collapse-item__content) {
  padding: 0;
  background: var(--calendar-collapse-content-bg);
}

.root :global(.el-collapse-item__arrow) {
  font-size: 14px;
  width: 14px;
  height: 14px;
  color: var(--text-secondary);
}

.root :global(.el-collapse-item__wrap) {
  border-bottom: none;
}
</style>
