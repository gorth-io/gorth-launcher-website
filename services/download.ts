import "server-only";
import {
  downloadLinuxX64Url,
  downloadMacosArm64Url,
  downloadMacosX64Url,
  downloadWindowsX64Url,
  nodeEnv,
} from "@/utils/environment";
import type { DownloadOption } from "@/utils/interface";

function publicDownload(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const local = ["localhost", "127.0.0.1"].includes(url.hostname);
    if (
      url.username ||
      url.password ||
      (url.protocol !== "https:" &&
        !(nodeEnv !== "production" && local && url.protocol === "http:"))
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}

// Public downloads remain available before a release database is provisioned.
// Replace this catalog with a query on database/schema.ts releaseTable when publishing.
export function getDownloads(): DownloadOption[] {
  return [
    {
      id: "macos-arm64",
      platform: "macos",
      architecture: "arm64",
      label: "macOS · Apple Silicon",
      description:
        "For Macs with an Apple Silicon chip. Select the download that matches your device.",
      url: publicDownload(downloadMacosArm64Url),
    },
    {
      id: "macos-x64",
      platform: "macos",
      architecture: "x64",
      label: "macOS · Intel",
      description:
        "For Intel-based Macs. Distributed as a desktop application.",
      url: publicDownload(downloadMacosX64Url),
    },
    {
      id: "windows-x64",
      platform: "windows",
      architecture: "x64",
      label: "Windows",
      description:
        "For 64-bit Windows PCs. Installation instructions will accompany the release.",
      url: publicDownload(downloadWindowsX64Url),
    },
    {
      id: "linux-x64",
      platform: "linux",
      architecture: "x64",
      label: "Linux",
      description:
        "For 64-bit Linux desktops. Package format depends on the published release.",
      url: publicDownload(downloadLinuxX64Url),
    },
  ];
}
