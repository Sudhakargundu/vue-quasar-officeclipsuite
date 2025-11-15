import { security } from '../security';
import { label, showTimeAs, eventType } from './eventLists';

export interface eventDetails {
  id: string;
  createdDate: string;
  createdGroupSid: string;
  createdUserSid: string;
  createdUserName: string;
  parent: {
    type: idAndName;
    value: idAndName;
  };
  eventType: eventType;
  eventName: string;
  eventDescription?: string;
  startDateTime?: string;
  endDateTime?: string;
  isAllDayEvent: boolean;
  eventUserSid: string;
  isRsvp: boolean;
  sendNotifications: boolean;
  eventLocation?: string;
  modifiedDate: string;
  modifiedUserSid: string;
  modifiedUserName: string;
  reminder: reminder;
  recurrence: recurrence;
  label: label;
  showTimeAs: showTimeAs;
  meetingAttendees: meetingAttendee[];
  url: string;
  security: security;
}

export interface meetingAttendee {
  id: string;
  name: string;
  email: string;
}

export interface idAndName {
  id: string;
  name: string;
}

export interface reminder {
  to: string;
  beforeMinutes: string;
}

export interface recurrence {
  text: string;
  rule: string;
}
