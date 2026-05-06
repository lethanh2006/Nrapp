export type EntryType = "office" | "remote" | "day_off" | "leave";
export type RequestStatus = "draft" | "pending" | "approved" | "rejected";

export interface IScheduleEntry {
  _id?: string;
  date: string;
  type: EntryType;
  note?: string;
}

export interface IScheduleRequest {
  _id: string;
  employee_id: any;
  week_start: string;
  status: RequestStatus;
  submitted_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  reject_reason?: string;
  entries?: IScheduleEntry[];
}

export interface IWorkPolicy {
  submit_deadline_day: number;
  submit_deadline_hour: number;
}
