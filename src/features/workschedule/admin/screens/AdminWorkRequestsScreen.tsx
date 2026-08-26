import { AdminWorkRequestManager } from "@/src/features/workschedule/admin/ui/AdminWorkRequestManager";
import { ScreenHeader } from "@/src/shared/ui/ScreenHeader";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";

export default function AdminWorkRequestsScreen() {
  return (
    <View className="flex-1 bg-slate-950">
      <ScreenHeader
        onBack={() => router.back()}
        subtitle="Phê duyệt và theo dõi đơn của toàn bộ nhân sự"
        title="Duyệt đơn nhân sự"
      />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <AdminWorkRequestManager />
      </ScrollView>
    </View>
  );
}
