import ScheduleList from "@/components/workschedule/user/ScheduleList";
import { useWorkscheduleUser } from "@/hooks/useWorkscheduleUser";
import { IScheduleRequest } from "@/components/workschedule/types";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

export default function WorkscheduleUserDashboard() {
  const { getMySchedules, loading } = useWorkscheduleUser();
  const [schedules, setSchedules] = useState<IScheduleRequest[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadData = async () => {
        const data = await getMySchedules();
        if (isActive) {
          setSchedules(data);
          setInitialLoad(false);
        }
      };

      loadData();

      return () => {
        isActive = false;
      };
    }, [getMySchedules])
  );

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-bold">Danh sách lịch của tôi</Text>
          <Pressable
            onPress={() => router.push("/(main)/workschedule/user/create")}
            className="bg-blue-600 px-4 py-2 rounded-lg"
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text className="text-white font-medium">+ Đăng ký</Text>
          </Pressable>
        </View>

        {initialLoad && loading ? (
          <ActivityIndicator size="large" color="#2563eb" className="mt-10" />
        ) : (
          <ScheduleList schedules={schedules} />
        )}
      </ScrollView>
    </View>
  );
}
