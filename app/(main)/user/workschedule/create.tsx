import { Redirect, type Href } from "expo-router";

export default function CreateWorkscheduleRedirect() {
  return <Redirect href={"/(main)/user/workschedule" as Href} />;
}
