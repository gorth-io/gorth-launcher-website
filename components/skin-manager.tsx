import { useEffect, useState } from "react";
import { SkinViewer } from "@/components/skin-viewer";
import { Palette } from "@gorth/primitive/cores/lucide";
import { Spinner } from "@gorth/primitive/pattern/spinner";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@gorth/primitive/default/empty";
import { Link } from "@gorth/primitive/cores/tanstack/router";
import { normalizeCallerError } from "@/utils/caller";
import { Button } from "@gorth/primitive/custom/button";
import { Input } from "@gorth/primitive/default/input";
import { Label } from "@gorth/primitive/default/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@gorth/primitive/default/card";
import {
  Select,
  SelectGroup,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gorth/primitive/custom/select";
import { useSkins, useSkinMutation } from "@/services/skin";
export function SkinManager() {
  const query = useSkins();
  const mutation = useSkinMutation();
  const [model, setModel] = useState<"classic" | "slim">("classic");
  const [selectedId, setSelectedId] = useState("");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const selected =
    query.data?.items.find((item) => item.id === selectedId) ??
    query.data?.items.find((item) => item.isActive) ??
    query.data?.items[0];
  useEffect(
    () => () => {
      if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    },
    [uploadPreview],
  );
  const [message, setMessage] = useState("");
  async function run(input: Parameters<typeof mutation.mutateAsync>[0]) {
    setMessage("");
    try {
      await mutation.mutateAsync(input);
      setMessage("Saved.");
      return true;
    } catch (error) {
      setMessage(normalizeCallerError(error).message);
      return false;
    }
  }
  return (
    <div className="space-y-6">
      {uploadPreview || selected ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {uploadPreview ? "Upload preview" : selected?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SkinViewer
              src={
                uploadPreview ?? "/skin/file?id=" + selected!.id + "&preview=1"
              }
              model={uploadPreview ? model : selected!.model}
              name={uploadPreview ? "New skin preview" : selected!.name}
            />
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Upload a skin</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              data.set("model", model);
              if (await run({ action: "upload", data })) {
                form.reset();
                setUploadPreview(null);
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="skin-name">Name</Label>
              <Input
                id="skin-name"
                name="name"
                required
                maxLength={80}
                placeholder="My skin"
              />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Select
                value={model}
                onValueChange={(value) => {
                  if (value === "classic" || value === "slim") setModel(value);
                }}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="slim">Slim</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skin-file">PNG file</Label>
              <Input
                id="skin-file"
                name="file"
                type="file"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  setUploadPreview(file ? URL.createObjectURL(file) : null);
                }}
                accept="image/png"
                required
              />
              <p className="text-xs text-muted-foreground">
                64×64 pixels · Classic also supports 64×32 · Maximum 256 KB
              </p>
            </div>
            <Button
              className="self-end"
              type="submit"
              disabled={mutation.isPending}
            >
              Upload
            </Button>
          </form>
          <p aria-live="polite" className="mt-3 text-sm">
            {message}
          </p>
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">
        Uploads remain private. Choose an active skin, then explicitly enable
        publishing in Settings → Privacy to make it available to Minecraft
        clients. Website SSO alone is not a Minecraft game session.
      </p>
      {query.isPending && (
        <div
          role="status"
          aria-label="Loading skins"
          className="flex justify-center py-8"
        >
          <Spinner variant="infinite" className="size-8" />
        </div>
      )}
      {query.isError && (
        <p role="alert">
          Unable to load skins. Check your session and database configuration.
        </p>
      )}
      {query.data?.items.length === 0 && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Palette />
            </EmptyMedia>
            <EmptyTitle>No skins yet</EmptyTitle>
            <EmptyDescription>
              Upload a PNG skin using the form above to start your collection.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {query.data?.items.map((skin) => (
          <Card key={skin.id}>
            <CardHeader>
              <CardTitle className="truncate">{skin.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <img
                src={"/skin/file?id=" + skin.id + "&preview=1"}
                alt={skin.name + " texture"}
                width={128}
                height={128}

                className="mx-auto object-contain [image-rendering:pixelated]"
              />
              <p className="text-sm text-muted-foreground">
                {skin.model} {skin.isActive && "· Active"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadPreview(null);
                    setSelectedId(skin.id);
                  }}
                >
                  Preview 3D
                </Button>
                <Button
                  className="h-9"
                  disabled={skin.isActive || mutation.isPending}
                  onClick={() => void run({ action: "activate", id: skin.id })}
                >
                  Use skin
                </Button>
                <Button
                  nativeButton={false}
                  className="h-9"
                  variant="outline"
                  render={<Link to={"/skin/file?id=" + skin.id} />}
                >
                  Download
                </Button>
                <Button
                  className="h-9"
                  variant="outline"
                  disabled={mutation.isPending}
                  onClick={() => {
                    if (window.confirm("Delete this skin?"))
                      void run({ action: "delete", id: skin.id });
                  }}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
