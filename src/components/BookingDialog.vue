<template>
  <el-dialog
    :class="[styles.dialog, themeClass]"
    :model-value="modelValue"
    width="100%"
    align-center
    :show-close="false"
    @update:model-value="updateVisible"
  >
    <template #header>
      <div class="dialog-header">
        <div class="dialog-title">
          <div class="dialog-title__row">
            <h2>
              {{ form.bookingName || texts.bookingDialog.title }}
              <span v-if="form.id" class="dialog-id">#{{ form.id }}</span>
            </h2>
          </div>
        </div>
        <el-button class="dialog-close" text circle @click="close">✕</el-button>
      </div>
    </template>

    <el-form
      label-position="top"
      :model="form"
      :disabled="!canEdit"
      size="large"
      class="booking-form"
    >
      <section class="booking-section">
        <div class="section-title">
          {{ texts.bookingDialog.sectionBooking }}
        </div>
        <el-row :gutter="20">
          <el-col :span="12" :xs="24">
            <el-form-item :label="texts.bookingDialog.labels.bookingName">
              <el-input
                v-model="form.bookingName"
                :placeholder="texts.bookingDialog.placeholders.bookingName"
                size="large"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6" :xs="24">
            <el-form-item :label="texts.bookingDialog.labels.status">
              <el-select
                v-model="form.status"
                size="large"
                :placeholder="texts.bookingDialog.placeholders.status"
                :popper-class="popperClass"
                :class="styles.statusSelect"
                :style="statusSelectStyle"
              >
                <el-option
                  v-for="item in statusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                  <div :class="styles.statusOption">
                    <span
                      :class="styles.statusDot"
                      :style="{
                        backgroundColor: item.color || 'var(--text-muted)',
                      }"
                    ></span>
                    <span
                      :class="styles.statusOptionLabel"
                      :style="{ color: item.color || 'inherit' }"
                    >
                      {{ item.label }}
                    </span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6" :xs="24">
            <el-form-item :label="texts.bookingDialog.labels.clientType">
              <el-select v-model="form.clientType" size="large">
                <el-option
                  v-for="item in clientTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                  :disabled="item.disabled"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8" :xs="24">
            <el-form-item :label="texts.bookingDialog.labels.room">
              <el-select
                v-model="form.room"
                :placeholder="texts.bookingDialog.placeholders.room"
                filterable
                :popper-class="popperClass"
                size="large"
              >
                <el-option
                  v-for="option in roomOptions"
                  :key="option"
                  :label="option"
                  :value="option"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8" :xs="24">
            <el-form-item :label="texts.bookingDialog.labels.category">
              <el-input v-model="form.category" size="large" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8" :xs="24">
            <el-form-item :label="texts.bookingDialog.labels.guests">
              <div :class="styles.guestsInline">
                <el-input-number
                  v-model="form.guests"
                  :min="1"
                  :max="maxGuests"
                  controls-position="right"
                  size="large"
                />
                <div :class="styles.extraPlaceInline">
                  <el-switch v-model="form.extraPlace" />
                  <span>{{ extraPlaceLabel }}</span>
                </div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="8" :xs="24">
            <el-form-item :label="texts.bookingDialog.labels.parkingPlaces">
              <el-input-number
                v-model="form.parkingPlaces"
                :min="0"
                :max="maxParkingPlaces"
                :step="1"
                :precision="0"
                controls-position="right"
                size="large"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24" :xs="24">
            <el-form-item :label="texts.bookingDialog.labels.dateFrom">
              <el-date-picker
                v-model="dateRange"
                type="datetimerange"
                format="DD.MM.YYYY HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                range-separator="—"
                :start-placeholder="texts.bookingDialog.placeholders.dateFrom"
                :end-placeholder="texts.bookingDialog.placeholders.dateTo"
                :popper-class="popperClass"
                size="large"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="date-warning">
          <div v-show="hasDateConflict">
            {{ texts.bookingDialog.conflict }}
          </div>
          <div v-show="!isArrivalDatePriced && !clientTypePriceWarning">
            {{ texts.bookingDialog.warnings.dateOutOfRange }}
          </div>
          <div v-show="clientTypePriceWarning">
            {{ clientTypePriceWarning }}
          </div>
          <div v-show="!hasMinNights">
            {{
              texts.bookingDialog.warnings.minNights.replace(
                "{nights}",
                String(MIN_NIGHTS),
              )
            }}
          </div>
        </div>
      </section>

      <section class="booking-section">
        <div class="section-title">
          {{ texts.bookingDialog.sectionCustomer }}
        </div>
        <div :class="styles.customerRow">
          <el-form-item
            :label="texts.bookingDialog.labels.clientFio"
            required
            :class="styles.customerFieldFio"
          >
            <el-input
              v-model="form.clientFio"
              :placeholder="texts.bookingDialog.placeholders.clientFio"
              :class="styles.fioInputFixed"
              size="large"
            />
          </el-form-item>
          <el-form-item
            :label="texts.bookingDialog.labels.phone"
            required
            :class="styles.customerFieldShort"
          >
            <el-input
              v-model="phoneModel"
              :placeholder="texts.bookingDialog.placeholders.phone"
              inputmode="tel"
              maxlength="18"
              size="large"
            />
          </el-form-item>
          <el-form-item
            :label="texts.bookingDialog.labels.email"
            required
            :class="styles.customerFieldShort"
          >
            <el-input
              v-model="form.email"
              :placeholder="texts.bookingDialog.placeholders.email"
              size="large"
            />
          </el-form-item>
        </div>
        <el-form-item :label="texts.bookingDialog.labels.comment">
          <el-input
            v-model="form.comment"
            type="textarea"
            :placeholder="texts.bookingDialog.placeholders.comment"
            :autosize="{ minRows: 3, maxRows: 6 }"
          />
        </el-form-item>
      </section>

      <section class="booking-section">
        <div class="section-title">{{ texts.bookingDialog.sectionGuests }}</div>
        <el-row :gutter="20">
          <el-col :span="24" :xs="24">
            <el-form-item :label="texts.bookingDialog.labels.guestList">
              <div :class="styles.guestListWrap">
                <div
                  v-for="(guest, index) in form.guestList"
                  :key="`guest-${index}`"
                  :class="styles.guestListRow"
                >
                  <el-input
                    v-model="guest.fullName"
                    :placeholder="
                      texts.bookingDialog.placeholders.guestFullName
                    "
                    :class="styles.fioInputFixed"
                    size="large"
                  />
                  <el-date-picker
                    v-model="guest.birthDate"
                    type="date"
                    format="DD.MM.YYYY"
                    value-format="YYYY-MM-DD"
                    :placeholder="
                      texts.bookingDialog.placeholders.guestBirthDate
                    "
                    :popper-class="popperClass"
                    size="large"
                    :class="styles.guestDateInputFixed"
                  />
                  <el-input
                    v-model="guest.phone"
                    :placeholder="texts.bookingDialog.placeholders.guestPhone"
                    :class="styles.guestPhoneInputFixed"
                    size="large"
                  />
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </section>

      <section class="booking-section">
        <div class="section-title">
          {{ texts.bookingDialog.sectionPayment }}
        </div>
        <el-row :gutter="20">
          <el-col :span="6" :xs="24">
            <el-form-item :label="texts.bookingDialog.labels.price">
              <el-input-number
                v-model="form.price"
                :min="0"
                controls-position="right"
                size="large"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6" :xs="24">
            <el-form-item :label="texts.bookingDialog.labels.paid">
              <el-input-number
                v-model="form.paid"
                :min="0"
                controls-position="right"
                size="large"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6" :xs="24">
            <el-form-item
              :label="texts.bookingDialog.labels.prepaymentPercentage"
            >
              <el-input-number
                v-model="form.prepaymentPercentage"
                :min="0"
                :max="100"
                :step="1"
                :precision="0"
                controls-position="right"
                size="large"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6" :xs="24">
            <el-form-item :label="texts.bookingDialog.labels.dateOfPayment">
              <el-date-picker
                v-model="form.dateOfPayment"
                type="datetime"
                format="DD.MM.YYYY HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                :placeholder="texts.bookingDialog.placeholders.dateOfPayment"
                :popper-class="popperClass"
                size="large"
                :disabled="true"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="texts.bookingDialog.labels.paymentHref">
              <div :class="styles.additionalPaymentLinkRow">
                <button
                  type="button"
                  :class="styles.additionalPaymentLinkCopy"
                  :disabled="!form.paymentHref"
                  @click="copyPaymentHref"
                >
                  {{
                    form.paymentHref ||
                    texts.bookingDialog.placeholders.paymentHref
                  }}
                </button>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item
              :label="texts.bookingDialog.labels.additionalPaymentLink"
            >
              <div :class="styles.additionalPaymentLinkRow">
                <button
                  type="button"
                  :class="styles.additionalPaymentLinkCopy"
                  :disabled="!form.additionalPaymentLink"
                  @click="copyAdditionalPaymentLink"
                >
                  {{
                    form.additionalPaymentLink ||
                    texts.bookingDialog.placeholders.additionalPaymentLink
                  }}
                </button>
                <button
                  v-if="shouldShowGenerateAdditionalPaymentLink"
                  type="button"
                  :class="styles.additionalPaymentLinkGenerate"
                  :disabled="
                    additionalPaymentLinkLoading ||
                    !canGenerateAdditionalPaymentLink
                  "
                  @click="generateAdditionalPaymentLink"
                >
                  <span
                    v-if="additionalPaymentLinkLoading"
                    :class="styles.additionalPaymentLinkGenerateSpinner"
                    aria-hidden="true"
                  ></span>
                  {{
                    texts.bookingDialog.actions.generateAdditionalPaymentLink
                  }}
                </button>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </section>
    </el-form>

    <div class="dialog-actions">
      <el-button
        type="primary"
        size="large"
        class="save-button"
        :disabled="
          !canEdit ||
          hasDateConflict ||
          !isClientInfoValid ||
          !isArrivalDatePriced ||
          !hasMinNights ||
          !isClientTypePriceAvailable
        "
        @click="save"
      >
        {{ saveButtonLabel }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, useCssModule, watch } from "vue";
