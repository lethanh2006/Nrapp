import type { AppArea } from "@/src/application/access/roles";
import AdminWorkscheduleScreen from "@/src/features/workschedule/screens/AdminWorkscheduleScreen";
import UserWorkscheduleScreen from "@/src/features/workschedule/screens/UserWorkscheduleScreen";

export default function WorkscheduleScreen({ area }: { area: AppArea }) {
  return area === "admin" ? (
    <AdminWorkscheduleScreen />
  ) : (
    <UserWorkscheduleScreen />
  );
}
