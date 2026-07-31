import type { EntryType } from "@/src/features/workschedule/model/workschedule.types";

export const SCHEDULE_TYPE_OPTIONS: {
  value: EntryType;
  label: string;
  textClassName: string;
  backgroundClassName: string;
  borderClassName: string;
  icon: "business" | "home" | "sunny" | "cafe";
}[] = [
  {
    value: "office",
    label: "Lên cty",
    textClassName: "text-blue-700",
    backgroundClassName: "bg-blue-50/80",
    borderClassName: "border-blue-200",
    icon: "business",
  },
  {
    value: "remote",
    label: "Từ xa",
    textClassName: "text-purple-700",
    backgroundClassName: "bg-purple-50/80",
    borderClassName: "border-purple-200",
    icon: "home",
  },
  {
    value: "day_off",
    label: "Nghỉ",
    textClassName: "text-slate-500",
    backgroundClassName: "bg-slate-50/80",
    borderClassName: "border-slate-200",
    icon: "sunny",
  },
  {
    value: "leave",
    label: "Phép",
    textClassName: "text-orange-700",
    backgroundClassName: "bg-orange-50/80",
    borderClassName: "border-orange-200",
    icon: "cafe",
  },
];

export const WEEKDAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
