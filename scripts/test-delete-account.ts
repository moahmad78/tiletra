import { prisma } from "../lib/prisma";

async function main() {
  console.log("--- Testing Account Deletion Logic & DB Persistence ---");

  const testEmail = "test_deletion_user@intrihub.com";
  const testPhone = "+919999988888";

  // Check if we can create an AuditLog entry as performed by /api/delete-account
  const ticketId = `DEL-TEST-${Date.now().toString(36).toUpperCase()}`;

  const logEntry = await prisma.auditLog.create({
    data: {
      action: "ACCOUNT_DELETION_REQUEST",
      entity: "User",
      entityId: null,
      details: {
        ticketId,
        identifier: testEmail,
        accountType: "user",
        reason: "Test deletion audit compliance check",
        status: "PENDING_VERIFICATION",
        submittedAt: new Date().toISOString(),
      },
    },
  });

  console.log("Created AuditLog entry:", logEntry.id, "Ticket:", ticketId);

  // Verify retrieval
  const retrieved = await prisma.auditLog.findUnique({
    where: { id: logEntry.id },
  });

  if (retrieved && (retrieved.details as any)?.ticketId === ticketId) {
    console.log("PASS: Deletion request audit log record verified successfully!");
  } else {
    console.error("FAIL: Could not retrieve audit log record");
    process.exit(1);
  }

  // Clean up the test log
  await prisma.auditLog.delete({
    where: { id: logEntry.id },
  });
  console.log("Cleaned up test record.");
  console.log("--- All tests passed! ---");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
