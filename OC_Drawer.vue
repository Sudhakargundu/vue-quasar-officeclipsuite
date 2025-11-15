<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useSessionStore } from '../stores/SessionStore';
import { useRouter } from 'vue-router';
import packageJson from '../../package.json';
import { useProfileListsStore } from '../stores/profileListsStore';
import { Constants } from '../stores/Constants';
import util from 'src/helpers/util';
import SettingsComponent from './settingsPage.vue';
import { defineExpose } from 'vue';
import uploadphoto from 'src/components/general/UploadPhoto.vue';
import { useImageDetailStore } from 'src/stores/ImageDetail';
import { useQuasar } from 'quasar';

const sessionStore = useSessionStore();
const leftDrawerOpen = ref(false);
const router = useRouter();
const profileListsStore = useProfileListsStore();
const userPhoto = ref();

const $q = useQuasar();
const dark = ref($q.dark.isActive);
const userPreferredDarkMode = ref<boolean | null>(null); // null means no explicit user preference

onMounted(() => {
  const storedUserPreference = localStorage.getItem('userPreferredDarkMode');
  if (storedUserPreference !== null) {
    userPreferredDarkMode.value = JSON.parse(storedUserPreference);
    dark.value = userPreferredDarkMode.value;
    $q.dark.set(userPreferredDarkMode.value);
  } else {
    // No explicit user preference, follow device settings
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    dark.value = prefersDark;
    $q.dark.set(prefersDark);
  }

  // Listen for changes in device dark mode settings
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    if (userPreferredDarkMode.value === null) { // Only update if no explicit user preference
      dark.value = event.matches;
      $q.dark.set(event.matches);
    }
  });
});

const toggleDarkMode = (value: boolean) => {
  userPreferredDarkMode.value = value; // User has now explicitly set a preference
  $q.dark.set(value);
  localStorage.setItem('userPreferredDarkMode', JSON.stringify(value));
};

const drawerClass = computed(() =>
  $q.dark && $q.dark.isActive
    ? 'bg-grey-9 text-white q-pa-md'
    : 'bg-primary text-white q-pa-md',
);

const cardStyle = computed(() => {
  return {
    width: $q.screen.lt.sm ? '90vw' : '350px',
    maxWidth: '90vw',
  };
});

//save the updated image detail
const imageDetailStore = useImageDetailStore();

const session = computed(() => {
  return sessionStore.Session;
});

console.log('Session info: ', session.value);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

defineExpose({ toggleLeftDrawer });

const filteredHomeIcons = computed(() => {
  const homeIcons = sessionStore.getHomeIcons();
  const newIcons = [
    {
      id: 14,
      icon: 'home',
      name: 'Home Page',
      url: '/homePage',
      color: '',
    },
  ];
  const newHomeIcons = [newIcons[0], ...homeIcons];
  return newHomeIcons;
});

function goToApp(url: string) {
  if (url !== '') {
    router.push({ path: url });
  }
}

function logout() {
  router.push({ path: '/' });
  sessionStore.logout();
}

const loadProfileLists = async () => {
  if (util.isObjectNullOrEmpty(profileListsStore.ProfileLists)) {
    await profileListsStore.getProfileLists();
  }
  userPhoto.value = profileListsStore.ProfilesUserGeneral?.userPhoto;
};

onMounted(async () => {
  await loadProfileLists();
});

const settingsDialog = ref(false);
const position = ref<'top' | 'left' | 'right' | 'standard' | 'bottom'>('top');
const showViewPhoto = ref(false);
const showEditPhotoDialog = ref(false);

const openSettings = (pos: any) => {
  position.value = pos;
  settingsDialog.value = true;
};

// Handler for photo-updated event from uploadphoto component
function onPhotoUpdated(newPhoto: string) {
  showEditPhotoDialog.value = false;
  userPhoto.value = newPhoto;
  // Save the updated image detail
  imageDetailStore.constructImageObjectAndSave(
    session.value.userId,
    'Users',
    newPhoto,
  );
}

// Method to handle edit photo click
function handleEditPhotoClick() {
  setTimeout(() => {
    showEditPhotoDialog.value = true;
  }, 200);
}
</script>