import { ElMessage } from "element-plus";
import { pmsApi } from "../api/pmsApi";
import { usePmsStore } from "../stores/pmsStore";
import {
  extractCategoryPricePeriods,
  type PmsCategory,
  type PmsCategoryPricePeriod,
  type PmsObject,
} from "../dto/pmsBookingDto";
import { resolveKnownStatusColor } from "../data/statusColors";
import type { BookingForm } from "../types/booking-forms";
import type {
  Booking as CalendarBooking,
  BookingGuest,
  CalendarList,
} from "../types/booking-calendar";
import {
  normalizeBookingDateKey,
  normalizeBookingDateTimeValue,
  toBookingDate,
} from "../utils/bookingDateTime";

type Booking = CalendarBooking;

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    booking: Booking | null;
    categoryOptions?: string[];
    roomOptions?: string[];
    roomOptionsByCategory?: Record<string, string[]>;
    calendarLists?: CalendarList[];
    canEdit?: boolean;
    theme?: "light" | "dark";
  }>(),
  {
    categoryOptions: () => [],
    roomOptions: () => [],
    roomOptionsByCategory: () => ({}),
    calendarLists: () => [],
    canEdit: true,
    theme: "light",
  },
);

const styles = useCssModule();
const themeClass = computed(() =>
  props.theme === "dark" ? styles.themeDark : styles.themeLight,
);
const canEdit = computed(() => props.canEdit !== false);
const popperClass = computed(() => `${styles.popper} ${themeClass.value}`);
const dateRange = computed<[string, string] | null>({
  get: () => {
    const start = form.value.dateFrom;
    const end = form.value.dateTo;
    if (!start && !end) {
      return null;
    }
    return [start || "", end || ""] as [string, string];
  },
  set: (value: [string, string] | null) => {
    form.value.dateFrom = value?.[0] ?? "";
    form.value.dateTo = value?.[1] ?? "";
  },
});

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "save", value: BookingForm): void;
}>();
const roomOptions = computed(() => props.roomOptions);
const roomOptionsByCategory = computed(() => props.roomOptionsByCategory);
const pmsStore = usePmsStore();
const categoriesList = computed<PmsCategory[]>(() => pmsStore.categories ?? []);
const objectsList = computed<PmsObject[]>(() => pmsStore.objects ?? []);
const MIN_NIGHTS = 3;
const texts = {
  bookingDialog: {
    title: "Бронирование",
    sectionBooking: "Детали бронирования",
    sectionCustomer: "Заказчик",
    sectionGuests: "Клиенты",
    sectionPayment: "Оплата",
    labels: {
      bookingName: "Название брони",
      status: "Статус",
      room: "Номер",
      category: "Категория",
      guests: "Гостей",
      parkingPlaces: "Парковочные места",
      dateFrom: "Дата заезда",
      dateTo: "Дата выезда",
      clientFio: "ФИО заказчика",
      comment: "Комментарий",
      phone: "Телефон",
      email: "Email",
      clientType: "Тип клиента",
      guestList: "Клиенты по брони",
      prepaymentPercentage: "Предоплата (%)",
      price: "Стоимость",
      paid: "Оплачено",
      dateOfPayment: "Дата оплаты",
      paymentHref: "Ссылка на оплату",
      additionalPaymentLink: "Ссылка доп. оплаты",
      extraPlace: "Дополнительное место",
    },
    placeholders: {
      bookingName: "Введите название",
      status: "Введите статус",
      room: "Выберите номер",
      dateFrom: "Выберите дату",
      dateTo: "Выберите дату",
      clientFio: "Введите ФИО",
      comment: "Введите комментарий",
      phone: "+7 (___) ___-__-__",
      email: "Введите email",
      guestFullName: "ФИО клиента",
      guestBirthDate: "Дата рождения",
      guestPhone: "Телефон гостя",
      dateOfPayment: "Выберите дату",
      paymentHref: "Ссылка отсутствует",
      additionalPaymentLink: "Ссылка не сгенерирована",
    },
    actions: {
      generateAdditionalPaymentLink: "Сгенерировать",
    },
    options: {
      clientTypeGuest: "Гость",
      clientTypeStaff: "Работник",
    },
    warnings: {
      dateOutOfRange: "Нет цены для выбранной даты заезда",
      minNights: "Минимальное количество ночей: {nights}",
      staffPriceUnavailable: "Для сотрудника нет цены на выбранную дату",
    },
    conflict: "на выбранные даты уже есть бронирование *",
  },
};
const clientTypeOptions = computed(() => [
  {
    value: "Гость",
    label: texts.bookingDialog.options.clientTypeGuest,
  },
  {
    value: "Работник",
    label: texts.bookingDialog.options.clientTypeStaff,
    disabled: !isStaffPriceAvailable.value,
  },
]);
const extraPlaceLabel = computed(() => texts.bookingDialog.labels.extraPlace);

