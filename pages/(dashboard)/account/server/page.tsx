import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@gorth/primitive/default/card";
export default function ServerPage() {
  const root = new URL("/minecraft", window.location.origin).href;
  return (
    <Card>
      <CardHeader>
        <CardTitle>For servers</CardTitle>
        <CardDescription>
          Gorth uses its own Minecraft identity domain. It is not a
          Microsoft/Mojang account or a licence bypass.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          Configure authlib-injector on the client and participating server with
          this root:
        </p>
        <code className="block break-all rounded-md bg-muted p-3">{root}</code>
        <p>
          The desktop launcher verifies and downloads authlib-injector, then
          adds the Java agent when starting a Gorth online profile.
        </p>
        <p>Server launch argument:</p>
        <code className="block break-all rounded-md bg-muted p-3">
          -javaagent:/absolute/path/authlib-injector.jar={root}
        </code>
        <p>
          Use online-mode=true on participating servers. Newer Minecraft
          versions may require enforce-secure-profile=false because this service
          does not issue Mojang chat-signing certificates. Review that server
          policy before deploying.
        </p>
        <p>
          Use prevent-proxy-connections=false: trusted client-IP attestation is
          not available at this serverless boundary; requests that require an IP
          match are rejected instead of trusting spoofable forwarding headers.
        </p>
        <p>
          Deployment requires the dashboard migration, a stable private RSA
          texture-signing key and HTTPS. Never distribute that private key with
          the server or client. Public skin delivery also requires explicit
          Privacy opt-in from the profile owner.
        </p>
      </CardContent>
    </Card>
  );
}
