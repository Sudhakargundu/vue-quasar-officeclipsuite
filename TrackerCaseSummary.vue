<script setup lang="ts">
import { Ref, ref, watch } from 'vue';
// import drawer from '../../components/drawer.vue';
import OC_Drawer from 'src/components/OC_Drawer.vue';
import OC_Header from '../../components/OCcomponents/OC_Header.vue';
import { useIssueSummaryStore } from 'src/stores/issueTracker/issueSummaryStore';
import { useRoute } from 'vue-router';
import AdvancedFilters from '../../components/IssueTracker/IssueTrackerAdvancedFilters.vue';
import { searchFilter } from 'src/models/issueTracker/searchFilter';
import { useSessionStore } from 'src/stores/SessionStore';
import IssuesListCtrl from 'src/components/IssueTracker/IssuesListCtrl.vue';

const route = useRoute();
const binderId = route.params.binderId;
const binderName = route.params.binderName as string;
const myDrawer = ref();
const infinteScroll = ref(null);
const defaultFilterOptions: searchFilter = {
  searchString: '',
  starredIssues: '',
  statusId: '',
  criticalityId: '',
  categoryId: '',
  kindId: '',
  createdById: '',
  assignedToId: '',
  modifiedById: '',
};

const parent = {
  parentObjectId: '',
  parentObjectServiceType: '',
  appName: 'issueTracker',
};

let filterOptions: Ref<searchFilter> = ref({ ...defaultFilterOptions });

const sessionStore = useSessionStore();
const issueSummaryStore = useIssueSummaryStore();

const assignedToMe = ref(
  filterOptions.value.assignedToId === sessionStore.Session.userId,
);

//need to figure out how and what value assigned for starredIssues filter
// const starredIssues = ref('');

function clearFilterValues() {
  window.location.reload();
}

function receiveAdvFilters(advancedOptions: searchFilter) {
  filterOptions.value.statusId = advancedOptions.statusId;
  filterOptions.value.criticalityId = advancedOptions.criticalityId;
  filterOptions.value.categoryId = advancedOptions.categoryId;
  filterOptions.value.kindId = advancedOptions.kindId;
  filterOptions.value.createdById = advancedOptions.createdById;
  filterOptions.value.assignedToId = advancedOptions.assignedToId;
  filterOptions.value.assignedToId = advancedOptions.assignedToId;
  filterOptions.value.modifiedById = advancedOptions.modifiedById;
  assignedToMe.value =
    advancedOptions.assignedToId === sessionStore.Session.userId;
}

async function filterFn(val: string) {
  if (val.length > 2) {
    filterOptions.value.searchString = val.toLowerCase();
    issueSummaryStore.resetPageNumber();
    issueSummaryStore.setFilter(filterOptions.value);
    await issueSummaryStore.getIssuesUpdated(true, binderId.toString());
    infinteScroll.value.infinteScrollReset();
  }
}

watch(
  () => filterOptions.value.searchString,
  async (newValue) => {
    await filterFn(newValue);
  },
);

watch(assignedToMe, async () => {
  if (!assignedToMe.value) {
    window.location.reload();
  }
  filterOptions.value.assignedToId = sessionStore.Session.userId;
  await issueSummaryStore.resetIssuesSummaryList();
  issueSummaryStore.setFilter(filterOptions.value);
  await issueSummaryStore.getIssuesUpdated(true, binderId.toString());
  infinteScroll.value.infinteScrollReset();
});

const showAdvOptions = ref(false);
const filterCount = ref(0);
function updateFilterCount(val: number) {
  filterCount.value = val;
}
const position = ref<'top' | 'right' | 'bottom' | 'left' | 'standard'>('top');

function open(pos: 'top' | 'right' | 'bottom' | 'left' | 'standard') {
  position.value = pos;
  showAdvOptions.value = true;
}

function toggleLeftDrawer() {
  if (myDrawer.value == null) return;
  myDrawer.value.toggleLeftDrawer();
}

const advanceFilters = async () => {
  await issueSummaryStore.resetIssuesSummaryList();
  issueSummaryStore.setFilter(filterOptions.value);
  await issueSummaryStore.getIssuesUpdated(true, binderId.toString());
  infinteScroll.value.infinteScrollReset();
};
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <OC_Header
      :title="`Binder: ${binderName}`"
      back-button-to="/trackerBinderSummary"
      :show-menu-button="true"
      @toggle-drawer="toggleLeftDrawer"
    />
    <OC_Drawer ref="myDrawer" />
    <q-space class="q-mt-sm"></q-space>
    <q-page-container>
      <q-page>
        <q-item>
          <q-item-section>
            <q-input
              v-model="filterOptions.searchString"
              debounce="1000"
              clearable
              @clear="clearFilterValues"
              label="Search"
              outlined
              placeholder="Start typing with min 3 characters to search"
            >
            </q-input>
          </q-item-section>
        </q-item>
        <q-item class="q-mt-sm q-mb-md">
          <q-item-section>
            <q-item-label>
              <q-checkbox dense v-model="assignedToMe" label="assigned to me" />
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-item-label>
              <q-btn
                flat
                icon="filter_list"
                @click="open('top')"
                class="q-px-xs"
              >
                <q-badge v-if="filterCount" color="red" floating rounded>{{
                  filterCount
                }}</q-badge>
              </q-btn>
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-item-label>
              <q-btn flat icon="clear" @click="clearFilterValues" />
            </q-item-label>
          </q-item-section>
        </q-item>
        <IssuesListCtrl
          :binderId="binderId"
          :binderName="binderName"
          :parent="parent"
          ref="infinteScroll"
        />
        <q-dialog v-model="showAdvOptions" :position="position">
          <AdvancedFilters
            :filter-options="filterOptions"
            :parent="parent"
            :binderId="binderId"
            @advancedOptionsGenerated="receiveAdvFilters"
            @filterCount="updateFilterCount"
            ref="infinteScroll"
            @scrollLoadMore="advanceFilters"
          />
        </q-dialog>
      </q-page>
      <q-page-sticky position="bottom-right" :offset="[18, 18]">
        <q-btn
          fab
          icon="add"
          color="accent"
          padding="md"
          :to="{
            name: 'newIssue',
            params: {
              binderId: binderId,
              objectTypeId: -1,
              objectId: -1,
              appName: 'issueTracker',
            },
          }"
        >
        </q-btn>
      </q-page-sticky>
    </q-page-container>
  </q-layout>
</template>

<style scopped lang="scss">
@import '../../css/status.scss';
.q-item {
  min-height: 24px;
  padding: 4px 16px;
}
</style>
