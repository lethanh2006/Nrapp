import { canManageWorkSchedule } from "@/src/application/access/roles";
import { useAuthSession } from "@/src/features/auth/model/AuthSessionContext";
import WorkscheduleScreen from "@/src/features/workschedule/screens/WorkscheduleScreen";

export default function AdminWorkscheduleRoute() {
  const { user } = useAuthSession();
  return (
    <WorkscheduleScreen
      area="admin"
      managementMode={canManageWorkSchedule(user?.role)}
    />
  );
}
