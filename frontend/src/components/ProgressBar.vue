<script setup>
const props = defineProps({ value: Number, max: Number })
const percent = () => Math.min(100, Math.round((props.value / props.max) * 100))
</script>

<template>
  <div class="bar"><div class="fill" :style="{ width: percent() + '%' }" /></div>
  <div class="muted">{{ value }} / {{ max }} ETH ({{ percent() }}%)</div>
</template>

<style scoped>
.bar { background: #eee8dc; border-radius: 999px; height: 10px; overflow: hidden; margin: .5rem 0 .25rem; }
.fill { background: var(--primary); height: 100%; }
</style>
