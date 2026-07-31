import type { IWorkPolicy } from "@/src/features/workschedule/model/workschedule.types";

export const toLocalDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getWeekStartMonday = (value: Date) => {
  const date = new Date(value);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getAllowedWeekRange = (now = new Date()) => {
  const start = getWeekStartMonday(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 28);
  return { start, end };
};

export const isRegistrationClosed = (
  policy: IWorkPolicy | null,
  now = new Date(),
) => {
  if (!policy) return false;
  if (policy.locked) return true;
  return (
    now < new Date(policy.registration_start) ||
    now > new Date(policy.registration_end)
  );
};

export const formatDateVi = (value: string | Date | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("vi-VN");
};

export const formatDateTimeVi = (value: string | Date | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${date.toLocaleDateString("vi-VN")}`;
};
