<script lang="ts" setup>
import { defineProps, ref, Ref, computed, onMounted, watch } from 'vue';
import { useTaskListsStore } from '../../stores/task/taskListsStore';
import { taskDetails } from 'src/models/task/taskDetails';
import EventsRecurrenceDialog from 'components/Events/EventsRecurrenceDialog.vue';
import { userSummary } from 'src/models/userSummary';
import { useUserSummaryStore } from '../../stores/userSummaryStore';
import { tag } from 'src/models/task/taskLists';
import Regarding from 'components/general/regardingComponent.vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import dateTimeHelper from 'src/helpers/dateTimeHelper';
import OCItem from '../../components/OCcomponents/OC-Item.vue';
import oc_editor from 'src/components/OCcomponents/oc_editor.vue';

const props = defineProps({
  taskFromParent: {
    type: Object,
  },
  appName: {
    type: String,
  },
});

const task: Ref<taskDetails> = ref(props.taskFromParent);

const userSummaryStore = useUserSummaryStore();
const taskListsStore = useTaskListsStore();
const $q = useQuasar();
const router = useRouter();

const selectedTaskStatusId = ref(task.value.taskStatusId);
const selectedTaskTypeId = ref(task.value.taskTypeId);

const nameRef = ref();
const dateRef = ref();

const repeatString =
  // !task.value?.recurrence.text.startsWith('None') &&
  // task.value?.recurrence.text !== ''
  task.value?.recurrence !== null && task.value?.recurrence.text !== ''
    ? ref(task.value?.recurrence.text)
    : ref('Does not repeat');
const recurrenceDialogOpened = ref(false);

const dateMask = 'YYYY-MM-DD';

const startDateModel = computed(() => {
  return dateTimeHelper.formatDateTimeFromRestAPIForUI(
    task.value?.startDate,
    true,
  );
});

const dueDateModel = computed(() => {
  return dateTimeHelper.formatDateTimeFromRestAPIForUI(
    task.value?.dueDate,
    true,
  );
});

const usersList: Ref<userSummary[]> = ref([]);
const tagOptions: Ref<tag[]> = ref([]);
const filterUsersList: Ref<userSummary[]> = ref([]);

onMounted(async () => {
  try {
    await taskListsStore.getTaskLists();
    await userSummaryStore.getUserSummaries();
    usersList.value = filterUsersList.value = userSummaryStore.UserSummaries;
    tagOptions.value = taskListsStore.Tags;
    if (!selectedTaskStatusId.value) {
      selectedTaskStatusId.value = taskListsStore.TaskStatuses[0]?.id;
    }
    if (!selectedTaskTypeId.value) {
      selectedTaskTypeId.value = taskListsStore.TaskTypes[0]?.id;
    }
  } catch (error) {
    $q.dialog({
      title: 'Alert',
      message: error as string,
    }).onOk(async () => {
      await router.push({ path: '/tasksList' });
    });
  }
});

// Watch for changes in selectedTaskStatusId
watch(selectedTaskStatusId, (newStatusId) => {
  task.value.taskStatusId = newStatusId;
});

// Watch for changes in selectedTaskTypeId
watch(selectedTaskTypeId, (newTypeId) => {
  task.value.taskTypeId = newTypeId;
});

function handleRRuleString(rruleString: string) {
  task.value.recurrence.rule = rruleString;
}

function handleRRuleText(rruleText: string) {
  const repeatText = rruleText.charAt(0).toUpperCase() + rruleText.slice(1); //capitalize first letter
  repeatString.value = repeatText;
  task.value.recurrence.text = repeatText;
}

async function filterUsersFn(val: string, update: any) {
  if (val === '') {
    update(() => {
      filterUsersList.value = usersList.value;
    });
  }
  update(() => {
    const needle = val.toLowerCase();
    filterUsersList.value = usersList.value.filter(
      (v) => v.name.toLowerCase().indexOf(needle) > -1,
    );
  });
}

const filterTagOptions: Ref<tag[]> = ref([]);
async function filterTagFn(val: string, update: any) {
  if (val === '') {
    update(() => {
      filterTagOptions.value = tagOptions.value;
    });
  }
  update(() => {
    const needle = val.toLowerCase();
    filterTagOptions.value = tagOptions.value.filter(
      (v) => v.name.toLowerCase().indexOf(needle) > -1,
    );
  });
}

const ruleDueDateGreaterThanStartDate = (val: string) => {
  if (!task.value.startDate || task.value.startDate.length === 0) return true;
  const start = new Date(task.value.startDate);
  const due = new Date(val);
  // Compare only the date part (ignore time)
  start.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const isValid = due.getTime() >= start.getTime();
  return isValid ? true : 'Due Date should not be less than Start Date';
};

const validateAll = () => {
  nameRef.value.validate();
  dateRef.value.validate();
  return !(nameRef.value.hasError || dateRef.value.hasError);
};

const ruleNotEmpty = (val: string) => {
  const condition = val && val.length > 0;
  return condition ? true : 'Please fill in this field';
};

defineExpose({
  validateAll,
});

