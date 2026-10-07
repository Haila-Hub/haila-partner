<script setup lang="ts">
import { computed } from 'vue'
import Message from 'primevue/message'

const props = defineProps<{ value: unknown }>()

const text = computed(() =>
  props.value === null || props.value === undefined ? '' : JSON.stringify(props.value, null, 2),
)
</script>

<template>
  <pre v-if="text" class="json-block">{{ text }}</pre>
  <Message v-else severity="secondary" :closable="false">Sem resultado ainda.</Message>
</template>