<template>
  <q-drawer
    v-model="leftDrawerOpen"
    bordered
    show-if-above
    :breakpoint="1023"
    class="column"
  >
    <!-- Header Section with User Info -->
    <div :class="drawerClass">
      <q-item class="q-pa-none">
        <q-item-section side>
          <q-avatar
            size="56px"
            class="cursor-pointer bg-white text-primary shadow-2"
            @click="showViewPhoto = true"
          >
            <q-img v-if="userPhoto" :src="userPhoto" />
            <q-icon v-else name="person" size="32px" />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-subtitle1 text-weight-medium">
            {{ session?.userName }}
          </q-item-label>
          <q-item-label class="text-caption">
            {{ session?.userEmail }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <div class="row justify-end">
        <q-btn
          icon="settings"
          flat
          round
          dense
          color="white"
          @click="openSettings('left')"
        >
        </q-btn>
        <q-toggle
          color="orange"
          v-model="dark"
          :icon="dark ? 'light_mode' : 'dark_mode'"
          @update:model-value="toggleDarkMode"
        />
      </div>
    </div>

    <!-- Navigation Section - Scrollable -->
    <q-scroll-area class="col">
      <q-list class="q-py-sm">
        <q-item
          v-for="item in filteredHomeIcons"
          :key="item.name"
          clickable
          v-ripple
          :class="[
            'q-mx-sm q-my-xs rounded-borders',
            item.url === '' ? 'opacity-60' : '',
          ]"
          @click="goToApp(item.url)"
        >
          <q-item-section avatar>
            <q-avatar
              :color="item.color || (item.url !== '' ? 'primary' : 'grey-4')"
              text-color="white"
            >
              <q-icon :name="item.icon" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">
              {{ item.name }}
            </q-item-label>
          </q-item-section>
          <q-item-section side v-if="item.url !== ''">
            <q-icon name="chevron_right" size="sm" color="grey-6" />
          </q-item-section>
          <q-item-section side v-else>
            <q-chip size="sm" color="orange" text-color="white" label="Soon" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>

    <!-- Footer Section -->
    <q-separator />
    <div class="q-px-md q-mb-md">
      <!-- Version Information -->
      <q-item dense class="q-pa-sm rounded-borders q-mb-sm">
        <q-item-section>
          <div class="row justify-between items-center text-caption q-mb-xs">
            <span class="text-weight-medium">App Version:</span>
            <span class="text-weight-bold">{{ packageJson.version }}</span>
          </div>
          <div class="row justify-between items-center text-caption">
            <span class="text-weight-medium">OC Version:</span>
            <span class="text-weight-bold">{{
              Constants.getRestApiVersionFromSession()
            }}</span>
          </div>
        </q-item-section>
      </q-item>

      <!-- Logout Button -->
      <q-btn
        icon="logout"
        label="Log out"
        class="full-width"
        unelevated
        rounded
        color="negative"
        text-color="white"
        @click="logout"
      />
    </div>

    <!-- Photo View Dialog -->
    <q-dialog v-model="showViewPhoto">
      <q-card class="column no-wrap" :style="cardStyle">
        <q-card-section>
          <q-img v-if="userPhoto" :src="userPhoto" />
          <div
            v-else
            class="flex flex-center bg-grey-3"
            style="min-height: 200px"
          >
            <q-icon name="person" size="120px" color="grey-6" />
          </div>
        </q-card-section>

        <div class="text-center">
          <div class="text-h6 text-weight-medium q-mb-xs">
            {{ session?.userName }}
          </div>
          <div class="text-caption">{{ session?.userEmail }}</div>
        </div>

        <!-- <q-space /> -->

        <q-card-actions align="center">
          <q-btn
            flat
            color="primary"
            label="Edit Photo"
            @click="handleEditPhotoClick"
          />
          <q-btn flat color="grey" label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit Photo Dialog -->
    <q-dialog v-model="showEditPhotoDialog">
      <uploadphoto @photo-updated="onPhotoUpdated" />
    </q-dialog>

    <!-- Settings Dialog -->
    <q-dialog v-model="settingsDialog" :position="position">
      <SettingsComponent />
    </q-dialog>
  </q-drawer>
</template>
