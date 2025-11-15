<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useIssueDetailsStore } from 'src/stores/issueTracker/issueDetailsStore';
import { isAllowed } from 'src/helpers/security';
import { ObjectType } from 'src/helpers/util';
import { getIssueTrackerLabelColor } from 'src/helpers/colorIconHelper';
import dateTimeHelper from 'src/helpers/dateTimeHelper';

import OC_Header from 'src/components/OCcomponents/OC_Header.vue';
// import drawer from 'src/components/drawer.vue';
import OC_Drawer from 'src/components/OC_Drawer.vue';
import ConfirmDelete from 'src/components/general/ConfirmDelete.vue';
import NoteList from 'src/components/Notes/NotesListCtrl.vue';
import OC_Loader from 'src/components/general/OC_Loader.vue';
// import OCItem from 'src/components/OCcomponents/OC-Item.vue';

// --- State ---
const loading = ref(true);
const myDrawer = ref();
const notesCount = ref(0);
const showDeleteConfirmation = ref(false);

// --- Composables ---
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const issueDetailsStore = useIssueDetailsStore();

// --- Route Params ---
const id = route.params.id as string;
const binderName = route.params.binderName as string;
const appName = route.params.appName as string;

// --- Computed Properties ---
const issueDetails = computed(() => issueDetailsStore.IssueDetails);

const properties = computed(() => [
  { label: 'Status', value: issueDetails.value?.status },
  { label: 'Criticality', value: issueDetails.value?.criticality },
  { label: 'Kind', value: issueDetails.value?.kind },
  { label: 'Category', value: issueDetails.value?.category },
]);

const properties2 = computed(() => [
  {
    label: 'Assigned To',
    value: issueDetails.value?.assignedTo.name || '-- none --',
  },
  { label: 'Description', value: issueDetails.value?.description },
  { label: 'Regarding', value: projectServiceItem.value },
  {
    label: 'Created By',
    value: `${issueDetails.value?.createdUserName} on ${dateTimeHelper.formatDateTimeFromRestAPIForUI(issueDetails.value?.createdDate, false)}`,
  },
  {
    label: 'Modified By',
    value: `${issueDetails.value?.modifiedUserName} on ${dateTimeHelper.formatDateTimeFromRestAPIForUI(issueDetails.value?.modifiedDate, false)}`,
  },
]);

const filteredProperties2 = computed(() =>
  properties2.value.filter((prop) => prop.value),
);

const projectServiceItem = computed(() => {
  if (!issueDetails.value?.parent?.value?.id) return '';
  return `${issueDetails.value.parent.type?.name} : ${issueDetails.value.parent.value?.name}`;
});

const canEdit = computed(() =>
  isAllowed({ security: { write: issueDetails.value?.security?.write } }),
);
const canDelete = computed(() =>
  isAllowed({ security: { delete: issueDetails.value?.security?.delete } }),
);

const noteParams = computed(() => ({
  parentObjectId: id,
  parentObjectServiceType: ObjectType.Contact.toString(),
  selectedNoteBook: '',
}));

// --- Functions ---
function toggleLeftDrawer() {
  myDrawer.value?.toggleLeftDrawer();
}

function editIssue() {
  router.push({ name: 'editIssue', params: { id, appName } });
}

async function deleteIssue() {
  loading.value = true;
  try {
    await issueDetailsStore.deleteTrackerCaseDetails(id);
    showDeleteConfirmation.value = false;
    router.go(-1);
  } catch (error) {
    $q.dialog({
      title: 'Error',
      message: `Failed to delete issue: ${error}`,
    });
  } finally {
    loading.value = false;
  }
}

// --- Lifecycle Hooks ---
onMounted(async () => {
  loading.value = true;
  try {
    await issueDetailsStore.getTrackerCaseDetails(id);
  } catch (error) {
    $q.dialog({
      title: 'Alert',
      message: error as string,
    }).onOk(() => router.push({ path: '/homePage' }));
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <OC_Header
      :title="`Binder: ${binderName}`"
      :show-menu-button="true"
      @toggle-drawer="toggleLeftDrawer"
      :show-edit-button="canEdit"
      @edit="editIssue"
      :show-delete-button="canDelete"
      @delete="showDeleteConfirmation = true"
    />

    <OC_Drawer ref="myDrawer" />

    <q-page-container>
      <q-page padding>
        <OC_Loader :visible="loading" />

        <div v-if="!loading && issueDetails" class="q-gutter-y-md">
          <q-card flat>
            <q-card-section>
              <div class="text-subtitle1">
                <span class="text-weight-medium"
                  >{{ issueDetails.caseId }}:</span
                >
                <span
                  class="description q-ml-sm"
                  v-html="issueDetails.name"
                ></span>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section>
              <div class="row q-col-gutter-md">
                <div
                  v-for="prop in properties"
                  :key="prop.label"
                  class="col-6 flex items-center"
                >
                  <q-item-label caption class="q-my-sm" style="color: inherit"
                    >{{ prop.label }}:
                    <q-chip
                      v-if="prop.value?.id !== '-1'"
                      :class="getIssueTrackerLabelColor(prop.value?.name)"
                    >
                      <q-item-label class="q-px-xs">{{
                        prop.value?.name
                      }}</q-item-label>
                    </q-chip>
                    <span v-else class="q-mx-md">-- none --</span>
                  </q-item-label>
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section>
              <div class="row q-col-gutter-md">
                <div
                  v-for="prop in filteredProperties2"
                  :key="prop.label"
                  class="col-12 col-md-6 flex items-center"
                >
                  <div v-if="prop.value">
                    <div v-if="prop.label != 'Description'">
                      <q-item-label
                        caption
                        class="q-my-sm"
                        style="color: inherit"
                        >{{ prop.label }}:</q-item-label
                      >
                      <q-item-label> {{ prop.value }} </q-item-label>
                    </div>
                    <div v-else>
                      <q-item-label
                        caption
                        class="q-my-sm"
                        style="color: inherit"
                        >{{ prop.label }}:</q-item-label
                      >
                      <q-item-label>
                        <div v-html="prop.value"></div>
                      </q-item-label>
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <q-list>
                <q-expansion-item
                  expand-separator
                  icon="subject"
                  :label="`Notes (${notesCount})`"
                  expand-icon-class="text-primary"
                >
                  <template v-slot:header>
                    <q-item-section> Notes ({{ notesCount }}) </q-item-section>
                    <q-item-section side>
                      <q-btn
                        :to="{
                          name: 'newNotes',
                          params: {
                            id: -1,
                            objectTypeId: ObjectType.Issues,
                            objectId: issueDetails.id,
                          },
                        }"
                        size="sm"
                        flat
                        round
                        dense
                        icon="add"
                        @click.stop
                      />
                    </q-item-section>
                  </template>
                  <q-separator />
                  <NoteList
                    @number-of-notes="notesCount = $event"
                    :params="noteParams"
                  />
                </q-expansion-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>

  <ConfirmDelete
    :show-confirmation-dialog="showDeleteConfirmation"
    :id="id"
    title="Confirm Deletion"
    message="Are you sure you want to delete this issue?"
    @cancel="showDeleteConfirmation = false"
    @confirm="deleteIssue"
  />
</template>

<style scoped lang="scss">
@import 'src/css/status.scss';

.description {
  line-height: 1.5rem;
  letter-spacing: 0.00937em;
  word-break: break-word;
}
</style>
