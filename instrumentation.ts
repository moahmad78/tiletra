export async function register() {
  // Self-hosted local environment initialization hook
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { verifyTransporterStartup } = await import("@/lib/mail");
      verifyTransporterStartup().catch((err) => {
        console.warn("[instrumentation] Mail transporter startup check notice:", err);
      });
    } catch {
      // Ignored if mail module fails to load during builds
    }
  }
}
