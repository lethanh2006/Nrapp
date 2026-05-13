import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
  Pressable,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { AdminProvider, useAdminData } from "../../../../context/AdminContext";

import { PolicySection } from "@/components/workschedule/admin/PolicySection";
import { AttendanceQR } from "@/components/workschedule/admin/AttendanceQR";
import { RequestManager } from "@/components/workschedule/admin/RequestManager";
import { ReportSummary } from "@/components/workschedule/admin/ReportSummary";
import { WorkHeatmap } from "@/components/workschedule/admin/WorkHeatmap";
import { StatCard } from "@/components/workschedule/admin/StatCard";

type TabType = "system" | "requests" | "reports";

function AdminDashboardContent() {
  const {
    appLoading,
    initialLoading,
    user,
    refreshing,
    loadAdminData,
    pendingSchedules,
    totalTodayCheckedIn,
    totalTodayMissing,
    reportRows,
  } = useAdminData();

  const [activeTab, setActiveTab] = useState<TabType>("requests");

  useFocusEffect(
    React.useCallback(() => {
      loadAdminData();
    }, [loadAdminData]),
  );

  const handleRefresh = async () => {
    await loadAdminData(true);
  };

  if (appLoading || initialLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#0ea5e9"
          />
        }
      >
        {/* Header Overview */}
        <View className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm shadow-slate-100">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="text-xs uppercase tracking-[3px] text-cyan-600 font-bold">
                Workschedule
              </Text>
              <Text className="text-3xl font-bold text-slate-900 mt-2">
                Quản trị lịch làm việc
              </Text>
              <Text className="text-slate-500 mt-2 leading-5">
                Quản lý chính sách, duyệt lịch, tạo QR chấm công và theo dõi báo
                cáo.
              </Text>
            </View>
            <View className="bg-slate-50 rounded-2xl px-3 py-2 border border-slate-200">
              <Text className="text-slate-500 text-xs uppercase tracking-[2px]">
                Role
              </Text>
              <Text className="text-slate-900 font-semibold mt-1">
                {user?.role || "admin"}
              </Text>
            </View>
          </View>

          <View className="flex-row flex-wrap mt-5" style={{ gap: 10 }}>
            <StatCard
              title="Chờ duyệt"
              value={pendingSchedules.length}
            />
            <StatCard
              title="Đã check-in"
              value={totalTodayCheckedIn}
            />
            <StatCard
              title="Thiếu hôm nay"
              value={totalTodayMissing}
              containerStyle="bg-rose-50 border-rose-100"
              titleStyle="text-rose-600"
              valueStyle="text-rose-900"
            />
            <StatCard
              title="Báo cáo"
              value={reportRows.length}
            />
          </View>
        </View>

        {/* Custom Top Tab Bar */}
        <View className="flex-row rounded-2xl bg-slate-200 p-1 mb-2">
          <Pressable
            onPress={() => setActiveTab("requests")}
            className={`flex-1 py-3 items-center rounded-xl ${activeTab === "requests" ? "bg-white shadow-sm" : ""}`}
          >
            <Text className={`font-semibold ${activeTab === "requests" ? "text-slate-900" : "text-slate-500"}`}>
              Duyệt Lịch
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("system")}
            className={`flex-1 py-3 items-center rounded-xl ${activeTab === "system" ? "bg-white shadow-sm" : ""}`}
          >
            <Text className={`font-semibold ${activeTab === "system" ? "text-slate-900" : "text-slate-500"}`}>
              Hệ thống
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("reports")}
            className={`flex-1 py-3 items-center rounded-xl ${activeTab === "reports" ? "bg-white shadow-sm" : ""}`}
          >
            <Text className={`font-semibold ${activeTab === "reports" ? "text-slate-900" : "text-slate-500"}`}>
              Báo cáo
            </Text>
          </Pressable>
        </View>

        {/* Tab Content */}
        {activeTab === "system" && (
          <View style={{ gap: 16 }}>
            <PolicySection />
            <AttendanceQR />
          </View>
        )}

        {activeTab === "requests" && (
          <RequestManager />
        )}

        {activeTab === "reports" && (
          <View style={{ gap: 16 }}>
            <ReportSummary />
            {/* <WorkHeatmap /> */}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default function WorkscheduleAdminScreen() {
  return (
    <AdminProvider>
      <AdminDashboardContent />
    </AdminProvider>
  );
}
