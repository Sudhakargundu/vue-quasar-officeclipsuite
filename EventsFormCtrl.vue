<script lang="ts" setup>
import { computed, onMounted, ref, Ref, watch } from 'vue';
import EventsRecurrenceDialog from 'components/Events/EventsRecurrenceDialog.vue';
import EventsReminderDialog from 'components/Events/EventsReminderDialog.vue';
// import { useEventDetailsStore } from '../../stores/event/eventDetailsStore';
import { useEventListsStore } from '../../stores/event/eventListsStore';
import { useReminderDataStore } from '../../stores/reminder/reminderData';
import dateTimeHelper from '../../helpers/dateTimeHelper';
import { userSummary } from 'src/models/userSummary';
import { useUserSummaryStore } from '../../stores/userSummaryStore';
import Regarding from '../general/regardingComponent.vue';
import { useSessionStore } from 'src/stores/SessionStore';
import { useQuasar, QInput } from 'quasar';
import { useRouter } from 'vue-router';
import { getEventShowTimeAsColor } from 'src/helpers/colorIconHelper';
// import OCItem from '../../components/OCcomponents/OC-Item.vue';

const $q = useQuasar();
const router = useRouter();
// const eventDetailsStore = useEventDetailsStore();
const eventListsStore = useEventListsStore();
const reminderDataStore = useReminderDataStore();
const userSummaryStore = useUserSummaryStore();
const sessionStore = useSessionStore();

const session = sessionStore.Session;

const props = defineProps(['eventFromParent', 'appNameFromParent']);

// Define eventTypes
const eventTypes = ref([
  { id: '1', label: 'Group', color: 'blue' },
  { id: '2', label: 'Meeting', color: 'green' },
  { id: '3', label: 'Personal', color: 'orange' },
]);
const emit = defineEmits([
  'rrule-generated',
  'reminder-generated',
  'rrule-text-generated',
]);

const event = ref(props.eventFromParent);
const appName = props.appNameFromParent;

const startDateModelValue = ref();
startDateModelValue.value = dateTimeHelper.formatDateTimeFromRestAPIForUI(
  event.value.startDateTime,
  event.value.isAllDayEvent,
);

const endDateModelValue = ref();
endDateModelValue.value = dateTimeHelper.formatDateTimeFromRestAPIForUI(
  event.value.endDateTime,
  event.value.isAllDayEvent,
);

watch(
  [startDateModelValue, endDateModelValue],
  ([newStartDateModelValue, newEndtDateModelValue]) => {
    event.value.startDateTime = dateTimeHelper.formatDateTimeFromUIForRestAPI(
      newStartDateModelValue,
      event.value.isAllDayEvent,
    );
    event.value.endDateTime = dateTimeHelper.formatDateTimeFromUIForRestAPI(
      newEndtDateModelValue,
      event.value.isAllDayEvent,
    );
  },
);

const dateTimeMask = 'ddd, MMM DD, YYYY hh:mm A';
const dateMask = 'ddd, MMM DD, YYYY';
const mask = (x: boolean) => {
  return x ? dateMask : dateTimeMask;
};
onMounted(async () => {
  try {
    await userSummaryStore.getUserSummaries();
    await eventListsStore.getEventLists();
    await reminderDataStore.getReminderObject();
  } catch (error) {
    $q.dialog({
      title: 'Alert',
      message: error as string,
    }).onOk(async () => {
      await router.push({ path: '/eventSummary' });
    });
  }
});

// const meetingAttendee = computed(() => {
//   return eventDetailsStore.MeetingAttendees;
// });
const label = computed(() => {
  return eventListsStore.Labels;
});

const ShowMyTimeAsOptions = computed(() => {
  return eventListsStore.ShowMyTimeAs;
});

const selectedTime = computed(() => {
  const reminderTimes = reminderDataStore.ReminderTimes;
  const obj = reminderTimes.find(
    (time: any) => time.value === event.value.reminder.beforeMinutes,
  );
  return obj ? obj : 'null';
});
const reminderTextInfo = event.value?.reminder.to
  ? ref(
      computed(() => {
        return `${event.value.reminder.to} ${selectedTime.value.label} before`;
      }),
    )
  : ref('Reminder');

