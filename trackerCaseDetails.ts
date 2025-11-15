import { security } from '../security';
import {
  assignedTo,
  issueCategory,
  issueCriticality,
  issueKind,
  issueStatus,
} from './issueLists';

export interface trackerCaseDetails {
  id: string;
  binderId: string;
  caseId: string;
  name: string;
  status: issueStatus;
  criticality: issueCriticality;
  category: issueCategory;
  kind: issueKind;
  assignedTo: assignedTo;
  createdDate: string;
  createdUserName: string;
  modifiedDate: string;
  modifiedUserName: string;
  parent: {
    type: {
      id: string;
      name: string;
    };
    value: {
      id: string;
      name: string;
    };
  };
  description: string;
  resolution: string;
  comments: string;
  security: security;
}
