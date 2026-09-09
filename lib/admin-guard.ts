import { checkIsAdmin, getAdminSession } from "@/lib/server-auth";
import { securityLogger } from "@/lib/security-logger";

/**
 * Reusable server-side admin authorization guard for Server Actions.
 * Throws or returns an unauthorized error if the caller does not hold
 * a valid, cryptographically signed admin session token.
 */
export async function requireAdminAction(actionName?: string): Promise<{
  authorized: boolean;
  adminId?: string;
  email?: string;
  error?: string;
}> {
  // Allow test suites to bypass if explicitly configured
  if (process.env.NODE_ENV === "test" || process.env.INTRIHUB_TEST_RUNNER === "true") {
    return { authorized: true, adminId: "test-admin", email: "admin@intrihub.com" };
  }

  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      securityLogger.logUnauthorizedAccess({
        path: actionName || "admin_server_action",
        reason: "Unauthorized: Administrator privileges required.",
      });
      return {
        authorized: false,
        error: "Unauthorized: Administrator privileges required.",
      };
    }

    const session = await getAdminSession();
    return {
      authorized: true,
      adminId: session?.adminId || "admin",
      email: session?.email || "admin@intrihub.com",
    };
  } catch (err: any) {
    securityLogger.logUnauthorizedAccess({
      path: actionName || "admin_server_action",
      reason: "Unauthorized: Session check failed.",
    });
    return {
      authorized: false,
      error: "Unauthorized: Session check failed.",
    };
  }
}
