import { Stack } from "expo-router";

export default function WorkscheduleAdminLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Admin lịch làm việc",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