const regarding = computed(() => {
  return `${props.taskFromParent?.parent.type.name} : ${props.taskFromParent?.parent.value.name}`;
});

function createValue(val: string, done: any) {
  if (val) {
    done({ id: '', name: val }, 'toggle');
  }
  return;
}
</script>

<template>
  <div class="q-mb-lg">
    <q-list>
      <q-item class="column">
        <q-input
          ref="nameRef"
          v-model="task.subject"
          error-message="Please type subject"
          label="Subject"
          placeholder="enter task subject"
          :rules="[ruleNotEmpty]"
          hide-bottom-space
      /></q-item>
      <q-item class="column">
        <q-field v-model="task.description" label-slot borderless>
          <template #label>Description</template>
          <template #control>
            <oc_editor v-model="task.description" />
          </template> </q-field
      ></q-item>
      <q-item class="column">
        <q-input v-model="startDateModel" label="Start Date" readonly>
          <template v-slot:prepend>
            <q-icon class="cursor-pointer" name="event">
              <q-popup-proxy
                cover
                transition-hide="scale"
                transition-show="scale"
              >
                <q-date v-model="task.startDate" :mask="dateMask"
                  ><div class="row items-center justify-end">
                    <q-btn v-close-popup color="primary" flat label="Close" />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template> </q-input
      ></q-item>
      <q-item class="column">
        <q-input
          ref="dateRef"
          v-model="dueDateModel"
          :rules="[ruleNotEmpty, ruleDueDateGreaterThanStartDate]"
          hide-bottom-space
          label="Due Date"
        >
          <template v-slot:prepend>
            <q-icon class="cursor-pointer" name="event">
              <q-popup-proxy
                cover
                transition-hide="scale"
                transition-show="scale"
              >
                <q-date v-model="task.dueDate" :mask="dateMask"
                  ><div class="row items-center justify-end">
                    <q-btn v-close-popup color="primary" flat label="Close" />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template> </q-input
      ></q-item>
      <q-item class="column">
        <q-select
          v-model="selectedTaskTypeId"
          :options="taskListsStore.TaskTypes"
          label="Task Type"
          map-options
          option-label="name"
          option-value="id"
          emit-value
        />
      </q-item>
      <q-item class="column">
        <q-select
          v-model="task.taskPriorityId"
          :options="taskListsStore.TaskPriorities"
          label="Priority"
          map-options
          option-label="name"
          option-value="id"
          emit-value
      /></q-item>
      <q-item class="column">
        <q-select
          v-model="selectedTaskStatusId"
          :options="taskListsStore.TaskStatuses"
          label="Status"
          map-options
          option-label="name"
          option-value="id"
          emit-value
        />
      </q-item>
      <q-item class="column">
        <q-checkbox
          class="text-grey"
          v-model="task.isPrivate"
          label="Private?"
        />
      </q-item>
      <q-item class="column">
        <q-select
          v-model="task.taskOwnerSid"
          :options="filterUsersList"
          @filter="filterUsersFn"
          input-debounce="0"
          label="Owned by"
          option-label="name"
          option-value="id"
          emit-value
          map-options
          use-chips
          use-input
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey"> No results</q-item-section>
            </q-item>
          </template>
        </q-select></q-item
      >
      <q-item class="column">
        <q-select
          v-model="task.assignees"
          :options="filterUsersList"
          @filter="filterUsersFn"
          input-debounce="0"
          label="Assigned to"
          multiple
          option-label="name"
          option-value="id"
          use-chips
          use-input
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey"> No results</q-item-section>
            </q-item>
          </template>
        </q-select>
      </q-item>
      <q-item class="column">
        <q-select
          v-model="task.tags"
          :options="filterTagOptions"
          input-debounce="0"
          label="Tags"
          multiple
          option-label="name"
          use-chips
          use-input
          @filter="filterTagFn"
          @new-value="createValue"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                not in the list press enter to add as new tag</q-item-section
              >
            </q-item>
          </template>
        </q-select>
      </q-item>
      <q-item>
        <q-item-section>
          <Regarding
            v-if="appName === 'task'"
            v-model="task.parent"
            :regarding-parents="taskListsStore.RegardingParent"
          />
        </q-item-section>
      </q-item>
      <OCItem
        v-if="appName !== 'task' && taskFromParent?.parent?.value?.name"
        title="Regarding"
        :value="regarding"
      />
      <q-item
        v-ripple
        :clickable="!task.id"
        @click="!task.id && (recurrenceDialogOpened = true)"
        :class="{ 'cursor-not-allowed': task.id }"
      >
        <q-item-section avatar>
          <q-icon color="primary" name="repeat" size="sm" />
        </q-item-section>
        <q-item-section> <div v-html="repeatString"></div></q-item-section>
        <q-item-section side>
          <q-icon color="primary" name="chevron_right" />
        </q-item-section>
      </q-item>
    </q-list>
  </div>

  <q-dialog v-model="recurrenceDialogOpened">
    <EventsRecurrenceDialog
      @rrule-string-generated="handleRRuleString"
      @rrule-text-generated="handleRRuleText"
    />
  </q-dialog>
</template>