const reminderDialogOpened = ref(false);
const recurrenceDialogOpened = ref(false);
const repeatString =
  !event.value?.recurrence.text.startsWith('None') &&
  event.value?.recurrence.text !== ''
    ? ref(event.value?.recurrence.text)
    : ref('Does not repeat');

function handleRRuleString(rruleString: string) {
  // You can now use the rruleString in your parent component
  emit('rrule-generated', rruleString);
}

function handleRRuleText(rruleText: string) {
  const repeatText = rruleText.charAt(0).toUpperCase() + rruleText.slice(1); //capitalize first letter
  repeatString.value = repeatText;
  emit('rrule-text-generated', repeatText);
}

function handleReminderData(reminderString: []) {
  // You can now use the rruleString in your parent component
  emit('reminder-generated', reminderString);
}

function handleReminderText(reminderText: string) {
  reminderTextInfo.value = reminderText;
}

const labelOptions = label;
const filterOptions: Ref<userSummary[]> = ref([]);

function filterFn(val: string, update: any) {
  update(() => {
    const needle = val.toLowerCase();
    filterOptions.value = userSummaryStore.userSummaries.filter(
      (v) => v.name.toLowerCase().indexOf(needle) > -1,
    );
  });
}

function createValue(val: string, done: any) {
  if (val) {
    done({ id: '', name: val }, 'toggle');
  }
  return;
}

if (event.value?.id == '' && event.value?.eventType?.id == '2') {
  event.value.meetingAttendees = [
    {
      id: session.userId,
      name: session.userName,
      email: session.userEmail,
    },
  ];
}

const testUrl = () => {
  const url = event.value.url;
  if (!url) {
    alert('URL cannot be empty');
  } else if (isValidURL(url)) {
    window.open('http://' + url, '_blank');
  } else {
    alert('Invalid URL');
  }
};

function isValidURL(url: string) {
  const pattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
  return pattern.test(url);
}

function changeEndDateWhenStartDateChanged(val: string | number | null) {
  if (val == null) return;
  if (!event.value.isAllDayEvent) {
    const date = new Date(val);
    const endDateTime = dateTimeHelper.addHoursToDate(date, 1);
    endDateModelValue.value = dateTimeHelper.formatDateTimeForUI(
      endDateTime,
      false,
    );
  }
}
const showTimeAsBackColor = getEventShowTimeAsColor();

function toggleAllDay(evt: boolean) {
  startDateModelValue.value = dateTimeHelper.formatDateTimeFromRestAPIForUI(
    event.value.startDateTime,
    evt,
  );
  endDateModelValue.value = dateTimeHelper.formatDateTimeFromRestAPIForUI(
    event.value.endDateTime,
    evt,
  );
}

const eventNameRef = ref<QInput>(); // from: https://stackoverflow.com/a/65106524
const startDateRef = ref<QInput>();
const endDateRef = ref<QInput>();

const ruleNotEmpty = (val: string) => {
  const condition = val && val.length > 0;
  return condition ? true : 'This field is required';
};

const ruleEndDateGreaterThanStartDate = (val: string) => {
  if (!startDateModelValue.value || startDateModelValue.value.length === 0)
    return true;
  const isValid = event.value.isAllDayEvent
    ? new Date(val) >= new Date(startDateModelValue.value)
    : new Date(val) > new Date(startDateModelValue.value);
  return isValid ? true : 'End Date should be more than start date';
};

const validateAll = () => {
  eventNameRef.value?.validate();
  startDateRef.value?.validate();
  endDateRef.value?.validate();

  if (
    eventNameRef.value?.hasError ||
    startDateRef.value?.hasError ||
    endDateRef.value?.hasError
  ) {
    return false;
  } else {
    return true;
  }
};

defineExpose({
  validateAll,
});

const canBeRemoved = computed(
  () => (item: { id: string }) => item.id !== session.userId,
);

function handleRemove(item: { id: string }) {
  if (canBeRemoved.value(item)) {
    const index = event.value?.meetingAttendees.findIndex(
      (option: { id: string }) => option.id === item.id,
    );
    if (index !== -1) {
      event.value?.meetingAttendees.splice(index, 1);
    }
  }
}

// const regarding = computed(() => {
//   return `${event.value?.parent.type.name} : ${event.value?.parent.value.name}`;
// });

const remindTo = computed(() => {
  return event.value?.reminder.to;
});

const reminderValue = computed(() => {
  return event.value?.reminder.beforeMinutes;
});
</script>

