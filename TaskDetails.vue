<!-- cleaned up with google bard with minor correction -->
<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dateTimeHelper from '../../helpers/dateTimeHelper';
import { useTaskDetailsStore } from '../../stores/task/taskDetailsStore';
import addEditSubtaskDialog from 'components/tasks/addEditSubtaskDialog.vue';
import { subTask } from 'src/models/task/subtask';
import SubtaskItem from 'components/tasks/SubtaskItem.vue';
import {
  getPriorityColor,
  getPriorityIcon,
  getTaskStatusColor,
  getTaskStatusIcon,
} from 'src/helpers/colorIconHelper';
import ConfirmationDialog from '../../components/general/ConfirmDelete.vue';
import OC_Header from 'src/components/OCcomponents/OC_Header.vue';
import { useQuasar } from 'quasar';
// import drawer from '../../components/drawer.vue';
import OC_Drawer from 'src/components/OC_Drawer.vue';

const taskDetailsStore = useTaskDetailsStore();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const myDrawer = ref();

const id = route.params.id;
const appName = route.params.appName;
const taskDetail = ref();
const pendingSubtasks = ref();
const completedSubtasks = ref();

const loadTimesheetDetails = async () => {
  $q.loading.show();
  try {
    await taskDetailsStore.getTask(id as string);
  } catch (error) {
    $q.dialog({
      title: 'Alert',
      message: error as string,
    }).onOk(async () => {
      await router.push({ path: '/tasksList' });
      await router.go(0);
    });
  } finally {
    $q.loading.hide();
  }
};

onMounted(async () => {
  await loadTimesheetDetails();
  taskDetail.value = taskDetailsStore.taskDetail;
  pendingSubtasks.value = taskDetail.value?.subTasks.filter(
    (subtask: subTask) => !subtask.isCompleted,
  );
  completedSubtasks.value = taskDetail.value?.subTasks.filter(
    (subtask: subTask) => subtask.isCompleted,
  );
});

const details = computed(() => {
  const task = taskDetail.value;
  if (!task) return [];

  const regardingInfo = task.parent.type.name
    ? `${task.parent.type.name}: ${task.parent.value.name}`
    : '';

  const formattedStartDate = dateTimeHelper.formatDateTimeFromRestAPIForUI(
    task.startDate,
    true,
  );
  const formattedEndDate = dateTimeHelper.formatDateTimeFromRestAPIForUI(
    task.dueDate,
    true,
  );

  return [
    {
      label: 'Start Date',
      value: formattedStartDate,
      icon: 'event',
      show: !!formattedStartDate,
    },
    {
      label: 'Due Date',
      value: formattedEndDate,
      icon: 'event_available',
      show: !!formattedEndDate,
    },
    {
      label: 'Repeating',
      value: task.recurrence?.text,
      icon: 'repeat',
      show: !!task.recurrence?.text,
    },
    {
      label: 'Owner',
      value: task.taskOwnerName,
      icon: 'person',
      show: !!task.taskOwnerName,
    },
    {
      label: 'Privacy',
      value: task.isPrivate ? 'Private' : 'Public',
      icon: task.isPrivate ? 'lock' : 'lock_open',
      show: true,
    },
    {
      label: 'Regarding',
      value: regardingInfo,
      icon: 'info',
      show: !!regardingInfo,
    },
  ].filter((detail) => detail.show && detail.value);
});

const details2 = computed(() => {
  const task = taskDetail.value;
  if (!task) return [];

  return [
    {
      label: 'Type',
      value: task.taskTypeName,
      color: 'grey-8',
      show: !!task.taskTypeName,
    },
    {
      label: 'Priority',
      value: task.taskPriorityName,
      color: getPriorityColor(task.taskPriorityName as string),
      icon: getPriorityIcon(task.taskPriorityName as string),
      show: !!task.taskPriorityName,
    },
    {
      label: 'Status',
      value: task.taskStatusName,
      color: getTaskStatusColor(task.taskStatusCategory as string),
      icon: getTaskStatusIcon(task.taskStatusCategory as string),
      show: !!task.taskStatusName,
    },
  ].filter((detail) => detail.show && detail.value);
});

const title = ref('Confirm');
const message = ref('Are you sure you want to delete this task?');
const showConfirmationDialog = ref(false);
const displayConfirmationDialog = () => {
  showConfirmationDialog.value = true;
};
const cancelConfirmation = () => {
  showConfirmationDialog.value = false;
};

