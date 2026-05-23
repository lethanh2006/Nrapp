import { Redirect } from "expo-router";
import React from "react";

export default function CreateScheduleScreenRedirect() {
  return <Redirect href="/(main)/workschedule/user" />;
}