const findCategoryByRoom = (room: string) => {
  if (!room) {
    return "";
  }
  for (const [category, rooms] of Object.entries(
    roomOptionsByCategory.value ?? {},
  )) {
    if (rooms?.includes(room)) {
      return category;
    }
  }
  return "";
};
const statusOptions = [
  {
    value: "Успешно заселен",
    label: "Успешно заселен",
    color: resolveKnownStatusColor("Успешно заселен"),
  },
  {
    value: "Оплачена вся сумма",
    label: "Оплачена вся сумма",
    color: resolveKnownStatusColor("Оплачена вся сумма"),
  },
  {
    value: "Внесена предоплата",
    label: "Внесена предоплата",
    color: resolveKnownStatusColor("Внесена предоплата"),
  },
  {
    value: "Ожидает оплаты",
    label: "Ожидает оплаты",
    color: resolveKnownStatusColor("Ожидает оплаты"),
  },
];
const PHONE_MASK_DIGITS = 10;
const additionalPaymentLinkLoading = ref(false);
const guestListBuffer = ref<BookingGuest[]>([]);
const form = ref<BookingForm>({
  id: 0,
  bookingName: "",
  status: "",
  room: roomOptions.value[0] ?? "",
  dateFrom: "",
  dateTo: "",
  clientFio: "",
  comment: "",
  phone: "",
  email: "",
  clientType: "Гость",
  guests: 1,
  parkingPlaces: 0,
  price: 0,
  paid: 0,
  prepaymentPercentage: 0,
  dateOfPayment: "",
  paymentHref: "",
  additionalPaymentLink: "",
  guestList: [],
  category: "",
  extraPlace: false,
});
const normalizePhoneDigits = (value: string) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  if (
    digits.length === 11 &&
    (digits.startsWith("7") || digits.startsWith("8"))
  ) {
    return digits.slice(1);
  }
  if (digits.startsWith("7") || digits.startsWith("8")) {
    return digits.slice(1, PHONE_MASK_DIGITS + 1);
  }
  return digits.slice(0, PHONE_MASK_DIGITS);
};

const formatPhoneMask = (value: string) => {
  const digits = normalizePhoneDigits(value);
  if (!digits) {
    return "";
  }
  const area = digits.slice(0, 3);
  const middle = digits.slice(3, 6);
  const pairOne = digits.slice(6, 8);
  const pairTwo = digits.slice(8, 10);
  let result = "+7";
  if (area) {
    result += ` (${area}`;
    if (area.length === 3) {
      result += ")";
    }
  }
  if (middle) {
    result += ` ${middle}`;
  }
  if (pairOne) {
    result += `-${pairOne}`;
  }
  if (pairTwo) {
    result += `-${pairTwo}`;
  }
  return result;
};

const phoneModel = computed({
  get: () => formatPhoneMask(form.value.phone),
  set: (value: string) => {
    form.value.phone = formatPhoneMask(value);
  },
});

const statusSelectStyle = computed(() => {
  const color = resolveKnownStatusColor(form.value.status);
  if (!color) {
    return {};
  }
  return { "--status-color": color };
});

const updateVisible = (value: boolean) => {
  emit("update:modelValue", value);
};

const close = () => {
  updateVisible(false);
};

const normalizeDateKey = (value: string) => normalizeBookingDateKey(value);

const normalizeDateTimeValue = (value: string) =>
  normalizeBookingDateTimeValue(value);

const normalizeGuestBirthDate = (value: string) => normalizeDateKey(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const pickRecordValue = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
};

const pickRecordString = (record: Record<string, unknown>, keys: string[]) => {
  const value = pickRecordValue(record, keys);
  if (value === undefined || value === null) {
    return "";
  }
  return String(value).trim();
};

const normalizeGuestPhone = (value: unknown): string => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized: string = normalizeGuestPhone(item);
      if (normalized) {
        return normalized;
      }
    }
    return "";
  }
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return normalizeGuestPhone(parsed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
};

const parseRawGuestList = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value !== "string") {
    return [];
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeRawGuestListItem = (value: unknown): BookingGuest | null => {
  if (!isRecord(value)) {
    return null;
  }
  const fullName = pickRecordString(value, [
    "full_name",
    "fullName",
    "name",
    "fio",
    "client_fio",
    "clientFio",
  ]);
  const birthDate = normalizeGuestBirthDate(
    pickRecordString(value, [
      "birth_date",
      "birthDate",
      "date_of_birth",
      "dateOfBirth",
      "dob",
    ]),
  );
  const phone = normalizeGuestPhone(
    pickRecordValue(value, [
      "phone",
      "phone_number",
      "tel",
      "mobile",
      "phones",
      "phone_list",
      "phoneList",
    ]),
  );
  if (!fullName && !birthDate && !phone) {
    return null;
  }
  return { fullName, birthDate, phone };
};

const toRoundedNumber = (value: unknown) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      return null;
    }
    const numeric = Number(trimmed.replace(/\s+/g, ""));
    return Number.isFinite(numeric) ? Math.round(numeric) : null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : null;
};

const normalizeBooleanLike = (value: unknown) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value > 0 : false;
  }
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return false;
  }
  if (["1", "true", "yes", "да", "y"].includes(trimmed)) {
    return true;
  }
  if (["0", "false", "no", "нет", "n"].includes(trimmed)) {
    return false;
  }
  const numeric = Number(trimmed.replace(/\s+/g, ""));
  return Number.isFinite(numeric) ? numeric > 0 : false;
};

const normalizeGuestList = (
  source: BookingGuest[] | undefined,
  maxCount: number,
) => {
  const guests = (Array.isArray(source) ? source : [])
    .map((guest) => ({
      fullName: String(guest.fullName ?? "").trim(),
      birthDate: normalizeGuestBirthDate(guest.birthDate ?? ""),
      phone: normalizeGuestPhone(guest.phone),
    }))
    .filter((guest) => guest.fullName || guest.birthDate || guest.phone);
  if (maxCount < 0) {
    return guests;
  }
  return guests.slice(0, maxCount);
};

const buildGuestDraftList = (
  source: BookingGuest[] | undefined,
  maxCount: number,
) => {
  const limit = Math.max(1, maxCount);
  const guests = (Array.isArray(source) ? source : [])
    .map((guest) => ({
      fullName: String(guest.fullName ?? "").trim(),
      birthDate: normalizeGuestBirthDate(guest.birthDate ?? ""),
      phone: normalizeGuestPhone(guest.phone),
    }))
    .slice(0, limit);
  while (guests.length < limit) {
    guests.push({ fullName: "", birthDate: "", phone: "" });
  }
  return guests;
};

const syncGuestListBuffer = (source: BookingGuest[] | undefined) => {
  const normalizedSource = Array.isArray(source)
    ? source.map((guest) => ({
        fullName: String(guest.fullName ?? "").trim(),
        birthDate: normalizeGuestBirthDate(guest.birthDate ?? ""),
        phone: normalizeGuestPhone(guest.phone),
      }))
    : [];
  const nextBuffer = guestListBuffer.value.slice();
  normalizedSource.forEach((guest, index) => {
    nextBuffer[index] = guest;
  });
  guestListBuffer.value = nextBuffer;
};

