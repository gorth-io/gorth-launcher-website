import { useState } from "react";
import { Link } from "@gorth/primitive/cores/tanstack/router";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@gorth/primitive/custom/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@gorth/primitive/default/card";
import { Button } from "@gorth/primitive/custom/button";
import { Label } from "@gorth/primitive/default/label";
import { Switch } from "@gorth/primitive/default/switch";
import {
  Select,
  SelectTrigger,
  SelectGroup,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@gorth/primitive/custom/select";
import { Spinner } from "@gorth/primitive/pattern/spinner";
import { toast } from "@gorth/primitive/custom/toast";
import { useProfile, useProfileMutation } from "@/services/profile";
import { authUrl } from "@/utils/client-environment";
import { normalizeCallerError } from "@/utils/caller";
import type { ProfilePreferences } from "@/schemas/profile";
function SettingsForm({ initial }: { initial: ProfilePreferences }) {
  const [preferences, setPreferences] = useState(initial);
  const mutation = useProfileMutation();
  return (
    <form
      className="space-y-6"
      onSubmit={async (event) => {
        event.preventDefault();
        try {
          await mutation.mutateAsync({ action: "preferences", preferences });
          toast.add({ type: "success", title: "Preferences saved" });
        } catch (error) {
          toast.add({
            type: "error",
            title: normalizeCallerError(error).message,
          });
        }
      }}
    >
      <Tabs defaultValue="general">
        <TabsList className="max-w-full justify-start overflow-x-auto">
          {["General", "Account", "Privacy", "Notifications"].map((title) => (
            <TabsTrigger key={title} value={title.toLowerCase()}>
              {title}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>
                Profile communication language; the current interface is
                English.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="language">Preferred language</Label>
              <Select
                value={preferences.language}
                onValueChange={(value) => {
                  if (value === "en" || value === "vi")
                    setPreferences((current) => ({
                      ...current,
                      language: value,
                    }));
                }}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Password, email and security belong to the central SSO account.
                Change your Minecraft name on Profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Button
                  nativeButton={false}
                  variant="outline"
                  render={<Link to={new URL("/settings", authUrl).href} />}
                >
                  Open SSO settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
              <CardDescription>
                Your game name is public. Skin textures stay private until you
                explicitly enable publishing here; cached public copies cannot
                be recalled.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="allow-friends">Allow friend requests</Label>
                <Switch
                  id="allow-friends"
                  checked={preferences.allowFriendRequests}
                  onCheckedChange={(value) =>
                    setPreferences((current) => ({
                      ...current,
                      allowFriendRequests: value,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="public-skin">
                  Publish my active skin for Minecraft
                </Label>
                <Switch
                  id="public-skin"
                  checked={preferences.publicSkin}
                  onCheckedChange={(value) =>
                    setPreferences((current) => ({
                      ...current,
                      publicSkin: value,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Show incoming friend activity on this website. This does not
                subscribe you to email or push delivery.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="friend-notifications">Friend activity</Label>
                <Switch
                  id="friend-notifications"
                  checked={preferences.friendNotifications}
                  onCheckedChange={(value) =>
                    setPreferences((current) => ({
                      ...current,
                      friendNotifications: value,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Button type="submit" disabled={mutation.isPending}>
        Save settings
      </Button>
    </form>
  );
}
export function ProfileSettings() {
  const query = useProfile();
  return query.isPending ? (
    <Spinner variant="infinite" className="mx-auto size-8" />
  ) : query.data ? (
    <SettingsForm initial={query.data.preferences} />
  ) : (
    <p role="alert">
      Unable to load preferences. Check your session and dashboard database
      migration.
    </p>
  );
}