<template>
  <div class="q-mb-sm">
    <q-list>
      <q-item>
        <q-item-section v-for="type in eventTypes" :key="type.id">
          <q-radio
            v-model="event.eventType.id"
            :color="type.color"
            keep-color
            :label="type.label"
            :val="type.id"
            size="sm"
          />
        </q-item-section>
      </q-item>

      <q-item v-if="event.eventType.id == '1'" class="column">
        <q-checkbox
          v-model="event.sendNotifications"
          label="Send notifications to the group?"
          color="teal"
          size="xs"
        />
        <q-checkbox
          v-model="event.isRsvp"
          label="Ask for RSVP's"
          color="orange"
          size="xs"
        />
      </q-item>
      <q-item class="column">
        <q-input
          ref="eventNameRef"
          v-model="event.eventName"
          :rules="[ruleNotEmpty]"
          hide-bottom-space
          label="Event Name*"
          placeholder="enter event name"
        />
      </q-item>
      <q-item>
        <q-toggle
          v-model="event.isAllDayEvent"
          :false-value="false"
          :true-value="true"
          color="primary"
          dense
          keep-color
          label="All Day Event"
          left-label
          @update:model-value="toggleAllDay"
        />
      </q-item>

      <q-item class="column">
        <q-input
          v-model="startDateModelValue"
          label="Starts*"
          @update:model-value="changeEndDateWhenStartDateChanged"
          :rules="[ruleNotEmpty]"
          hide-bottom-space
          ref="startDateRef"
        >
          <template v-slot:prepend>
            <q-icon class="cursor-pointer" name="event">
              <q-popup-proxy
                cover
                transition-hide="scale"
                transition-show="scale"
              >
                <q-date
                  v-model="startDateModelValue"
                  :mask="mask(event.isAllDayEvent)"
                  @update:model-value="changeEndDateWhenStartDateChanged"
                >
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup color="primary" flat label="Close" />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>

          <template v-if="!event.isAllDayEvent" v-slot:append>
            <q-icon class="cursor-pointer" name="access_time">
              <q-popup-proxy
                cover
                transition-hide="scale"
                transition-show="scale"
              >
                <q-time
                  v-model="startDateModelValue"
                  :mask="mask(event.isAllDayEvent)"
                  @update:model-value="changeEndDateWhenStartDateChanged"
                >
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup color="primary" flat label="Close" />
                  </div>
                </q-time>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </q-item>

      <q-item class="column">
        <q-input
          v-model="endDateModelValue"
          label="Ends*"
          :rules="[ruleNotEmpty, ruleEndDateGreaterThanStartDate]"
          hide-bottom-space
          ref="endDateRef"
        >
          <template v-slot:prepend>
            <q-icon class="cursor-pointer" name="event">
              <q-popup-proxy
                cover
                transition-hide="scale"
                transition-show="scale"
              >
                <q-date
                  v-model="endDateModelValue"
                  :mask="mask(event.isAllDayEvent)"
                >
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup color="primary" flat label="Close" />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>

          <template v-if="!event.isAllDayEvent" v-slot:append>
            <q-icon class="cursor-pointer" name="access_time">
              <q-popup-proxy
                cover
                transition-hide="scale"
                transition-show="scale"
              >
                <q-time
                  v-model="endDateModelValue"
                  :mask="mask(event.isAllDayEvent)"
                >
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup color="primary" flat label="Close" />
                  </div>
                </q-time>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </q-item>
      <q-item class="column">
        <q-input
          v-model="event.eventDescription"
          autogrow
          label="Notes"
          placeholder="enter event description"
        />
      </q-item>
      <q-item class="column">
        <q-input
          v-model="event.eventLocation"
          label="Location"
          placeholder="enter where the event will take place"
        >
        </q-input>
      </q-item>

      <q-item
        v-ripple
        :clickable="!event.id"
        @click="!event.id && (recurrenceDialogOpened = true)"
        :class="{ 'cursor-not-allowed': event.id }"
      >
        <q-item-section avatar>
          <q-icon color="primary" name="repeat" size="sm" />
        </q-item-section>
        <q-item-section>{{ repeatString }}</q-item-section>
        <q-item-section side>
          <q-icon
            color="primary"
            name="chevron_right"
            :class="{ 'opacity-50': event.id }"
          />
        </q-item-section>
      </q-item>
      <q-item v-if="event.eventType.id == '2'" class="column">
        <q-select
          v-model="event.meetingAttendees"
          :options="filterOptions"
          input-debounce="0"
          label="Attendees"
          multiple
          option-label="name"
          option-value="id"
          style="min-width: 250px"
          use-input
          @filter="filterFn"
          @new-value="createValue"
        >
          <template v-slot:selected-item="scope">
            <q-chip
              removable
              dense
              @remove="handleRemove(scope.opt)"
              :tabindex="scope.tabindex"
              text-color="secondary"
              class="q-ma-none"
            >
              {{ scope.opt.name }}
            </q-chip>
          </template>
        </q-select>
      </q-item>

      <q-item v-ripple clickable @click="reminderDialogOpened = true">
        <q-item-section avatar>
          <q-icon color="primary" name="alarm" size="sm" />
        </q-item-section>
        <q-item-section>{{ reminderTextInfo }}</q-item-section>
        <q-item-section side>
          <q-icon color="primary" name="chevron_right" />
        </q-item-section>
      </q-item>
      <q-item class="column">
        <q-input v-model="event.url" dense label="Url" map-options>
          <template v-slot:append>
            <q-btn
              color="primary"
              dense
              flat
              label="Test URL"
              no-caps
              @click="testUrl"
            />
          </template>
        </q-input>
      </q-item>
      <q-item>
        <q-item-section>
          <q-select
            filled
            v-model="event.showTimeAs"
            :options="ShowMyTimeAsOptions"
            label="Show Time As"
            map-options
            option-label="name"
            option-value="id"
          >
            <template #option="scope">
              <q-item
                class="q-my-xs"
                :class="
                  $q.dark.isActive
                    ? 'bg-grey-9'
                    : (showTimeAsBackColor as string[])[scope.opt.id]
                "
                v-bind="scope.itemProps"
              >
                {{ scope.opt.name }}
              </q-item>
            </template>
            <template #selected-item="scope">
              <q-item
                dense
                class="q-selectedItem"
                :class="
                  $q.dark.isActive
                    ? 'bg-grey-9'
                    : (showTimeAsBackColor as string[])[scope.opt.id]
                "
              >
                {{ scope.opt.name }}
              </q-item>
            </template>
          </q-select>
        </q-item-section>
        <q-item-section>
          <q-select
            filled
            v-model="event.label"
            :options="labelOptions"
            label="Label"
            map-options
            option-label="name"
            option-value="id"
          >
            <template #option="scope">
              <q-item
                dense
                class="q-my-xs"
                v-bind="scope.itemProps"
                v-bind:style="
                  $q.dark.isActive
                    ? 'background-color: #1d1d1d'
                    : { backgroundColor: scope.opt.backColor }
                "
              >
                {{ scope.opt.name }}
              </q-item>
            </template>
            <template #selected-item="scope">
              <q-item
                dense
                class="q-selectedItem"
                v-bind:style="
                  $q.dark.isActive
                    ? 'background-color: #1d1d1d'
                    : { backgroundColor: scope.opt.backColor }
                "
              >
                {{ scope.opt.name }}
              </q-item>
            </template>
          </q-select>
        </q-item-section>
      </q-item>
      <q-item v-if="appName === 'event'">
        <q-item-section>
          <Regarding
            v-model="event.parent"
            :regarding-parents="eventListsStore.RegardingParent"
          />
        </q-item-section>
      </q-item>
      <!-- <OCItem
        v-if="appName !== 'event' && event?.parent?.value?.name"
        title="Regarding"
        :value="regarding"
      /> -->
    </q-list>

    <q-dialog v-model="recurrenceDialogOpened">
      <EventsRecurrenceDialog
        @rrule-string-generated="handleRRuleString"
        @rrule-text-generated="handleRRuleText"
      />
    </q-dialog>
    <q-dialog v-model="reminderDialogOpened">
      <EventsReminderDialog
        :remindTo="remindTo"
        :reminderValue="reminderValue"
        @reminder-text-generated="handleReminderText"
        @reminder-data-generated="handleReminderData"
      />
    </q-dialog>
  </div>
</template>

<style scoped>
.q-selectedItem {
  width: inherit;
  border-radius: 4px;
  align-items: center;
  justify-content: center;
}
</style>
