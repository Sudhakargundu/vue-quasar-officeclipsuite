<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue';
import { useEventDetailsStore } from '../../stores/event/eventDetailsStore';
import { useReminderDataStore } from '../../stores/reminder/reminderData';
import { useRoute, useRouter } from 'vue-router';
import dateTimeHelper from '../../helpers/dateTimeHelper';
// import OCItem from '../../components/OCcomponents/OC-Item.vue';
import ConfirmationDialog from '../../components/general/ConfirmDelete.vue';
import { isAllowed } from 'src/helpers/security';
import { useQuasar } from 'quasar';
// import { getEventShowTimeAsColor } from 'src/helpers/colorIconHelper';
// import drawer from '../../components/drawer.vue';
import OC_Drawer from 'src/components/OC_Drawer.vue';
import { useEventSummaryStore } from '../../stores/event/eventSummaryStore';
import OC_Header from 'src/components/OCcomponents/OC_Header.vue';
import OC_Loader from 'src/components/general/OC_Loader.vue';

const loading = ref(true);
const route = useRoute();
const router = useRouter();
const eventDetailsStore = useEventDetailsStore();
const reminderDataStore = useReminderDataStore();
const eventSummaryStore = useEventSummaryStore();
const $q = useQuasar();

const id = route.params.id;
const appName = route.params.appName;

const myDrawer = ref();

const loadEventDetails = async () => {
  loading.value = true;
  try {
    await eventDetailsStore.getEventDetailsById(id);
    await reminderDataStore.getReminderObject();
  } catch (error) {
    $q.dialog({
      title: 'Alert',
      message: error as string,
    }).onOk(async () => {
      await router.push({ path: '/eventSummary' });
      router.go(0);
    });
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadEventDetails();
});

const event = computed(() => {
  return eventDetailsStore?.eventDetails;
});
const selectedTime = computed(() => {
  const reminderTimes = reminderDataStore.ReminderTimes;
  const obj = reminderTimes.find(
    (time: any) => time.value === event.value?.reminder?.beforeMinutes,
  );
  return obj ? obj : 'null';
});

const eventProperties = computed(() => [
  { label: 'Event Name', value: event.value?.eventName },
  { label: 'Description', value: event.value?.eventDescription },
  { label: 'Location', value: event.value?.eventLocation },
  {
    label: event.value.isAllDayEvent ? 'StartDate' : 'StartDate Time',
    value: dateTimeHelper.formatDateTimeFromRestAPIForUI(
      event.value?.startDateTime,
      event.value?.isAllDayEvent,
    ),
  },
  {
    label: event.value.isAllDayEvent ? 'EndDate' : 'EndDate Time',
    value: dateTimeHelper.formatDateTimeFromRestAPIForUI(
      event.value?.endDateTime,
      event.value?.isAllDayEvent,
    ),
  },
  {
    label: 'is AllDay Event',
    value: event.value?.isAllDayEvent ? 'Yes' : 'No',
  },
  {
    label: 'MeetingAttendees',
    value: event.value?.meetingAttendees
      ? event.value.meetingAttendees
          .map((a: any) => a.name?.trim())
          .filter((name: string | undefined | null) => !!name)
          .join(', ')
      : null,
  },
  { label: 'EventType', value: event.value?.eventType?.name },
  { label: 'Regarding', value: projectServiceItem.value },
  { label: 'Url', value: event.value?.url },
  { label: 'Label', value: event.value?.label?.name },
  { label: 'ShowTimeAs', value: event.value?.showTimeAs?.name },
  { label: 'Recurrence', value: event.value?.recurrence?.text },
  {
    label: 'Reminder',
    value:
      event.value?.reminder?.to != ''
        ? `${event.value?.reminder?.to} ${selectedTime.value.label} Before`
        : '',
  },
  {
    label: 'Created On',
    value: `${dateTimeHelper.formatDateTimeFromRestAPIForUI(event.value?.createdDate, false)} by ${event.value?.createdUserName} `,
  },
  {
    label: 'Last Modified',
    value: `${dateTimeHelper.formatDateTimeFromRestAPIForUI(event.value?.modifiedDate, false)} by ${event.value?.modifiedUserName}`,
  },
]);

const filteredEventProperties = computed(() =>
  eventProperties.value.filter((prop) => prop.value),
);

// -----------------------------

const isAllowEdit = computed(() => {
  return isAllowed({
    security: { write: event.value?.security?.write },
  });
});

const isAllowDelete = computed(() => {
  return isAllowed({
    security: { delete: event.value?.security?.delete },
  });
});

const canEdit = computed(() => {
  return isAllowEdit.value && event.value?.eventType?.id !== '4';
});

const canDelete = computed(() => {
  return isAllowDelete.value && event.value?.eventType?.id !== '4';
});

const title = ref('Confirm');
const message = ref('Are you sure you want to delete this event?');
const showConfirmationDialog = ref(false);
const displayConfirmationDialog = () => {
  showConfirmationDialog.value = true;
};
const cancelConfirmation = () => {
  showConfirmationDialog.value = false;
};
const confirmDeletion = async () => {
  try {
    await eventDetailsStore.deleteEventDetails(event.value?.id);
    await eventSummaryStore.resetEventSummaryList();
    showConfirmationDialog.value = false;
    router.go(-1);
  } catch (error) {
    $q.dialog({
      title: 'Alert',
      message: error as string,
    }).onOk(async () => {
      showConfirmationDialog.value = false;
    });
  }
};
const projectServiceItem = computed(() => {
  if (!event.value?.parent?.value?.id) return '';
  return `${event.value?.parent.type?.name} : ${event.value?.parent.value?.name}`;
});

function toggleLeftDrawer() {
  if (myDrawer.value == null) return;
  myDrawer.value.toggleLeftDrawer();
}

function editEvent() {
  router.push({ name: 'editEvent', params: { id: id, appName: appName } });
}
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <OC_Header
      :title="event?.eventType?.name || 'Event Details'"
      :show-menu-button="true"
      @toggle-drawer="toggleLeftDrawer"
      :show-edit-button="canEdit"
      @edit="editEvent"
      :show-delete-button="canDelete"
      @delete="displayConfirmationDialog"
    >
    </OC_Header>
    <OC_Drawer ref="myDrawer" />
    <q-page-container>
      <q-page>
        <OC_Loader :visible="loading" />
        <div v-if="!loading && event" class="q-gutter-y-md">
          <q-card flat>
            <q-card-section>
              <div class="row q-col-gutter-md">
                <div
                  class="col-12 col-md-6"
                  v-for="(property, index) in filteredEventProperties"
                  :key="index"
                >
                  <q-item-label class="q-my-sm" style="color: inherit"
                    >{{ property.label }}:</q-item-label
                  >
                  <q-item-label class="text-body1">{{
                    property.value
                  }}</q-item-label>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>

  <ConfirmationDialog
    v-if="showConfirmationDialog"
    :showConfirmationDialog="showConfirmationDialog"
    :title="title"
    :message="message"
    @cancel="cancelConfirmation"
    @confirm="confirmDeletion"
  />
</template>