const rebuildGuestDraftList = (guestCount: number) => {
  syncGuestListBuffer(form.value.guestList);
  form.value.guestList = buildGuestDraftList(guestListBuffer.value, guestCount);
};

const extractGuestListFromBooking = (booking: Booking) => {
  const normalizedGuestList = normalizeGuestList(booking.guestList, -1);
  if (normalizedGuestList.length) {
    return normalizedGuestList;
  }
  if (!isRecord(booking)) {
    return [];
  }
  const guestsRaw = pickRecordValue(booking, ["guests", "guest_list", "guestList"]);
  return parseRawGuestList(guestsRaw)
    .map(normalizeRawGuestListItem)
    .filter((item): item is BookingGuest => Boolean(item));
};

const resolveGuestCountFromBooking = (
  booking: Booking,
  guestList: BookingGuest[],
) => {
  const explicitGuestCount = toRoundedNumber(booking.guests);
  if (explicitGuestCount !== null) {
    return Math.max(1, explicitGuestCount, guestList.length);
  }
  if (!isRecord(booking)) {
    return Math.max(1, guestList.length);
  }
  const rawGuestCount = toRoundedNumber(
    pickRecordValue(booking, [
      "count_guest",
      "count_guests",
      "guest_count",
      "guestCount",
      "adults",
      "adult",
    ]),
  );
  return Math.max(1, rawGuestCount ?? 0, guestList.length);
};

const resolveExtraPlaceFromBooking = (booking: Booking) => {
  if (typeof booking.extraPlace === "boolean") {
    return booking.extraPlace;
  }
  if (!isRecord(booking)) {
    return false;
  }
  return normalizeBooleanLike(
    pickRecordValue(booking, ["additional_place", "additionalPlace", "extraPlace"]),
  );
};

const normalizeFormGuests = (value: unknown) =>
  Math.max(1, Number(value) || 1);

const resolveFormGuestsFromBooking = (
  totalGuests: number,
  extraPlace: boolean,
) => {
  const normalizedTotalGuests = Math.max(1, totalGuests || 1);
  if (!extraPlace) {
    return normalizedTotalGuests;
  }
  return Math.max(1, normalizedTotalGuests - 1);
};

const resolveVisibleGuestCount = (
  guests: number,
  extraPlace: boolean,
) => normalizeFormGuests(guests) + (extraPlace ? 1 : 0);

const normalizePrepaymentPercentage = (value: unknown) => {
  const numeric = Math.round(Number(value) || 0);
  return Math.min(100, Math.max(0, numeric));
};

const syncForm = (booking: Booking | null) => {
  if (!booking) {
    return;
  }
  const guestList = extractGuestListFromBooking(booking);
  const extraPlace = resolveExtraPlaceFromBooking(booking);
  const resolvedRoom = booking.room ?? roomOptions.value[0] ?? "";
  const resolvedStatus = booking.status ?? "";
  const resolvedCategory = booking.category ?? findCategoryByRoom(resolvedRoom);
  const resolvedBookingName = booking.bookingName?.trim() || booking.name || "";
  const dateFrom =
    normalizeDateTimeValue(booking.checkIn) ||
    normalizeDateTimeValue(booking.startKey);
  const dateTo =
    normalizeDateTimeValue(booking.checkOut) ||
    normalizeDateTimeValue(booking.endKey);
  const totalGuests = resolveGuestCountFromBooking(booking, guestList);
  const guests = resolveFormGuestsFromBooking(totalGuests, extraPlace);
  const visibleGuestCount = resolveVisibleGuestCount(guests, extraPlace);
  guestListBuffer.value = buildGuestDraftList(guestList, visibleGuestCount);

  form.value = {
    id: booking.id,
    bookingName: resolvedBookingName,
    status: resolvedStatus,
    room: resolvedRoom,
    dateFrom,
    dateTo,
    clientFio: booking.name ?? "",
    comment: booking.comment ?? "",
    phone: formatPhoneMask(booking.phone ?? ""),
    email: booking.email ?? "",
    clientType: booking.clientType?.trim() || "Гость",
    guests,
    parkingPlaces: Math.max(0, Number(booking.parkingPlaces) || 0),
    price: booking.total ?? 0,
    paid: booking.paid ?? 0,
    prepaymentPercentage: normalizePrepaymentPercentage(
      booking.prepaymentPercentage,
    ),
    dateOfPayment: normalizeDateTimeValue(booking.paymentDate ?? ""),
    paymentHref: booking.paymentHref ?? "",
    additionalPaymentLink: booking.additionalPaymentLink ?? "",
    guestList: buildGuestDraftList(guestListBuffer.value, visibleGuestCount),
    category: resolvedCategory ?? "",
    extraPlace,
  };
};

watch(
  () => props.booking,
  (value) => {
    if (props.modelValue) {
      syncForm(value);
    }
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      syncForm(props.booking);
    }
  },
);

watch(
  () => roomOptions.value,
  (options) => {
    if (!options.length) {
      form.value.room = "";
      return;
    }
    if (!options.includes(form.value.room)) {
      form.value.room = options[0] ?? "";
    }
  },
  { immediate: true },
);

watch(
  () => form.value.room,
  (value) => {
    const roomRecord = resolveRoomByName(value ?? "");
    const categoryId = resolveCategoryIdFromRoom(roomRecord);
    const resolvedCategory = resolveCategoryById(categoryId);
    const derived =
      resolvedCategory?.name ??
      resolvedCategory?.title ??
      findCategoryByRoom(value ?? "");
    if (derived && derived !== form.value.category) {
      form.value.category = derived;
    }
  },
);

type DateRange = {
  start: Date;
  end: Date;
};

const parseDateOnlyValue = (value: string) => {
  const normalized = normalizeDateKey(value);
  if (normalized) {
    const parts = normalized.split("-");
    if (parts.length === 3) {
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      const day = Number(parts[2]);
      if (
        Number.isFinite(year) &&
        Number.isFinite(month) &&
        Number.isFinite(day)
      ) {
        return new Date(year, month - 1, day, 12, 0, 0, 0);
      }
    }
  }
  return null;
};

const normalizeDateRange = (
  startValue: string,
  endValue: string,
): DateRange | null => {
  const start = parseDateOnlyValue(startValue);
  const end = parseDateOnlyValue(endValue);
  if (!start || !end) {
    return null;
  }
  return start <= end ? { start, end } : { start: end, end: start };
};

const normalizeDateTimeRange = (
  startValue: string,
  endValue: string,
): DateRange | null => {
  const start = toBookingDate(startValue);
  const end = toBookingDate(endValue);
  if (!start || !end) {
    return null;
  }
  return start <= end ? { start, end } : { start: end, end: start };
};

const isArrivalDatePriced = computed(() => {
  const range = normalizeDateRange(form.value.dateFrom, form.value.dateTo);
  if (!range) {
    return true;
  }
  const category = resolveCategoryForForm();
  if (!category) {
    return true;
  }
  const periods = resolveCategoryPeriods(category);
  if (!periods.length) {
    return true;
  }
  const priceType = resolvePriceType(periods, form.value.clientType);
  if (!priceType) {
    return false;
  }
  return sumPriceForRange(periods, range.start, range.end, priceType) !== null;
});

