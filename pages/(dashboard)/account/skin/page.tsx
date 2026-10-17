import { SkinManager } from "@/components/skin-manager";
export default function SkinPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Skin</h1>
      <p className="text-sm text-muted-foreground">
        Upload, preview and activate your Minecraft skin. Uploads and activation
        remain private. Publish the active texture only if you choose to in
        Settings → Privacy.
      </p>
      <SkinManager />
    </>
  );
}
