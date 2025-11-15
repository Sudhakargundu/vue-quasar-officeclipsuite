import { defineStore } from 'pinia';
import { trackerCaseDetails } from 'src/models/issueTracker/trackerCaseDetails';
import { Constants } from '../Constants';
import util from 'src/helpers/util';

export const useIssueDetailsStore = defineStore('issueDetailsStore', {
  state: () => ({
    issueDetails: {} as trackerCaseDetails,
  }),

  getters: {
    IssueDetails: (state) => state.issueDetails,
  },

  actions: {
    async getTrackerCaseDetails(id: string | string[]) {
      try {
        const instance = Constants.getAxiosInstance();
        const response = await instance.get(
          `${util.getEndPointUrl()}/tracker-case-detail/${id}`
        );
        this.issueDetails = response.data;
      } catch (error) {
        Constants.throwError(error);
      }
    },

    async addNewTrackerCaseDetails(trackerCaseDetails: trackerCaseDetails) {
      const callStr = `${util.getEndPointUrl()}/tracker-case-detail`;
      try {
        const instance = Constants.getAxiosInstance();
        const response = await instance.post(callStr, trackerCaseDetails);
        if (response.status === 200) {
          this.issueDetails = response.data;
          window.location.reload();
        }
      } catch (error) {
        Constants.throwError(error);
      }
    },
    async deleteTrackerCaseDetails(id: string) {
      const callStr = `${util.getEndPointUrl()}/tracker-case-detail/${id}`;
      try {
        const instance = Constants.getAxiosInstance();
        const response = await instance.delete(callStr);
        if (response.status === 200) {
          this.issueDetails = response.data;
        }
      } catch (error) {
        Constants.throwError(error);
      }
    },
    async editTrackerCaseDetails(trackerCaseDetails: trackerCaseDetails) {
      try {
        const callStr = `${util.getEndPointUrl()}/tracker-case-detail/${
          trackerCaseDetails.id
        }`;
        const instance = Constants.getAxiosInstance();
        const response = await instance.put(callStr, trackerCaseDetails);
        if (response.status === 200) {
          this.issueDetails = response.data;
        }
      } catch (error) {
        Constants.throwError(error);
      }
    },
  },
});
