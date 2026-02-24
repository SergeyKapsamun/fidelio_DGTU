<script setup lang="ts">
import BookingCalendarView from "./components/BookingCalendarView.vue";
</script>

<template>
  <main :class="$style.app">
    <BookingCalendarView />
  </main>
</template>

<style module>
.app {
  display: grid;
  gap: 28px;
  min-height: 100vh;
}
</style>
