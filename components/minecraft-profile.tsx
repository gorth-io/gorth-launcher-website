import { NavProfile } from "@/components/dashboard/nav-user";
import { Link } from "@gorth/primitive/cores/tanstack/router";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@gorth/primitive/default/card";
import { Button } from "@gorth/primitive/custom/button";
import { Input } from "@gorth/primitive/default/input";
import { Label } from "@gorth/primitive/default/label";
import { Spinner } from "@gorth/primitive/pattern/spinner";
import { toast } from "@gorth/primitive/custom/toast";
import { useAuthAccount } from "@/services/auth";
import { useProfile, useProfileMutation, useFriends } from "@/services/profile";
import { useSkins } from "@/services/skin";
import { SkinViewer } from "@/components/skin-viewer";
import { normalizeCallerError } from "@/utils/caller";

export function MinecraftProfile() {
  const account = useAuthAccount();
  const query = useProfile();
  const mutation = useProfileMutation();
  const skins = useSkins();
  const friends = useFriends();
  const incoming =
    friends.data?.items.filter(
      (item) => item.incoming && item.status === "requested",
    ).length ?? 0;
  const active = skins.data?.items.find((item) => item.isActive);
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Minecraft profile</CardTitle>
          <CardDescription>
            This game name is separate from your SSO username. Your UUID remains
            stable when renaming.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <NavProfile
              user={{
                name: account.data?.user.name ?? "User",
                email: account.data?.user.email,
                avatar: account.data?.user.image,
              }}
            />
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-bold tracking-tight">
                {query.data?.profile?.name ?? account.data?.user.name}
              </h1>
              <p className="break-all text-xs text-muted-foreground">
                {query.data?.profile?.id ?? "Create your game profile below."}
              </p>
            </div>
          </div>
          {query.isPending ? (
            <Spinner variant="infinite" className="size-6" />
          ) : query.isError ? (
            <p role="alert" className="text-sm text-destructive">
              Profile unavailable. Verify the dashboard database migration.
            </p>
          ) : (
            <form
              key={query.data?.profile?.name ?? "new"}
              className="mt-4 space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  await mutation.mutateAsync({
                    action: "name",
                    name: String(
                      new FormData(event.currentTarget).get("name") ?? "",
                    ),
                  });
                  toast.add({ type: "success", title: "Minecraft name saved" });
                } catch (error) {
                  toast.add({
                    type: "error",
                    title: normalizeCallerError(error).message,
                  });
                }
              }}
            >
              <Label htmlFor="minecraft-name">Minecraft name</Label>
              <Input
                id="minecraft-name"
                name="name"
                defaultValue={query.data?.profile?.name ?? ""}
                minLength={3}
                maxLength={16}
                pattern="[A-Za-z0-9_]{3,16}"
                required
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                3–16 letters, numbers or underscores. Changing it invalidates
                existing game sessions; the launcher refreshes before play.
              </p>
              <Button type="submit" disabled={mutation.isPending}>
                Save name
              </Button>
            </form>
          )}
          {query.data?.preferences.friendNotifications && incoming > 0 ? (
            <Link to="/account/friend" className="text-sm underline">
              {incoming} incoming friend request(s)
            </Link>
          ) : null}
          {query.data && !query.data.signingReady ? (
            <p className="text-sm text-muted-foreground">
              Online play needs the server texture-signing key configured. Your
              profile and skin library can still be managed.
            </p>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Active skin</CardTitle>
          <CardDescription>
            {query.data?.preferences.publicSkin
              ? "Published to the Gorth Minecraft skin system."
              : "Private preview. Enable publishing in Settings → Privacy to show this skin in Minecraft."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {active ? (
            <SkinViewer
              src={"/skin/file?id=" + active.id + "&preview=1"}
              name={active.name}
              model={active.model}
            />
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Upload and activate a skin in the Skin page.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
