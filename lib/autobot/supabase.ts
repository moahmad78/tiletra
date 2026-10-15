/**
 * Local Self-Hosted Client Stub
 * Replaces external Supabase SDK with zero-dependency safe mock
 * ensuring 100% self-hosted local operation without external cloud dependencies.
 */

function createMockQueryChain(): any {
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === "then") {
        return (resolve: (val: any) => void) => resolve({ data: null, error: null });
      }
      return () => new Proxy({}, handler);
    },
  };
  return new Proxy({}, handler);
}

export const supabaseAdmin: any = {
  from: (_table: string) => createMockQueryChain(),
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
  },
  channel: (_name: string) => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    subscribe: () => ({ unsubscribe: () => {} }),
  }),
  removeChannel: (_channel: any) => {},
};

export const supabase: any = supabaseAdmin;
