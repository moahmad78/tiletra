import { prisma as rawPrisma } from "./prisma";
import * as crypto from "crypto";
import * as http2 from "http2";

const prisma = rawPrisma as any;

export interface VoipPushOrderParams {
  vendorId: string;
  orderId: string;
  splitId?: string;
  totalAmount: number;
  customerArea?: string;
  itemsCount?: number;
  countdownSeconds?: number;
}

export interface VoipPushResult {
  success: boolean;
  status: "delivered" | "simulated" | "failed" | "no_tokens";
  tokensCount: number;
  error?: string;
}

/**
 * Creates an APNs authentication token (JWT) using ES256 algorithm.
 */
function generateApnsJwtToken(teamId: string, keyId: string, privateKey: string): string {
  const header = {
    alg: "ES256",
    kid: keyId,
  };
  const claims = {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedClaims = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signInput = `${encodedHeader}.${encodedClaims}`;

  const signer = crypto.createSign("sha256");
  signer.update(signInput);
  signer.end();

  const signature = signer.sign(privateKey, "base64url");
  return `${signInput}.${signature}`;
}

/**
 * Dispatches a PushKit VoIP push notification to the vendor's iOS device.
 * iOS wakes the app in the background and reports an incoming call via CallKit.
 */
export async function sendVoipPushToVendor(params: {
  vendorId: string;
  orderId: string;
  splitId?: string;
  totalAmount: number;
  customerArea?: string;
  itemsCount?: number;
  countdownSeconds?: number;
}): Promise<VoipPushResult> {
  const {
    vendorId,
    orderId,
    splitId,
    totalAmount,
    customerArea = "Customer Area",
    itemsCount = 1,
    countdownSeconds = 600,
  } = params;

  try {
    // 1. Resolve Vendor Owner User ID
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { ownerId: true, businessName: true },
    });

    if (!vendor?.ownerId) {
      return { success: false, status: "no_tokens", tokensCount: 0, error: "Vendor owner not found" };
    }

    // 2. Fetch registered VoIP tokens (platform = 'ios_voip')
    const voipTokens = await prisma.deviceToken.findMany({
      where: {
        userId: vendor.ownerId,
        platform: "ios_voip",
      },
      select: { token: true },
    });

    if (!voipTokens || voipTokens.length === 0) {
      console.log(`[VoIP Push] No iOS VoIP tokens registered for vendor ${vendorId}.`);
      return { success: false, status: "no_tokens", tokensCount: 0, error: "No VoIP tokens registered" };
    }

    const payload = {
      aps: {}, // Empty aps dictionary is standard for PushKit VoIP pushes
      orderId,
      splitId: splitId || orderId,
      amount: totalAmount,
      customerArea,
      itemsCount,
      timestamp: Date.now(),
      countdownSeconds,
    };

    const bundleId = process.env.IOS_BUSINESS_BUNDLE_ID || "com.intrihub.business";
    const apnsTopic = `${bundleId}.voip`; // Must be <bundle-id>.voip for PushKit

    const apnsKeyId = process.env.APNS_KEY_ID;
    const apnsTeamId = process.env.APNS_TEAM_ID;
    const apnsPrivateKey = process.env.APNS_PRIVATE_KEY;
    const isProduction = process.env.NODE_ENV === "production";
    const apnsHost = isProduction ? "api.push.apple.com" : "api.sandbox.push.apple.com";

    // 3. Check for APNs credentials
    if (!apnsKeyId || !apnsTeamId || !apnsPrivateKey) {
      console.warn(
        `[VoIP Push] APNs credentials (APNS_KEY_ID/APNS_TEAM_ID/APNS_PRIVATE_KEY) not set in environment. Simulated VoIP push for ${voipTokens.length} token(s).`
      );
      return {
        success: true,
        status: "simulated",
        tokensCount: voipTokens.length,
      };
    }

    // 4. Send HTTP/2 request to Apple Push Notification service
    const jwtToken = generateApnsJwtToken(apnsTeamId, apnsKeyId, apnsPrivateKey);

    const sendPromises = voipTokens.map(({ token }: { token: string }) => {
      return new Promise<boolean>((resolve) => {
        try {
          const client = http2.connect(`https://${apnsHost}:443`);

          client.on("error", (err) => {
            console.error(`[VoIP Push APNs HTTP/2 Error]`, err);
            resolve(false);
          });

          const req = client.request({
            ":method": "POST",
            ":path": `/3/device/${token}`,
            "authorization": `bearer ${jwtToken}`,
            "apns-topic": apnsTopic,
            "apns-push-type": "voip",
            "apns-priority": "10", // High priority: deliver immediately
            "apns-expiration": "60", // Expire after 60 seconds if device unreachable
          });

          req.setEncoding("utf8");

          let status = 0;
          req.on("response", (headers) => {
            status = Number(headers[":status"]);
          });

          req.on("end", () => {
            client.close();
            if (status === 200) {
              resolve(true);
            } else {
              console.warn(`[VoIP Push APNs Failed] Status: ${status} for device token: ${token.slice(0, 10)}...`);
              // Clean up unregistered token if APNs returns 410 BadDeviceToken
              if (status === 410) {
                prisma.deviceToken.deleteMany({ where: { token } }).catch(() => {});
              }
              resolve(false);
            }
          });

          req.on("error", (err) => {
            console.error(`[VoIP Push Request Error]`, err);
            client.close();
            resolve(false);
          });

          req.write(JSON.stringify(payload));
          req.end();
        } catch (dispatchErr) {
          console.error(`[VoIP Push Dispatch Exception]`, dispatchErr);
          resolve(false);
        }
      });
    });

    const results = await Promise.all(sendPromises);
    const deliveredCount = results.filter(Boolean).length;

    return {
      success: deliveredCount > 0,
      status: deliveredCount > 0 ? "delivered" : "failed",
      tokensCount: voipTokens.length,
    };
  } catch (error: any) {
    console.error(`[sendVoipPushToVendor Error]`, error);
    return {
      success: false,
      status: "failed",
      tokensCount: 0,
      error: error?.message || "Failed to dispatch VoIP push",
    };
  }
}
