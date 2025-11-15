<script lang="ts" setup>
import { ref, Ref, defineProps, onMounted } from 'vue';
import { useIssueListsStore } from '../../stores/issueTracker/issueListsStore';
import { trackerCaseDetails } from 'src/models/issueTracker/trackerCaseDetails';
import Regarding from 'components/general/regardingComponent.vue';

const props = defineProps({
  issueFromParent: {
    type: Object as () => trackerCaseDetails,
    required: true,
  },
  appName: {
    type: String,
  },
});
const binderId = props.issueFromParent.binderId;

const trackerCaseDetail: Ref<trackerCaseDetails> = ref(props.issueFromParent);

const issueListsStore = useIssueListsStore();

onMounted(async () => {
  if (binderId) {
    await issueListsStore.getTrackerLists(binderId);
  }

  if (!trackerCaseDetail.value.id) {
    // New Issue - set default values
    setDefaultValues();
  }
});

function setDefaultValues() {
  const findDefaultOption = (options: any[]) =>
    options.find((option) => option.is_default);

  trackerCaseDetail.value.status =
    findDefaultOption(issueListsStore.Status) || trackerCaseDetail.value.status;
  trackerCaseDetail.value.category =
    findDefaultOption(issueListsStore.Category) ||
    trackerCaseDetail.value.category;
  trackerCaseDetail.value.criticality =
    findDefaultOption(issueListsStore.Criticality) ||
    trackerCaseDetail.value.criticality;
  trackerCaseDetail.value.kind =
    findDefaultOption(issueListsStore.Kind) || trackerCaseDetail.value.kind;
}
</script>

<template>
  <div class="q-pa-md">
    <q-card flat>
      <q-card-section>
        <div class="row q-col-gutter-x-md q-col-gutter-y-md">
          <!-- Left Column -->
          <div class="col-12 col-md-6 q-gutter-y-md">
            <q-input
              label="Title"
              v-model="trackerCaseDetail.name"
              filled
              class="full-width"
            />
            <q-field
              v-model="trackerCaseDetail.description"
              label="Description"
              filled
              stack-label
            >
              <template #control>
                <q-editor
                  class="full-width"
                  paragraph-tag="div"
                  placeholder="Enter description"
                  min-height="4rem"
                  v-model="trackerCaseDetail.description"
                  :toolbar="[
                    [
                      'link',
                      'bold',
                      'italic',
                      'unordered',
                      'ordered',
                      'fullscreen',
                    ],
                  ]"
                />
              </template>
            </q-field>
            <q-select
              label="Status"
              v-model="trackerCaseDetail.status"
              :options="issueListsStore.Status"
              map-options
              option-label="name"
              option-value="id"
              filled
              class="full-width"
            />
            <q-select
              label="Assigned To"
              v-model="trackerCaseDetail.assignedTo"
              :options="issueListsStore.Users"
              map-options
              option-label="name"
              option-value="id"
              filled
              class="full-width"
            />
          </div>

          <!-- Right Column -->
          <div class="col-12 col-md-6 q-gutter-y-md">
            <q-select
              label="Category"
              v-model="trackerCaseDetail.category"
              :options="issueListsStore.Category"
              map-options
              option-label="name"
              option-value="id"
              filled
              class="full-width"
            />
            <q-select
              label="Criticality"
              v-model="trackerCaseDetail.criticality"
              :options="issueListsStore.Criticality"
              map-options
              option-label="name"
              option-value="id"
              filled
              class="full-width"
            />
            <q-select
              label="Kind"
              v-model="trackerCaseDetail.kind"
              :options="issueListsStore.Kind"
              map-options
              option-label="name"
              option-value="id"
              filled
              class="full-width"
            />
            <Regarding
              v-if="appName === 'issueTracker'"
              v-model="trackerCaseDetail.parent"
              :regarding-parents="issueListsStore.RegardingParent"
              class="full-width q-pa-none"
            />
            <q-input
              label="Comments"
              v-model="trackerCaseDetail.comments"
              filled
              class="full-width"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>
