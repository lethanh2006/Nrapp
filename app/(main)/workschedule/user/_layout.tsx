import { Stack } from "expo-router";

export default function WorkscheduleUserLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Lịch làm việc",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: "Đăng ký lịch tuần",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Chi tiết lịch",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
