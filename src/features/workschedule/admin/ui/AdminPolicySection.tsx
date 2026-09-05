import { useAdminData } from "@/src/features/workschedule/admin/model/AdminWorkscheduleContext";
import { WorkMonthCalendar } from "@/src/features/workschedule/shared/ui/WorkMonthCalendar";
import {
  getRegistrationMonth,
  getScheduleToday,
  monthDate,
  toLocalDateKey,
  toMonthKey,
} from "@/src/features/workschedule/shared/utils/date";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

const formatDay = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-");
  return day ? `${day}/${month}/${year}` : "Chưa chọn";
};
const monthLabel = (month: string) =>
  `Tháng ${Number(month.slice(5))}/${month.slice(0, 4)}`;

export function AdminPolicySection() {
  const {
    policy,
    policyDraft,
    setPolicyDraft,
    savingPolicy,
    handleSavePolicy,
    handleLockPolicy,
  } = useAdminData();
  const [isOpen, setIsOpen] = useState(false);
  const [selection, setSelection] = useState<"start" | "end">("start");
  const today = toLocalDateKey(getScheduleToday());
  const currentMonth = today.slice(0, 7);
  const draftMonth = policyDraft.registration_start.slice(0, 7);
  const selectedMonth =
    /^\d{4}-\d{2}$/.test(draftMonth) && draftMonth >= currentMonth
      ? draftMonth
      : currentMonth;
  const startDay = policyDraft.registration_start.slice(0, 10);
  const endDay = policyDraft.registration_end.slice(0, 10);
  const activeMonth = getRegistrationMonth(policy);
  const now = Date.now();
  const registrationStatus =
    policy?.locked !== false || !activeMonth
      ? "Tạm dừng"
      : now < new Date(policy.registration_start).getTime()
        ? "Chưa đến ngày mở"
        : now > new Date(policy.registration_end).getTime()
          ? "Đã kết thúc"
          : "Đang nhận lịch";
  const isAccepting = registrationStatus === "Đang nhận lịch";
  const highlightedDates: string[] = [];
  const date = monthDate(selectedMonth);
  while (toMonthKey(date) === selectedMonth) {
    const key = toLocalDateKey(date);
    if (key >= startDay && key <= endDay && key >= today)
      highlightedDates.push(key);
    date.setDate(date.getDate() + 1);
  }

  const selectMonth = (offset: number) => {
    const first = monthDate(selectedMonth);
    first.setMonth(first.getMonth() + offset);
    const month = toMonthKey(first);
    if (month < currentMonth || savingPolicy) return;
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
    setPolicyDraft({
      registration_start: `${month === currentMonth ? today : toLocalDateKey(first)} 00:00`,
      registration_end: `${toLocalDateKey(last)} 23:59`,
      locked: false,
    });
    setSelection("start");
  };

  const selectDay = (day: string) => {
    if (day < today || day.slice(0, 7) !== selectedMonth || savingPolicy)
      return;
    setPolicyDraft((previous) => {
      const start =
        selection === "start"
          ? day
          : startDay && startDay <= day && startDay >= today
            ? startDay
            : day;
      const end =
        selection === "end"
          ? day
          : endDay >= day && endDay.startsWith(selectedMonth)
            ? endDay
            : day;
      return {
        ...previous,
        registration_start: `${start} 00:00`,
        registration_end: `${end} 23:59`,
        locked: false,
      };
    });
    if (selection === "start") setSelection("end");
  };

  const beginEditing = () => {
    if (
      startDay < today ||
      startDay.slice(0, 7) !== endDay.slice(0, 7) ||
      !startDay
    )
      selectMonth(0);
    else setPolicyDraft((previous) => ({ ...previous, locked: false }));
  };

  return (
    <View className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={() => {
          if (!isOpen && (startDay < today || !activeMonth)) beginEditing();
          setIsOpen(!isOpen);
        }}
        className="flex-row items-center gap-3 p-5"
      >
        <View className="flex-1">
          <Text className="text-lg font-bold text-slate-900">
            Mở đăng ký theo tháng
          </Text>
          <Text className="mt-1 text-xs leading-5 text-slate-500">
            {activeMonth
              ? monthLabel(activeMonth)
              : "Chọn một tháng để nhận lịch nhân viên"}
          </Text>
        </View>
        <View
          className={`rounded-full px-3 py-1.5 ${isAccepting ? "bg-emerald-50" : "bg-slate-100"}`}
        >
          <Text
            className={`text-[10px] font-bold ${isAccepting ? "text-emerald-700" : "text-slate-600"}`}
          >
            {registrationStatus}
          </Text>
        </View>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color="#64748b"
        />
      </Pressable>

      {isOpen ? (
        <View className="border-t border-slate-100 p-4">
          <Text className="mb-4 text-xs leading-5 text-slate-500">
            Mỗi đợt chỉ nhận lịch của một tháng. Ngày đã qua được tô xám và
            không thể chọn.
          </Text>
          <WorkMonthCalendar
            visibleMonth={monthDate(selectedMonth)}
            entriesByDate={{}}
            selectedDate={
              new Date(
                `${(selection === "start" ? startDay : endDay) || today}T00:00:00`,
              )
            }
            onSelectDate={(day) => selectDay(toLocalDateKey(day))}
            onChangeMonth={selectMonth}
            minMonth={monthDate(currentMonth)}
            isDateDisabled={(day) =>
              toLocalDateKey(day) < today || savingPolicy || policyDraft.locked
            }
            highlightedDates={highlightedDates}
            showLegend={false}
            tone="admin"
          />
          <View className="mt-4 flex-row gap-3">
            {(["start", "end"] as const).map((field) => (
              <Pressable
                key={field}
                accessibilityRole="button"
                accessibilityState={{
                  selected: selection === field,
                  disabled: policyDraft.locked || savingPolicy,
                }}
                disabled={policyDraft.locked || savingPolicy}
                onPress={() => setSelection(field)}
                className={`flex-1 rounded-2xl border p-3 ${selection === field ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"}`}
              >
                <Text className="text-[10px] font-bold text-slate-500">
                  {field === "start" ? "NHẬN ĐĂNG KÝ TỪ" : "ĐẾN HẾT NGÀY"}
                </Text>
                <Text className="mt-1 text-sm font-bold text-slate-900">
                  {formatDay(field === "start" ? startDay : endDay)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text className="mt-3 text-xs leading-5 text-slate-500">
            {policyDraft.locked
              ? "Chọn Mở đợt đăng ký để thiết lập tháng và thời gian."
              : `Chạm ngày trên bảng để chọn ${selection === "start" ? "ngày bắt đầu" : "ngày kết thúc"}. Trong đợt này, nhân viên được đăng ký các ngày chưa qua của ${monthLabel(selectedMonth).toLowerCase()}.`}
          </Text>
          <View className="mt-4 flex-row gap-3">
            {policyDraft.locked ? (
              <Pressable
                disabled={savingPolicy}
                className="flex-1 items-center rounded-2xl bg-red-600 py-3.5"
                onPress={beginEditing}
              >
                <Text className="text-sm font-bold text-white">
                  Mở đợt đăng ký
                </Text>
              </Pressable>
            ) : (
              <Pressable
                disabled={savingPolicy}
                className={`flex-1 items-center rounded-2xl py-3.5 ${savingPolicy ? "bg-red-200" : "bg-red-600"}`}
                onPress={() => void handleSavePolicy()}
              >
                <Text className="text-sm font-bold text-white">
                  {savingPolicy ? "Đang lưu..." : "Lưu đợt đăng ký"}
                </Text>
              </Pressable>
            )}
            {policy && !policy.locked ? (
              <Pressable
                disabled={savingPolicy}
                className="items-center justify-center rounded-2xl bg-slate-100 px-4 py-3.5"
                onPress={() => void handleLockPolicy()}
              >
                <Text className="text-sm font-bold text-slate-700">
                  Dừng nhận
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
