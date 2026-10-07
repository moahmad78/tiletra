/**
 * Module Mocking for Next.js Server Components / Actions ("next/headers").
 * Allows test suites to simulate cookies and headers without touching any production auth code.
 */

const cookieStore = new Map<string, string>();
const headerStore = new Map<string, string>();

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nextHeaders = require("next/headers");

  nextHeaders.cookies = async () => ({
    get: (name: string) => {
      const val = cookieStore.get(name);
      return val !== undefined ? { name, value: val } : undefined;
    },
    getAll: () => {
      return Array.from(cookieStore.entries()).map(([name, value]) => ({ name, value }));
    },
    has: (name: string) => cookieStore.has(name),
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
  });

  nextHeaders.headers = async () => ({
    get: (name: string) => headerStore.get(name.toLowerCase()) || null,
    has: (name: string) => headerStore.has(name.toLowerCase()),
    entries: () => headerStore.entries(),
  });
} catch (err) {
  console.warn("Could not hook next/headers directly:", err);
}

export function setTestCookie(name: string, value: string): void {
  cookieStore.set(name, value);
}

export function clearTestCookies(): void {
  cookieStore.clear();
}

export function setTestHeader(name: string, value: string): void {
  headerStore.set(name.toLowerCase(), value);
}

export function clearTestHeaders(): void {
  headerStore.clear();
}