const nightsCount = computed(() => {
  const range = normalizeDateRange(form.value.dateFrom, form.value.dateTo);
  return range ? countNights(range.start, range.end) : 0;
});

const hasMinNights = computed(() => nightsCount.value >= MIN_NIGHTS);

const isStaffPriceAvailable = computed(() => {
  const range = normalizeDateRange(form.value.dateFrom, form.value.dateTo);
  if (!range) {
    return true;
  }
  const category = resolveCategoryForForm();
  if (!category) {
    return true;
  }
  const periods = resolveCategoryPeriods(category);
  if (!periods.length) {
    return true;
  }
  return Boolean(resolvePeriodForDate(periods, range.start, "staff"));
});

const isGuestPriceAvailable = computed(() => {
  const range = normalizeDateRange(form.value.dateFrom, form.value.dateTo);
  if (!range) {
    return true;
  }
  const category = resolveCategoryForForm();
  if (!category) {
    return true;
  }
  const periods = resolveCategoryPeriods(category);
  if (!periods.length) {
    return true;
  }
  return Boolean(resolvePeriodForDate(periods, range.start, "private"));
});

const isClientTypePriceAvailable = computed(() => {
  if (isStaffClientType(form.value.clientType)) {
    return isStaffPriceAvailable.value;
  }
  if (isGuestClientType(form.value.clientType)) {
    return isGuestPriceAvailable.value;
  }
  return true;
});

const clientTypePriceWarning = computed(() => {
  if (
    isStaffClientType(form.value.clientType) &&
    !isStaffPriceAvailable.value
  ) {
    return texts.bookingDialog.warnings.staffPriceUnavailable;
  }
  return "";
});

const normalizeText = (value: string) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const isStaffClientType = (value: string | null | undefined) => {
  const normalized = normalizeText(value ?? "");
  return (
    normalized === "сотрудник" ||
    normalized === "работник" ||
    normalized === "staff" ||
    normalized.includes("сотр") ||
    normalized.includes("работ")
  );
};

const isGuestClientType = (value: string | null | undefined) => {
  const normalized = normalizeText(value ?? "");
  return (
    normalized === "гость" ||
    normalized === "guest" ||
    normalized.includes("гост")
  );
};

const isStudentClientType = (value: string | null | undefined) => {
  const normalized = normalizeText(value ?? "");
  return (
    normalized === "студент" ||
    normalized === "student" ||
    normalized.includes("студ")
  );
};

const normalizeIdValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  return null;
};

const normalizeNumber = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const numberValue = Number(trimmed.replace(/\s+/g, ""));
    return Number.isFinite(numberValue) ? numberValue : null;
  }
  return null;
};

const resolveCategoryByName = (name: string) => {
  const needle = normalizeText(name);
  if (!needle) {
    return null;
  }
  return (
    categoriesList.value.find((category) => {
      const record = category as Record<string, unknown>;
      const candidates = [
        category.name,
        category.title,
        record.category_name as string | undefined,
      ];
      return candidates.some(
        (value) => value && normalizeText(String(value)) === needle,
      );
    }) ?? null
  );
};

const resolveCategoryById = (id: string | number | null | undefined) => {
  const needle = normalizeIdValue(id);
  if (needle === null) {
    return null;
  }
  const needleText = String(needle);
  return (
    categoriesList.value.find((category) => {
      const record = category as Record<string, unknown>;
      const candidate =
        record.category_id ??
        record.id ??
        (record as { categoryId?: unknown }).categoryId;
      if (candidate === undefined || candidate === null) {
        return false;
      }
      return String(candidate) === needleText;
    }) ?? null
  );
};

const resolveCategoryForForm = () => {
  const room = resolveRoomByName(form.value.room ?? "");
  const categoryId = resolveCategoryIdFromRoom(room);
  return (
    resolveCategoryById(categoryId) ??
    resolveCategoryByName(form.value.category ?? "")
  );
};

const resolveRoomByName = (roomName: string) => {
  const needle = normalizeText(roomName);
  if (!needle) {
    return null;
  }
  const matched =
    objectsList.value.find((object) => {
      const record = object as Record<string, unknown>;
      const candidates = [
        object.name,
        object.number,
        record.room_name as string | undefined,
        record.roomName as string | undefined,
      ];
      return candidates.some(
        (value) => value && normalizeText(String(value)) === needle,
      );
    }) ?? null;
  return matched;
};

const resolveRoomCapacity = (room: PmsObject | null) => {
  if (!room) {
    return null;
  }
  const record = room as Record<string, unknown>;
  const capacityRaw = record.capacity ?? record.max_guests;
  return normalizeNumber(capacityRaw);
};

const resolveCategoryIdFromRoom = (room: PmsObject | null) => {
  if (!room) {
    return null;
  }
  const record = room as Record<string, unknown>;
  const roomType = record.room_type;
  if (roomType && typeof roomType === "object") {
    const roomTypeRecord = roomType as Record<string, unknown>;
    const nestedId =
      roomTypeRecord.id ??
      roomTypeRecord.category_id ??
      roomTypeRecord.categoryId;
    const normalized = normalizeIdValue(nestedId);
    if (normalized !== null) {
      return normalized;
    }
  }
  if (typeof roomType === "string" || typeof roomType === "number") {
    const normalized = normalizeIdValue(roomType);
    if (normalized !== null) {
      return normalized;
    }
  }
  const direct =
    record.room_type_id ??
    record.roomTypeId ??
    record.category_id ??
    record.categoryId;
  return normalizeIdValue(direct);
};

const resolveCategoryPeriods = (
  category: PmsCategory | null,
): PmsCategoryPricePeriod[] => {
  if (!category) {
    return [];
  }
  if (Array.isArray(category.pricePeriods) && category.pricePeriods.length) {
    return category.pricePeriods;
  }
  return extractCategoryPricePeriods(category);
};

const normalizePriceNumber = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed
    .replace(/\s+/g, "")
    .replace(",", ".")
    .replace(/[^\d.+-]/g, "");
  if (!normalized || /^[-+.]+$/.test(normalized)) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveParkingPlacesPrice = (category: PmsCategory | null) => {
  if (!category) {
    return 0;
  }
  const record = category as Record<string, unknown>;
  const rawValue =
    record.parking_plases_price ??
    record.parking_places_price ??
    record.parkingPlacesPrice;
  const normalized = normalizePriceNumber(rawValue);
  if (normalized === null || normalized <= 0) {
    return 0;
  }
  return normalized;
};

const resolveAdditionalPlacePrice = (category: PmsCategory | null) => {
  if (!category) {
    return 0;
  }
  const record = category as Record<string, unknown>;
  const rawValue =
    record.price_additionally_place ??
    record.priceAdditionalPlace ??
    record.additional_place_price ??
    record.additionalPlacePrice;
  const normalized = normalizePriceNumber(rawValue);
  if (normalized === null || normalized <= 0) {
    return 0;
  }
  return normalized;
};

const resolvePriceType = (
  periods: PmsCategoryPricePeriod[],
  clientType?: string | null,
) => {
  if (isStaffClientType(clientType)) {
    return periods.some((period) => period.type === "staff") ? "staff" : null;
  }
  if (isGuestClientType(clientType)) {
    return periods.some((period) => period.type === "private")
      ? "private"
      : null;
  }
  if (periods.some((period) => period.type === "private")) {
    return "private";
  }
  if (periods.some((period) => period.type === "staff")) {
    return "staff";
  }
  return null;
};

