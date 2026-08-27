import { Redirect } from "expo-router";
import { useAuthStore } from "../src/store/authStore";

export default function Index() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return null;
  }

  if (user?.role === "vendor") {
    return <Redirect href="/(vendor)/dashboard" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
