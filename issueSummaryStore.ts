import { defineStore } from 'pinia';
import { trackerCaseSummary } from '../../models/issueTracker/trackerCaseSumary';
import { linkHeader } from 'src/models/general/linkHeader';
import { searchFilter } from 'src/models/issueTracker/searchFilter';
import util from 'src/helpers/util';
import { Constants } from '../../stores/Constants';

export const useIssueSummaryStore = defineStore('issueSummaryStore', {
  state: () => ({
    issuesList: [] as trackerCaseSummary[],
    url: '' as string,
    pageSize: 15,
    pageNum: 1,
    filter: {} as searchFilter,
    links: {} as linkHeader,
    errorMsg: '' as string,
  }),

  getters: {
    IssuesList: (state) => state.issuesList,
    IsEmptyLinkHeader: (state) => Object.keys(state.links).length == 0,
  },

  actions: {
    constructBaseURL(binderId: string) {
      const baseUrl = `${util.getEndPointUrl()}/tracker-case-summary?binderSid=${binderId}&pagenumber=${
        this.pageNum
      }&pagesize=${this.pageSize}`;
      return baseUrl;
    },

    constructQueryParams() {
      const queryParams = new URLSearchParams();
      const params: searchFilter = this.filter;
      const filterKeys = Object.keys(params);
      filterKeys.forEach((key) => {
        if (this.filter[key]) {
          queryParams.append(key, String(this.filter[key]));
        }
      });
      return queryParams;
    },

    getUrl(binderId: string) {
      let callStr = '';
      if (!this.IsEmptyLinkHeader) {
        callStr = `${this.links}`;
      } else {
        callStr = this.constructBaseURL(binderId);
        const queryParams = this.constructQueryParams();
        const queryString = queryParams.toString();
        callStr += queryString ? `&${queryString}` : '';
      }
      this.url = callStr;
    },

    setFilter(searchFilter: searchFilter) {
      this.filter = searchFilter;
    },

    resetPageNumber() {
      this.pageNum = 1;
      this.links = {} as linkHeader; // https://stackoverflow.com/a/45339463
    },

    async getIssuesUpdated(
      isFilter: boolean,
      binderId: string,
    ): Promise<boolean> {
      this.getUrl(binderId);
      try {
        const instance = Constants.getAxiosInstance();
        const response = await instance.get(this.url);
        if (response.status === 200) {
          const summaries = response.data.data;
          if (isFilter) {
            await this.resetIssuesSummaryList();
          }
          this.issuesList.push(...summaries);
          this.links = response.data.pagination.next || '{}';
          this.url = this.links ? `${this.links}` : '';
        } else if (response.status === 204) {
          await this.resetIssuesSummaryList();
          //this.errorMsg = response.statusText;
          this.errorMsg = 'No Content';
          return true;
        } else {
          return true;
        }
      } catch (error) {}
      return this.url === 'null';
    },

    async getIssuesByParent(
      parentObjectId: number,
      parentObjectServiceType: number,
    ) {
      const callStr =
        parentObjectId > 0 && parentObjectServiceType > 0
          ? `${util.getEndPointUrl()}/tracker-case-summary?parentObjectId=${parentObjectId}&parentObjectServiceType=${parentObjectServiceType}`
          : `${util.getEndPointUrl()}/tracker-case-summary`;
      try {
        const instance = Constants.getAxiosInstance();
        const response = await instance.get(callStr);
        this.issuesList = response.data;
      } catch (error) {
        Constants.throwError(error);
      }
    },

    async resetIssuesSummaryList() {
      this.issuesList = [];
    },
  },
});