const getMonthDayKey = (date: Date) =>
  (date.getMonth() + 1) * 100 + date.getDate();

const resolvePeriodForDate = (
  periods: PmsCategoryPricePeriod[],
  date: Date,
  preferredType: "private" | "staff",
) => {
  const dayKey = getMonthDayKey(date);
  return (
    periods.find(
      (period) =>
        period.type === preferredType && isPeriodMatch(period, dayKey),
    ) ?? null
  );
};

const isPeriodMatch = (period: PmsCategoryPricePeriod, dayKey: number) => {
  const fromKey = period.from.month * 100 + period.from.day;
  const toKey = period.to.month * 100 + period.to.day;
  if (fromKey <= toKey) {
    return dayKey >= fromKey && dayKey <= toKey;
  }
  return dayKey >= fromKey || dayKey <= toKey;
};

const resolvePriceForDate = (
  periods: PmsCategoryPricePeriod[],
  date: Date,
  preferredType: "private" | "staff",
) => {
  const match = resolvePeriodForDate(periods, date, preferredType);
  return match ? match.price : null;
};

const sumPriceForRange = (
  periods: PmsCategoryPricePeriod[],
  start: Date,
  end: Date,
  preferredType: "private" | "staff",
) => {
  const cursor = new Date(start);
  const limit = new Date(end);
  let total = 0;
  while (cursor < limit) {
    const price = resolvePriceForDate(periods, cursor, preferredType);
    if (price === null) {
      return null;
    }
    total += price;
    cursor.setDate(cursor.getDate() + 1);
  }
  return total;
};

const countNights = (start: Date, end: Date) => {
  const cursor = new Date(start);
  const limit = new Date(end);
  let days = 0;
  while (cursor < limit) {
    days += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

const calculateCategoryPrice = () => {
  const range = normalizeDateRange(form.value.dateFrom, form.value.dateTo);
  if (!range) {
    return null;
  }
  const category = resolveCategoryForForm();
  if (!category) {
    return null;
  }
  const periods = resolveCategoryPeriods(category);
  if (!periods.length) {
    return null;
  }
  const priceType = resolvePriceType(periods, form.value.clientType);
  if (!priceType) {
    return null;
  }
  const rangePrice = sumPriceForRange(
    periods,
    range.start,
    range.end,
    priceType,
  );
  if (rangePrice === null) {
    return null;
  }
  const guests = normalizeFormGuests(form.value.guests);
  const paymentType = normalizeText(category.payment_type ?? "");
  const payPerRoom =
    paymentType.includes("номер") || paymentType.includes("room");
  const guestsMultiplier = payPerRoom ? 1 : guests;
  let total = rangePrice * guestsMultiplier;
  const stayDays = Math.max(0, countNights(range.start, range.end));
  const additionalPlacePrice = resolveAdditionalPlacePrice(category);
  if (form.value.extraPlace && additionalPlacePrice > 0 && stayDays > 0) {
    total += additionalPlacePrice * stayDays;
  }
  const parkingPlaces = Math.max(
    0,
    Math.round(Number(form.value.parkingPlaces) || 0),
  );
  const parkingPlacesPrice = resolveParkingPlacesPrice(category);
  if (parkingPlaces > 0 && parkingPlacesPrice > 0 && stayDays > 0) {
    total += parkingPlaces * parkingPlacesPrice * stayDays;
  }
  return Math.max(0, Math.round(total));
};

const calculatedPrice = computed(() => calculateCategoryPrice());
const visibleGuestCount = computed(() =>
  resolveVisibleGuestCount(form.value.guests, Boolean(form.value.extraPlace)),
);
const maxGuests = computed(() => {
  const room = resolveRoomByName(form.value.room ?? "");
  const capacity = resolveRoomCapacity(room);
  if (!capacity || capacity < 1) {
    return undefined;
  }
  return capacity;
});
const maxParkingPlaces = computed(() => {
  if (
    pmsStore.countParkingPlaces === null ||
    pmsStore.countParkingPlaces === undefined
  ) {
    return undefined;
  }
  const value = Number(pmsStore.countParkingPlaces);
  if (!Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return Math.floor(value);
});

watch(
  calculatedPrice,
  (value) => {
    if (value === null || value === undefined) {
      return;
    }
    if (Number(form.value.price) !== value) {
      form.value.price = value;
    }
  },
  { immediate: true },
);

watch(
  maxGuests,
  (max) => {
    if (!max || max < 1) {
      return;
    }
    const currentGuests = normalizeFormGuests(form.value.guests);
    if (currentGuests > max) {
      form.value.guests = max;
    }
  },
  { immediate: true },
);

watch(
  () => form.value.guests,
  (value) => {
    const normalizedGuests = normalizeFormGuests(value);
    if (normalizedGuests !== value) {
      form.value.guests = normalizedGuests;
      return;
    }
    rebuildGuestDraftList(visibleGuestCount.value);
  },
  { immediate: true },
);

watch(
  () => form.value.extraPlace,
  () => {
    rebuildGuestDraftList(visibleGuestCount.value);
  },
  { immediate: true },
);

watch(
  maxParkingPlaces,
  (limit) => {
    if (limit === undefined) {
      return;
    }
    if (Number(form.value.parkingPlaces) > limit) {
      form.value.parkingPlaces = limit;
    }
  },
  { immediate: true },
);

const getBookingDateRange = (booking: CalendarBooking): DateRange | null => {
  const startValue =
    toBookingDate(booking.checkIn ?? "") || toBookingDate(booking.startKey ?? "");
  const endValue =
    toBookingDate(booking.checkOut ?? "") || toBookingDate(booking.endKey ?? "");
  if (!startValue || !endValue) {
    return null;
  }
  return startValue <= endValue
    ? { start: startValue, end: endValue }
    : { start: endValue, end: startValue };
};

const isSameBookingId = (
  bookingId: CalendarBooking["id"],
  currentId: BookingForm["id"],
) => {
  if (currentId === undefined || currentId === null) {
    return false;
  }
  return String(bookingId) === String(currentId);
};

const calendarLists = computed(() => props.calendarLists ?? []);

const activeRoomBookings = computed<CalendarBooking[]>(() => {
  const room = form.value.room?.trim();
  if (!room) {
    return [];
  }
  const category = form.value.category?.trim();
  const lists = calendarLists.value;
  if (category) {
    const list = lists.find((entry) => entry.name === category);
    const item = list?.items.find((entry) => entry.name === room);
    if (item?.bookings?.length) {
      return item.bookings;
    }
  }
  for (const list of lists) {
    const item = list.items.find((entry) => entry.name === room);
    if (item?.bookings?.length) {
      return item.bookings;
    }
  }
  return [];
});

const isClientInfoValid = computed(() => {
  const name = form.value.clientFio?.trim();
  const phone = form.value.phone?.trim();
  const email = form.value.email?.trim();
  return Boolean(name && phone && email);
});

const hasDateConflict = computed(() => {
  const range = normalizeDateTimeRange(form.value.dateFrom, form.value.dateTo);
  if (!range) {
    return false;
  }
  const currentId = form.value.id;
  return activeRoomBookings.value.some((booking) => {
    if (isSameBookingId(booking.id, currentId)) {
      return false;
    }
    const bookingRange = getBookingDateRange(booking);
    if (!bookingRange) {
      return false;
    }
    return range.start < bookingRange.end && range.end > bookingRange.start;
  });
});

const isNewBooking = () =>
  typeof form.value.id === "string" && form.value.id.startsWith("tmp-");

const resolveSavedBookingId = (value: BookingForm["id"]) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("tmp-")) {
    return null;
  }
  return trimmed;
};

const canGenerateAdditionalPaymentLink = computed(
  () => resolveSavedBookingId(form.value.id) !== null,
);

const shouldShowGenerateAdditionalPaymentLink = computed(
  () => !isStudentClientType(form.value.clientType),
);

const copyText = async (value: string) => {
  const text = value.trim();
  if (!text) {
    return false;
  }
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below.
    }
  }
  if (typeof document === "undefined") {
    return false;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  document.body.removeChild(textarea);
  return copied;
};