const confirmDeletion = async () => {
  try {
    await taskDetailsStore.deleteTask(id as string);
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

const showAddSubtaskDialog = ref(false);

async function addSubtask(subtask: subTask) {
  try {
    await taskDetailsStore.addSubtask(subtask);
    showAddSubtaskDialog.value = false;
    window.location.reload();
  } catch (error) {
    $q.dialog({
      title: 'Alert',
      message: error as string,
    }).onOk(async () => {
      showAddSubtaskDialog.value = true;
    });
  }
}
function toggleLeftDrawer() {
  if (myDrawer.value == null) return;
  myDrawer.value.toggleLeftDrawer();
}

const newSubtask = ref({
  id: '',
  parentId: id,
  title: '',
  description: '',
  assignee: {
    id: '',
    name: '',
  },
  isCompleted: false,
  completedDate: '',
});

function editTask() {
  router.push({ name: 'editTask', params: { id: id, appName: appName } });
}
</script>

<template>
  <q-layout view="lHh Lpr lFf" v-if="taskDetail">
    <OC_Header
      title="Task Details"
      :show-menu-button="true"
      @toggle-drawer="toggleLeftDrawer"
      :show-edit-button="true"
      :disable-edit="!taskDetail?.security?.write"
      edit-tooltip="Editing is disabled"
      @edit="editTask"
      :show-delete-button="true"
      :disable-delete="!taskDetail?.security?.delete"
      delete-tooltip="Deleting is disabled"
      @delete="displayConfirmationDialog"
    >
    </OC_Header>
    <OC_Drawer ref="myDrawer" />
    <q-page-container>
      <q-card class="q-ma-sm q-mb-lg" flat>
        <q-item class="q-mb-sm">
          <q-item-section>
            <q-item-label class="text-subtitle1 text-weight-medium q-mb-sm">{{
              taskDetail?.subject
            }}</q-item-label>
            <q-item-label>
              <div v-html="taskDetail?.description"></div>
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-separator class="q-mb-sm" inset />
        <div class="row justify-between q-mb-sm">
          <q-item v-for="(detail, index) in details2" :key="index">
            <q-item-section>
              <q-item-label caption>{{ detail.label }}</q-item-label>
              <q-item-label>
                <q-chip
                  :color="detail.color"
                  :icon-right="detail.icon"
                  square
                  text-color="white"
                >
                  {{ detail.value }}
                </q-chip>
              </q-item-label>
            </q-item-section>
          </q-item>
        </div>
        <q-separator class="q-mb-sm" inset />
        <q-item v-if="taskDetail?.assignees?.length > 0" class="q-mb-sm">
          <q-item-section avatar>
            <q-icon name="group" />
          </q-item-section>
          <q-item-section>
            <q-item-label caption>Assignees</q-item-label>
            <div class="q-pt-xs row">
              <q-chip
                v-for="assignee in taskDetail?.assignees"
                :key="assignee.id"
                square
              >
                {{ assignee.name }}
              </q-chip>
            </div>
          </q-item-section>
          <q-separator class="q-mb-sm" inset />
        </q-item>
        <q-list>
          <q-item
            v-for="(detail, index) in details"
            :key="index"
            class="q-mb-md"
          >
            <q-item-section avatar>
              <q-icon :name="detail.icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>{{ detail.label }}</q-item-label>
              <q-item-label v-if="detail.label === 'Repeating'"
                ><div v-html="detail.value"></div
              ></q-item-label>
              <q-item-label v-else>{{ detail.value }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <div v-if="taskDetail?.tags?.length > 0">
          <q-separator class="q-mt-sm" inset />
          <q-item class="q-mb-md">
            <q-item-section avatar>
              <q-icon name="label" />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>Tags</q-item-label>
              <q-item-label>
                <q-chip v-for="tag in taskDetail?.tags" :key="tag.id" square>{{
                  tag.name
                }}</q-chip>
              </q-item-label>
            </q-item-section>
          </q-item>
        </div>
        <div
          v-if="
            (pendingSubtasks?.length as number) > 0 ||
            (completedSubtasks?.length as number) > 0
          "
        >
          <q-toolbar class="bg-primary text-white shadow-2 q-mt-md">
            <q-toolbar-title>Subtasks</q-toolbar-title>
            <q-btn flat icon="add" round @click="showAddSubtaskDialog = true" />
          </q-toolbar>
          <q-list bordered class="rounded-borders">
            <div v-if="(pendingSubtasks?.length as number) > 0">
              <q-item-label caption class="q-ma-sm">Pending</q-item-label>
              <div v-for="subtask in pendingSubtasks" :key="subtask.id">
                <subtask-item
                  :subtask="subtask"
                  :taskSid="taskDetail?.id as string"
                />
              </div>
            </div>
            <q-item-label
              v-if="pendingSubtasks?.length === 0"
              class="text-center text-grey"
              >No pending tasks</q-item-label
            >
            <q-separator spaced />
            <div v-if="(completedSubtasks?.length as number) > 0">
              <q-item-label caption class="q-ma-sm">Completed</q-item-label>
              <div v-for="subtask in completedSubtasks" :key="subtask.id">
                <subtask-item
                  :subtask="subtask"
                  :taskSid="taskDetail?.id as string"
                />
              </div>
            </div>
            <q-item-label
              v-if="completedSubtasks?.length === 0"
              class="text-center text-grey"
              >No completed tasks
            </q-item-label>
          </q-list>
        </div>
        <div class="q-mx-md" v-else>
          <q-btn
            color="primary"
            label="Add subtask"
            no-caps
            @click="showAddSubtaskDialog = true"
          ></q-btn>
        </div>
      </q-card>
      <q-page-sticky :offset="[18, 18]" position="bottom-right">
        <q-fab
          color="purple"
          direction="up"
          icon="add"
          vertical-actions-align="right"
        >
          <q-fab-action
            color="primary"
            icon="add_task"
            label="Add subtask"
            @click="showAddSubtaskDialog = true"
          />
          <q-fab-action
            :to="{
              name: 'newTask',
              params: {
                id: -1,
                objectTypeId: -1,
                objectId: -1,
              },
            }"
            color="secondary"
            icon="add"
            label="Create New Task"
          />
        </q-fab>
      </q-page-sticky>
      <q-dialog v-model="showAddSubtaskDialog">
        <add-edit-subtask-dialog
          :subtask="newSubtask"
          :taskSid="taskDetail?.id as string"
          @save-subtask="addSubtask"
        />
      </q-dialog>
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
