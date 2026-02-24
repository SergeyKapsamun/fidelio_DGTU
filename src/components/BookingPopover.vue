<template>
  <Teleport to="body">
    <Transition name="booking-popover">
      <div
        v-if="modelValue"
        :class="[styles.popover, themeClass]"
        :style="{
          left: `${position.x + offsetX}px`,
          top: `${position.y + offsetY}px`,
        }"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useCssModule, watch } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    offsetX?: number;
    offsetY?: number;
    theme?: "light" | "dark";
  }>(),
  {
    offsetX: 12,
    offsetY: 12,
    theme: "light",
  }
);

const styles = useCssModule();
const themeClass = computed(() =>
  props.theme === "dark" ? styles.themeDark : styles.themeLight
);

const position = ref({ x: 0, y: 0 });

const handleMouseMove = (event: MouseEvent) => {
  position.value = { x: event.clientX, y: event.clientY };
};

const attachMouseMove = () => {
  window.addEventListener("mousemove", handleMouseMove);
};

const detachMouseMove = () => {
  window.removeEventListener("mousemove", handleMouseMove);
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      attachMouseMove();
    } else {
      detachMouseMove();
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  detachMouseMove();
});
</script>

<style module>
.themeDark {
  --surface-1: #101827;
  --shadow-2: 0 18px 40px rgba(2, 6, 23, 0.45);
  --text-primary: #e5e7eb;
  --text-secondary: #a3b0c2;
  --accent: #2563eb;
  --accent-soft: rgba(37, 99, 235, 0.15);
}

.themeLight {
  --surface-1: #ffffff;
  --shadow-2: 0 18px 40px rgba(15, 23, 42, 0.16);
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --accent: #2563eb;
  --accent-soft: rgba(37, 99, 235, 0.12);
}

.popover {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  transform-origin: top left;
}

.popover :global(.booking-popover-card) {
  background: var(--surface-1);
  border-radius: 10px;
  box-shadow: var(--shadow-2);
  padding: 12px 14px;
  min-width: 260px;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.4;
}

.popover :global(.booking-popover-card__status) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--accent-soft);
  color: #000000;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.popover :global(.booking-popover-card__row) {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}

.popover :global(.booking-popover-card__label) {
  color: var(--text-secondary);
  min-width: 110px;
}

.popover :global(.booking-popover-card__value) {
  color: var(--text-primary);
  font-weight: 600;
}

:global(.booking-popover-enter-active),
:global(.booking-popover-leave-active) {
  transition: opacity 120ms ease, transform 120ms ease;
}

:global(.booking-popover-enter-from),
:global(.booking-popover-leave-to) {
  opacity: 0;
  transform: scale(0.98);
}
</style>
