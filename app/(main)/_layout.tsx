import { useAppData } from "@/context/AppContext";
import { API_ENDPOINTS, apiClient, createAuthHeaders } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Stack, router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAreaForRole } from "@/src/core/auth/roles";
import { getAreaRoutes } from "@/src/core/navigation/routes";

interface ScanResultType {
  success: boolean;
  message: string;
  data?: {
    check_in_at?: string;
    check_out_at?: string;
    date: string;
    schedule_type: string;
  };
}

export default function MainLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { loading, isAuth, logoutUser, user, getToken } = useAppData();
  const area = getAreaForRole(user?.role);
  const areaRoutes = getAreaRoutes(area);

  const [scanVisible, setScanVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);


  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResultType | null>(null);

  useEffect(() => {
    if (!loading && !isAuth) router.replace("/(auth)/login");
  }, [loading, isAuth]);

  const handleLogout = async () => {
    try {
      setProfileVisible(false);
      await logoutUser();
    } finally {
      router.replace("/(auth)/login");
      router.replace("/login");
    }
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || scanLoading) return;
    setScanned(true);
    setScanLoading(true);

    try {
      const token = await getToken();
      const response = await apiClient.post(
        API_ENDPOINTS.workschedule.attendanceScan,
        { token: data },
        { headers: createAuthHeaders(token) }
      );

      if (response.data?.success) {
        setScanResult({
          success: true,
          message: response.data.message || "Chấm công thành công!",
          data: response.data.data,
        });
      } else {
        setScanResult({
          success: false,
          message: response.data?.message || "Mã QR không hợp lệ hoặc đã hết hạn.",
        });
      }
    } catch (error: any) {
      console.warn("Attendance scan error:", error?.response?.data?.message || error?.message);
      setScanResult({
        success: false,
        message:
          error?.response?.data?.message ||
          "Không thể chấm công. Vui lòng thử lại.",
      });
    } finally {
      setScanLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScanResult(null);
  };

  const openScanner = async () => {
    resetScanner();
    setScanVisible(true);
    if (!permission?.granted) {
      await requestPermission();
    }
  };

  const isHomeActive = pathname.endsWith("/home");

  return (
    <View className="flex-1 bg-white">
      {!isHomeActive && (
        <View
          className="flex-row items-center justify-between px-4 border-b border-gray-100 bg-white shadow-xs"
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 8,
            minHeight: 56 + insets.top,
          }}
        >
          <Text className="text-xl font-extrabold text-slate-800 tracking-tight">
            Work<Text className="text-blue-600">Space</Text>
          </Text>

        </View>
      )}

      <View className="flex-1">
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="admin" />
          <Stack.Screen name="user" />
        </Stack>
      </View>


      <View
        className="flex-row items-center justify-around border-t border-gray-100 bg-white"
        style={{
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
          minHeight: 64 + insets.bottom,
        }}
      >
        <Pressable
          onPress={() => router.replace(areaRoutes.home)}
          className="items-center justify-center flex-1"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Ionicons
            name={isHomeActive ? "home" : "home-outline"}
            size={24}
            color={isHomeActive ? "#b91c1c" : "#94a3b8"} // matching red theme in image or gray
          />
          <Text
            className="text-[10px] mt-1 font-semibold"
            style={{ color: isHomeActive ? "#b91c1c" : "#64748b" }}
          >
            Trang chủ
          </Text>
        </Pressable>

        {/* Tab 2: Tiện ích (Schedules & Workspace utilities) */}
        {/* <Pressable
          onPress={() => router.push("/(main)/workschedule")}
          className="items-center justify-center flex-1"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Ionicons
            name={isWorkscheduleActive ? "grid" : "grid-outline"}
            size={24}
            color={isWorkscheduleActive ? "#b91c1c" : "#94a3b8"}
          />
          <Text
            className="text-[10px] mt-1 font-semibold"
            style={{ color: isWorkscheduleActive ? "#b91c1c" : "#64748b" }}
          >
            Tiện ích
          </Text>
        </Pressable> */}

        {/* Tab 3: Central Scan Button (Beautiful floating button) */}
        <View className="items-center justify-center flex-1 -mt-6">
          <Pressable
            onPress={openScanner}
            className="w-14 h-14 bg-red-600 rounded-2xl items-center justify-center shadow-lg shadow-red-500/40 active:scale-95"
            style={{
              elevation: 8,
            }}
          >
            <Ionicons name="scan" size={28} color="white" />
          </Pressable>
        </View>

        {/* Tab 4: Thông báo */}
        {/* <Pressable
          onPress={() => setNotifVisible(true)}
          className="items-center justify-center flex-1"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Ionicons
            name={notifVisible ? "notifications" : "notifications-outline"}
            size={24}
            color={notifVisible ? "#b91c1c" : "#94a3b8"}
          />
          <Text
            className="text-[10px] mt-1 font-semibold"
            style={{ color: notifVisible ? "#b91c1c" : "#64748b" }}
          >
            Thông báo
          </Text>
        </Pressable> */}

        <Pressable
          onPress={() => setProfileVisible(true)}
          className="items-center justify-center flex-1"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Ionicons
            name={profileVisible ? "person" : "person-outline"}
            size={24}
            color={profileVisible ? "#b91c1c" : "#94a3b8"}
          />
          <Text
            className="text-[10px] mt-1 font-semibold"
            style={{ color: profileVisible ? "#b91c1c" : "#64748b" }}
          >
            Cá nhân
          </Text>
        </Pressable>
      </View>

      <Modal
        animationType="slide"
        transparent={false}
        visible={scanVisible}
        onRequestClose={() => setScanVisible(false)}
      >
        <View className="flex-1 bg-slate-950">
          <View
            className="flex-row items-center justify-between px-4 pb-4 pt-10 border-b border-slate-900 bg-slate-950"
            style={{ paddingTop: insets.top + 8 }}
          >
            <Text className="text-white text-lg font-extrabold tracking-wide">
              QUÉT MÃ CHẤM CÔNG
            </Text>
            <Pressable
              onPress={() => setScanVisible(false)}
              className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center active:opacity-75"
            >
              <Ionicons name="close" size={20} color="white" />
            </Pressable>
          </View>

          <View className="flex-1 relative justify-center items-center">
            {!permission?.granted ? (
              <View className="p-6 items-center justify-center">
                <View className="w-16 h-16 bg-red-950 rounded-full items-center justify-center mb-4">
                  <Ionicons name="camera-outline" size={32} color="#ef4444" />
                </View>
                <Text className="text-white text-lg font-bold text-center mb-2">
                  Yêu cầu quyền truy cập Camera
                </Text>
                <Text className="text-slate-400 text-sm text-center mb-6 max-w-xs">
                  Ứng dụng cần sử dụng camera của thiết bị để thực hiện quét mã QR chấm công.
                </Text>
                <Pressable
                  onPress={requestPermission}
                  className="bg-red-600 px-6 py-3 rounded-xl active:opacity-75"
                >
                  <Text className="text-white font-bold">Cấp quyền camera</Text>
                </Pressable>
              </View>
            ) : (
              <View className="w-full h-full justify-center items-center">
                {!scanned && (
                  <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                    barcodeScannerSettings={{
                      barcodeTypes: ["qr"],
                    }}
                  />
                )}


                {!scanned && (
                  <View className="absolute items-center justify-center">
                    <View className="w-64 h-64 border-2 border-red-500 rounded-3xl items-center justify-center">
                      <View className="w-60 h-60 border border-red-500/20 border-dashed rounded-2xl" />
                    </View>
                    <Text className="text-white text-xs font-medium text-center mt-6 bg-slate-900/80 px-4 py-2 rounded-full overflow-hidden">
                      Di chuyển mã QR vào giữa khung hình để quét
                    </Text>
                  </View>
                )}

                {scanLoading && (
                  <View className="absolute inset-0 bg-slate-950/80 items-center justify-center">
                    <ActivityIndicator size="large" color="#ef4444" />
                    <Text className="text-white text-sm font-semibold mt-4">
                      Đang xử lý thông tin chấm công...
                    </Text>
                  </View>
                )}

                {scanResult && (
                  <View className="absolute p-6 w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl items-center">
                    <View
                      className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${scanResult.success ? "bg-emerald-950" : "bg-rose-950"
                        }`}
                    >
                      <Ionicons
                        name={
                          scanResult.success
                            ? "checkmark-circle"
                            : "alert-circle"
                        }
                        size={40}
                        color={scanResult.success ? "#10b981" : "#f43f5e"}
                      />
                    </View>

                    <Text className="text-white text-lg font-bold text-center mb-1">
                      {scanResult.success ? "Chấm Công Thành Công" : "Chấm Công Thất Bại"}
                    </Text>

                    <Text className="text-slate-300 text-sm text-center mb-6">
                      {scanResult.message}
                    </Text>

                    {scanResult.success && scanResult.data && (
                      <View className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-6">
                        <View className="flex-row justify-between mb-2">
                          <Text className="text-slate-400 text-xs">Loại lịch</Text>
                          <Text className="text-white text-xs font-bold uppercase">
                            {scanResult.data.schedule_type === "office"
                              ? "Lên văn phòng (Office)"
                              : scanResult.data.schedule_type === "remote"
                              ? "Làm việc từ xa (Remote)"
                              : scanResult.data.schedule_type}
                          </Text>
                        </View>
                        {scanResult.data.check_in_at && (
                          <View className="flex-row justify-between mb-2">
                            <Text className="text-slate-400 text-xs">Giờ Check-in</Text>
                            <Text className="text-emerald-400 text-xs font-bold">
                              {new Date(scanResult.data.check_in_at).toLocaleTimeString(
                                "vi-VN"
                              )}
                            </Text>
                          </View>
                        )}
                        {scanResult.data.check_out_at && (
                          <View className="flex-row justify-between">
                            <Text className="text-slate-400 text-xs">Giờ Check-out</Text>
                            <Text className="text-blue-400 text-xs font-bold">
                              {new Date(scanResult.data.check_out_at).toLocaleTimeString(
                                "vi-VN"
                              )}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    <View className="flex-row w-full space-x-3">
                      {!scanResult.success && (
                        <Pressable
                          onPress={resetScanner}
                          className="flex-1 bg-slate-800 py-3.5 rounded-xl items-center active:opacity-75"
                        >
                          <Text className="text-white font-bold text-sm">Quét lại</Text>
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => setScanVisible(false)}
                        className={`flex-1 py-3.5 rounded-xl items-center active:opacity-75 ${scanResult.success ? "bg-emerald-600" : "bg-rose-600"
                          }`}
                      >
                        <Text className="text-white font-bold text-sm">Đóng</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>


      <Modal
        animationType="fade"
        transparent={true}
        visible={notifVisible}
        onRequestClose={() => setNotifVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <Pressable className="absolute inset-0" onPress={() => setNotifVisible(false)} />

          <View className="bg-white rounded-t-3xl p-6 min-h-[400px] border-t border-slate-100">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                <Ionicons name="notifications" size={24} color="#b91c1c" />
                <Text className="text-lg font-black ml-2 text-slate-800">
                  Thông báo của tôi
                </Text>
              </View>
              <Pressable
                onPress={() => setNotifVisible(false)}
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center active:opacity-75"
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="max-h-[300px]" showsVerticalScrollIndicator={false}>
              <View className="flex-row p-4 bg-slate-50 rounded-2xl mb-3 items-start border border-slate-100">
                <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center mr-3 mt-0.5">
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-800">
                    Chấm công thành công
                  </Text>
                  <Text className="text-xs text-slate-500 mt-1">
                    Hệ thống ghi nhận bạn đã chấm công lên văn phòng (Check-in) hôm nay.
                  </Text>
                  <Text className="text-[10px] text-slate-400 mt-2 font-medium">
                    Hôm nay, 08:31 AM
                  </Text>
                </View>
              </View>

              <View className="flex-row p-4 bg-slate-50 rounded-2xl mb-3 items-start border border-slate-100">
                <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3 mt-0.5">
                  <Ionicons name="calendar" size={20} color="#2563eb" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-800">
                    Lịch làm việc đã duyệt
                  </Text>
                  <Text className="text-xs text-slate-500 mt-1">
                    Lịch đăng ký làm việc tuần tới của bạn đã được quản lý phê duyệt thành công.
                  </Text>
                  <Text className="text-[10px] text-slate-400 mt-2 font-medium">
                    Hôm qua, 04:15 PM
                  </Text>
                </View>
              </View>

              <View className="flex-row p-4 bg-slate-50 rounded-2xl mb-3 items-start border border-slate-100">
                <View className="w-10 h-10 rounded-full bg-rose-50 items-center justify-center mr-3 mt-0.5">
                  <Ionicons name="alert-circle" size={20} color="#e11d48" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-800">
                    Nhắc nhở đăng ký lịch
                  </Text>
                  <Text className="text-xs text-slate-500 mt-1">
                    Vui lòng gửi tờ trình đăng ký lịch làm việc văn phòng cho tuần kế tiếp trước 17:00 ngày Thứ Sáu.
                  </Text>
                  <Text className="text-[10px] text-slate-400 mt-2 font-medium">
                    2 ngày trước
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>


      <Modal
        animationType="fade"
        transparent={true}
        visible={profileVisible}
        onRequestClose={() => setProfileVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <Pressable className="absolute inset-0" onPress={() => setProfileVisible(false)} />

          <View className="bg-white rounded-t-3xl p-6 min-h-[420px] border-t border-slate-100 items-center">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full mb-6" />


            <View className="flex-row justify-between w-full items-center mb-6">
              <Text className="text-lg font-black text-slate-800">Cá nhân</Text>
              <Pressable
                onPress={() => setProfileVisible(false)}
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center active:opacity-75"
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </Pressable>
            </View>


            <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
              <Text className="text-red-700 text-3xl font-black">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>

            <Text className="text-xl font-bold text-slate-800">{user?.name || "Người dùng"}</Text>
            <View className="bg-slate-100 px-3 py-1 rounded-full mt-1.5 mb-6">
              <Text className="text-slate-600 text-xs font-semibold capitalize">
                Vai trò: {area === "admin" ? "Khối quản trị" : "Nhân viên"}
              </Text>
            </View>


            <View className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
              <View className="flex-row items-center justify-between border-b border-slate-200/60 pb-3 mb-3">
                <Text className="text-slate-400 text-xs">Email tài khoản</Text>
                <Text className="text-slate-800 text-sm font-semibold">{user?.email || "Chưa cập nhật"}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-slate-400 text-xs">Mã nhân viên (ID)</Text>
                <Text className="text-slate-800 text-xs font-mono font-bold">{user?._id || "Chưa cập nhật"}</Text>
              </View>
            </View>


            <Pressable
              onPress={handleLogout}
              className="w-full bg-red-600 py-3.5 rounded-xl items-center flex-row justify-center active:opacity-90 shadow-sm"
            >
              <Ionicons name="log-out-outline" size={20} color="white" />
              <Text className="text-white font-bold text-sm ml-2">Đăng xuất khỏi hệ thống</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