const copyPaymentHref = async () => {
  const link = String(form.value.paymentHref ?? "").trim();
  if (!link) {
    ElMessage.warning("Ссылка на оплату отсутствует");
    return;
  }
  const copied = await copyText(link);
  if (!copied) {
    ElMessage.error("Не удалось скопировать ссылку");
    return;
  }
  ElMessage.success("Ссылка на оплату скопирована");
};

const copyAdditionalPaymentLink = async () => {
  const link = String(form.value.additionalPaymentLink ?? "").trim();
  if (!link) {
    ElMessage.warning("Ссылка доп. оплаты отсутствует");
    return;
  }
  const copied = await copyText(link);
  if (!copied) {
    ElMessage.error("Не удалось скопировать ссылку");
    return;
  }
  ElMessage.success("Ссылка доп. оплаты скопирована");
};

const generateAdditionalPaymentLink = async () => {
  const bookingId = resolveSavedBookingId(form.value.id);
  if (bookingId === null) {
    ElMessage.warning("Сначала сохраните бронирование");
    return;
  }
  let requestError = "";
  additionalPaymentLinkLoading.value = true;
  try {
    const response = await pmsApi.generateAdditionalPaymentLink({
      id: bookingId,
      onError: (error) => {
        requestError = error.message;
      },
    });
    const additionalPaymentLink = String(
      response?.additionalPaymentLink ?? "",
    ).trim();
    if (!additionalPaymentLink) {
      ElMessage.error(requestError || "Не удалось получить ссылку доп. оплаты");
      return;
    }
    form.value.additionalPaymentLink = additionalPaymentLink;
    if (props.booking) {
      props.booking.additionalPaymentLink = additionalPaymentLink;
    }
    ElMessage.success("Ссылка доп. оплаты сгенерирована");
  } finally {
    additionalPaymentLinkLoading.value = false;
  }
};

const saveButtonLabel = computed(() =>
  isNewBooking() ? "Создать" : "Изменить",
);

const save = async () => {
  if (hasDateConflict.value) {
    return;
  }
  if (!isClientInfoValid.value) {
    return;
  }
  const guests = visibleGuestCount.value;
  const guestList = normalizeGuestList(form.value.guestList, guests);
  const parkingPlacesLimit = maxParkingPlaces.value;
  const parkingPlacesRaw = Math.max(
    0,
    Math.round(Number(form.value.parkingPlaces) || 0),
  );
  const parkingPlaces =
    parkingPlacesLimit === undefined
      ? parkingPlacesRaw
      : Math.min(parkingPlacesRaw, parkingPlacesLimit);
  const price = Number(form.value.price) || 0;
  const paid = Number(form.value.paid) || 0;
  const prepaymentPercentage = normalizePrepaymentPercentage(
    form.value.prepaymentPercentage,
  );
  const dateOfPayment = normalizeDateTimeValue(form.value.dateOfPayment);
  emit("save", {
    ...form.value,
    phone: formatPhoneMask(form.value.phone),
    guests,
    guestList,
    parkingPlaces,
    price,
    paid,
    prepaymentPercentage,
    dateOfPayment,
  });
  close();
};
</script>

