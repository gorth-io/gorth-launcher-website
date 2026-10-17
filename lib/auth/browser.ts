import { oauthCookiePrefix } from "@/utils/client-environment";
import { createAuthClient } from "better-auth/react";
import { electronProxyClient } from "@better-auth/electron/proxy";
import { electronClientId, electronScheme } from "@/lib/auth/contract";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { getAuth } from "@/lib/auth/server";

export const authClient = createAuthClient({
  basePath: "/auth",
  sessionOptions: { refetchInterval: 0 },
  plugins: [
    inferAdditionalFields<ReturnType<typeof getAuth>>(),
    electronProxyClient({
      clientID: electronClientId,
      cookiePrefix: oauthCookiePrefix,
      protocol: { scheme: electronScheme },
    }),
  ],
});
