<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import logOutButton from '../general/logOutButton.vue';

const $q = useQuasar();
const headerClass = computed(() =>
  $q.dark && $q.dark.isActive ? 'bg-grey-9' : 'bg-primary',
);

const props = defineProps({
  /**
   * The title to be displayed in the header.
   */
  title: {
    type: String,
    required: true,
  },
  /**
   * --- Left-side button visibility ---
   */
  /**
   * Show the back button. Defaults to true.
   */
  showBackButton: {
    type: Boolean,
    default: true,
  },
  /**
   * Optional route for the back button. Defaults to router.go(-1).
   */
  backButtonTo: {
    type: [String, Object],
    default: null,
  },
  /**
   * Show the hamburger menu button. Defaults to false.
   */
  showMenuButton: {
    type: Boolean,
    default: false,
  },
  /**
   * --- Right-side button visibility ---
   */
  showEditButton: {
    type: Boolean,
    default: false,
  },
  disableEdit: {
    type: Boolean,
    default: false,
  },
  editTooltip: {
    type: String,
    default: '',
  },
  showDeleteButton: {
    type: Boolean,
    default: false,
  },
  disableDelete: {
    type: Boolean,
    default: false,
  },
  deleteTooltip: {
    type: String,
    default: '',
  },
  showSaveButton: {
    type: Boolean,
    default: false,
  },
  /**
   * --- Props for button actions ---
   */
  /**
   * If provided, the edit button becomes a router-link to this location.
   * If not provided, it emits an 'edit' event on click.
   */
  editButtonTo: {
    type: [String, Object],
    default: null,
  },
  /**
   * Text for the save/submit button.
   */
  saveButtonText: {
    type: String,
    default: 'Save',
  },
  /**
   * Disables the save button.
   */
  disableSave: {
    type: Boolean,
    default: false,
  },
  showLogOutButton: {
    type: Boolean,
    default: false,
  },
  logOutButtonTo: {
    type: [String, Object],
    default: '/',
  },
  showRefreshButton: {
    type: Boolean,
    default: false,
  },
  refreshButtonTo: {
    type: [String, Object],
    default: null,
  },
});

const emit = defineEmits([
  'toggle-drawer',
  'edit',
  'delete',
  'save',
  'refresh',
]);
const router = useRouter();

const goBack = () => {
  if (props.backButtonTo) {
    router.push(props.backButtonTo);
  } else {
    router.go(-1);
  }
};
</script>

<template>
  <q-header reveal bordered :class="headerClass" height-hint="98">
    <q-toolbar>
      <!-- Left Side -->
      <q-btn
        v-if="showBackButton"
        flat
        round
        dense
        icon="west"
        @click="goBack"
      />
      <q-btn
        v-if="showMenuButton"
        aria-label="Menu"
        dense
        flat
        icon="menu"
        round
        @click="emit('toggle-drawer')"
      />

      <!-- Middle -->
      <q-toolbar-title style="min-width: 0; flex: 1 1 auto">
        {{ title }}
      </q-toolbar-title>

      <!-- Right Side (Optional Buttons) -->
      <q-space />

      <slot name="right-actions">
        <q-btn
          v-if="showEditButton"
          flat
          round
          dense
          icon="edit"
          :to="editButtonTo"
          @click="!editButtonTo ? emit('edit') : null"
          :disable="disableEdit"
        >
          <q-tooltip v-if="disableEdit && editTooltip" class="bg-accent">{{
            editTooltip
          }}</q-tooltip>
        </q-btn>

        <q-btn
          v-if="showDeleteButton"
          flat
          round
          dense
          icon="delete"
          @click="emit('delete')"
          :disable="disableDelete"
        >
          <q-tooltip v-if="disableDelete && deleteTooltip" class="bg-accent">{{
            deleteTooltip
          }}</q-tooltip>
        </q-btn>

        <q-btn
          v-if="showSaveButton"
          class="q-px-md"
          dense
          :label="saveButtonText"
          no-caps
          outline
          rounded
          type="submit"
          :disable="disableSave"
          @click="emit('save')"
        />

        <q-btn
          v-if="showRefreshButton"
          flat
          round
          dense
          icon="refresh"
          :to="refreshButtonTo"
          @click="!refreshButtonTo ? emit('refresh') : null"
        />
        <logOutButton v-if="showLogOutButton" />
      </slot>
    </q-toolbar>
  </q-header>
</template>
