import { checkIsAdmin, getAdminSession } from "@/lib/server-auth";
import { getCpoSession } from "@/lib/cpo/auth";
import { evaluateCpoAction } from "@/lib/config/cpo-permissions";
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
    if (isAdmin) {
      const session = await getAdminSession();
      return {
        authorized: true,
        adminId: session?.adminId || "admin",
        email: session?.email || "admin@intrihub.com",
      };
    }

    // Check CPO Session
    const cpo = await getCpoSession();
    if (cpo) {
      const checkAction = actionName || "categories:manage";
      const evalResult = evaluateCpoAction(checkAction);
      if (evalResult.allowed) {
        return {
          authorized: true,
          adminId: cpo.userId,
          email: cpo.email,
        };
      } else {
        securityLogger.logUnauthorizedAccess({
          path: actionName || "cpo_action_blocked",
          reason: evalResult.reason || "Action blocked for CPO role.",
        });
        return {
          authorized: false,
          error: evalResult.reason || "Forbidden: Action not permitted for CPO role.",
        };
      }
    }

    securityLogger.logUnauthorizedAccess({
      path: actionName || "admin_server_action",
      reason: "Unauthorized: Administrator or CPO privileges required.",
    });
    return {
      authorized: false,
      error: "Unauthorized: Administrator or CPO privileges required.",
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