<style module>
.themeDark {
  --dialog-bg: linear-gradient(
    180deg,
    rgba(16, 24, 39, 0.96) 0%,
    rgba(11, 18, 32, 0.98) 100%
  );
  --shadow-1: 0 24px 60px rgba(2, 6, 23, 0.6);
  --shadow-2: 0 18px 40px rgba(2, 6, 23, 0.45);
  --shadow-button: 0 6px 14px rgba(2, 6, 23, 0.35);
  --border-subtle: rgba(148, 163, 184, 0.2);
  --border-strong: rgba(226, 232, 240, 0.18);
  --text-primary: #e5e7eb;
  --text-secondary: #a3b0c2;
  --text-muted: #64748b;
  --accent: #2563eb;
  --accent-strong: #1d4ed8;
  --accent-soft: rgba(37, 99, 235, 0.15);
  --text-on-accent: #f8fafc;
  --danger: #f87171;
  --surface-2: #0f1b2d;
  --surface-3: #0b1220;
  --status-group-bg: rgba(11, 18, 32, 0.9);
  --nights-bg: linear-gradient(
    135deg,
    rgba(37, 99, 235, 0.2) 0%,
    rgba(37, 99, 235, 0.12) 100%
  );
  --nights-border: rgba(37, 99, 235, 0.4);
  --button-primary-bg: linear-gradient(120deg, #1d4ed8, #2563eb);
}

.themeLight {
  --dialog-bg: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  --shadow-1: 0 24px 60px rgba(15, 23, 42, 0.12);
  --shadow-2: 0 18px 40px rgba(15, 23, 42, 0.16);
  --shadow-button: 0 6px 14px rgba(15, 23, 42, 0.18);
  --border-subtle: rgba(15, 23, 42, 0.12);
  --border-strong: rgba(15, 23, 42, 0.18);
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --accent: #2563eb;
  --accent-strong: #1d4ed8;
  --accent-soft: rgba(37, 99, 235, 0.12);
  --text-on-accent: #f8fafc;
  --danger: #dc2626;
  --surface-2: #f8fafc;
  --surface-3: #f1f5f9;
  --status-group-bg: #f8fafc;
  --nights-bg: linear-gradient(
    135deg,
    rgba(37, 99, 235, 0.12) 0%,
    rgba(37, 99, 235, 0.08) 100%
  );
  --nights-border: rgba(37, 99, 235, 0.3);
  --button-primary-bg: linear-gradient(120deg, #1d4ed8, #2563eb);
}

.dialog {
  max-width: 1100px;
  border-radius: 20px;
  background: var(--dialog-bg);
  box-shadow: var(--shadow-1);
  backdrop-filter: blur(12px);
}

.dialog :global(.el-dialog__body) {
  padding: 0 28px 28px;
}

.dialog :global(.el-dialog__header) {
  padding: 24px 28px 8px;
}

.dialog :global(.dialog-header) {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.guestsInline {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.extraPlaceInline {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.customerRow {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.customerFieldFio {
  width: 420px;
  max-width: 100%;
}

.customerFieldShort {
  width: 260px;
  max-width: 100%;
}

.guestListWrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.guestListRow {
  display: grid;
  grid-template-columns: 420px 260px 260px;
  align-items: center;
  gap: 20px;
  justify-content: start;
}

.fioInputFixed {
  width: 100% !important;
  max-width: none;
}

.guestDateInputFixed {
  width: 100% !important;
  max-width: none;
}

.guestPhoneInputFixed {
  width: 100% !important;
  max-width: none;
}

.additionalPaymentLinkRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.additionalPaymentLinkCopy {
  flex: 1 1 auto;
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px dashed var(--border-subtle);
  background: var(--surface-3);
  color: var(--accent);
  font: inherit;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.additionalPaymentLinkCopy:hover:not(:disabled) {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.additionalPaymentLinkCopy:disabled {
  color: var(--text-muted);
  cursor: default;
}

.additionalPaymentLinkGenerate {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid var(--accent);
  background: transparent;
  color: var(--accent);
  font: inherit;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    opacity 0.15s ease;
}

.additionalPaymentLinkGenerate:hover:not(:disabled) {
  background: var(--accent-soft);
}

.additionalPaymentLinkGenerate:disabled {
  border-color: var(--border-subtle);
  background: var(--surface-3);
  color: var(--text-muted);
  cursor: default;
}

.additionalPaymentLinkGenerateSpinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: additionalPaymentLinkGenerateSpin 0.7s linear infinite;
}

@keyframes additionalPaymentLinkGenerateSpin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .additionalPaymentLinkGenerate {
    transition: none;
  }

  .additionalPaymentLinkGenerateSpinner {
    animation: none;
  }
}

@media (max-width: 768px) {
  .guestListRow {
    grid-template-columns: 1fr;
  }

  .customerFieldFio,
  .customerFieldShort,
  .fioInputFixed,
  .guestDateInputFixed,
  .guestPhoneInputFixed {
    width: 100% !important;
  }

  .additionalPaymentLinkRow {
    flex-direction: column;
    align-items: stretch;
  }
}

.dialog :global(.dialog-title) h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.dialog :global(.dialog-title__row) {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.dialog :global(.dialog-id) {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
}

.dialog :global(.dialog-link) {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  color: var(--accent);
  text-decoration: none;
}

.dialog :global(.dialog-link):hover {
  text-decoration: underline;
  color: var(--accent-strong);
}

.dialog :global(.dialog-link--disabled) {
  color: var(--text-muted);
  cursor: default;
  text-decoration: none;
}

.dialog :global(.dialog-close) {
  color: var(--text-secondary);
}

.dialog :global(.booking-form) {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dialog :global(.booking-section) {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dialog :global(.section-title) {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.dialog :global(.nights-output) {
  height: 44px;
  border-radius: 12px;
  background: var(--nights-bg);
  border: 1px solid var(--nights-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  color: var(--accent);
  box-shadow: var(--shadow-2);
  letter-spacing: 0.5px;
  min-width: 120px;
}

.dialog :global(.status-group) {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0;
  border: none;
  border-radius: 0;
  overflow: hidden;
  background: var(--status-group-bg);
  width: fit-content;
}

.dialog :global(.status-group) :global(.el-radio-button) {
  margin: 0;
}

.dialog :global(.status-group) :global(.el-radio-button__inner) {
  padding: 8px 16px;
  border: none;
  border-radius: 0;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
}

.dialog
  :global(.status-group)
  :global(.el-radio-button + .el-radio-button .el-radio-button__inner) {
  border-left: 1px solid var(--border-subtle);
}

.dialog :global(.status-group) :global(.is-active .el-radio-button__inner) {
  background: var(--accent);
  color: var(--text-on-accent);
  font-weight: 500;
  box-shadow: none;
}

.dialog
  :global(.status-group)
  :global(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  border-color: transparent;
}

.dialog :global(.status-group) :global(.el-radio-button__inner:hover) {
  border-color: transparent;
}

.dialog :global(.date-row) {
  align-items: flex-end;
}

.dialog :global(.date-warning) {
  color: var(--danger);
  font-size: 13px;
  font-weight: 500;
  margin-top: 4px;
}

.dialog :global(.label-with-icon) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
}

.dialog :global(.guest-line) {
  display: grid;
  grid-template-columns: 100px 110px;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.dialog :global(.label-icon svg) {
  width: 20px;
  height: 18px;
  display: block;
}

.dialog :global(.guest-input) {
  width: 110px;
  flex: 0 0 110px;
}

.dialog :global(.guest-input) :global(.el-input-number__wrapper) {
  width: 110px;
}

.dialog :global(.finance-card) {
  border-radius: 16px;
  background: var(--surface-2);
  box-shadow: var(--shadow-2);
}

.dialog :global(.card-title) {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.dialog :global(.dialog-actions) {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.dialog :global(.save-button) {
  padding: 12px 28px;
  min-width: 160px;
  background: var(--button-primary-bg);
  border-color: transparent;
  color: var(--text-on-accent);
  box-shadow: var(--shadow-button);
}

.dialog :global(.save-button.is-disabled),
.dialog :global(.save-button):disabled {
  background: var(--surface-3);
  border-color: var(--border-subtle);
  color: var(--text-muted);
  box-shadow: none;
}

.dialog :global(.total-output) {
  height: 40px;
  border-radius: 10px;
  background: var(--surface-3);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.dialog :global(.el-input),
.dialog :global(.el-select),
.dialog :global(.el-input-number),
.dialog :global(.el-date-editor) {
  width: 100%;
}

.dialog :global(.el-input__wrapper),
.dialog :global(.el-select__wrapper),
.dialog :global(.el-date-editor),
.dialog :global(.el-textarea__inner),
.dialog :global(.el-input-number__wrapper) {
  background: var(--surface-3);
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}

.dialog :global(.el-input__inner),
.dialog :global(.el-select__selected-item),
.dialog :global(.el-textarea__inner) {
  color: var(--text-primary);
}

.statusSelect {
  --status-color: var(--text-primary);
}

.statusSelect :global(.el-input__inner),
.statusSelect :global(.el-select__selected-item) {
  color: var(--status-color);
  font-weight: 600;
}

.statusSelect :global(.el-select__caret) {
  color: var(--status-color);
}

.statusOption {
  display: flex;
  align-items: center;
  gap: 8px;
}

.statusDot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex: 0 0 8px;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.15);
}

.statusOptionLabel {
  font-weight: 500;
}

.dialog :global(.el-input__inner::placeholder),
.dialog :global(.el-textarea__inner::placeholder) {
  color: var(--text-muted);
}

.dialog :global(.guest-input.el-input-number) {
  width: 110px;
}

.popper {
  z-index: 10010 !important;
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

.popper :global(.el-time-panel) {
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
}

.popper :global(.el-time-panel__footer) {
  background: var(--surface-2);
  border-top: 1px solid var(--border-subtle);
}

.popper :global(.el-time-panel__btn) {
  color: var(--text-secondary);
}

.popper :global(.el-time-panel__btn.confirm) {
  color: var(--accent);
}

.popper :global(.el-time-spinner__wrapper) {
  border-left: 1px solid var(--border-subtle);
}

.popper :global(.el-time-panel__content::before) {
  background: linear-gradient(180deg, var(--surface-2) 0%, transparent 100%);
}

.popper :global(.el-time-panel__content::after) {
  background: linear-gradient(0deg, var(--surface-2) 0%, transparent 100%);
}

.popper :global(.el-time-spinner__item) {
  color: var(--text-secondary);
}

.popper :global(.el-time-spinner__item.is-active) {
  color: var(--text-primary);
}

.popper :global(.el-time-spinner__item:hover) {
  background: var(--accent-soft);
  color: var(--text-primary);
}
</style>
