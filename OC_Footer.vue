<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const footerClass = computed(() =>
  $q.dark && $q.dark.isActive ? 'bg-grey-9' : 'bg-primary',
);

interface Tab {
  name: string;
  label: string;
  icon: string;
}

defineProps<{
  tabs: Tab[];
  tab: string;
}>();

defineEmits(['update:tab']);
</script>

<template>
  <q-footer>
    <q-tabs
      :model-value="tab"
      @update:model-value="$emit('update:tab', $event)"
      align="justify"
      dense
      :class="footerClass"
      indicator-color="warning"
    >
      <q-tab
        v-for="t in tabs"
        :key="t.name"
        :name="t.name"
        :label="t.label"
        :icon="t.icon"
      />
    </q-tabs>
  </q-footer>
</template>
