import "server-only";
import {
  downloadLinuxX64Url,
  downloadLinuxX64RpmUrl,
  downloadMacosArm64Url,
  downloadMacosX64Url,
  downloadWindowsX64Url,
  downloadWindowsX64MsiUrl,
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
// URLs are public GitHub release assets configured by the deployment environment.
export function getDownloads(): DownloadOption[] {
  return [
    {
      id: "macos-arm64",
      platform: "macos",
      architecture: "arm64",
      label: "macOS · Apple Silicon · DMG",
      description:
        "For Macs with an Apple Silicon chip. Select the download that matches your device.",
      url: publicDownload(downloadMacosArm64Url),
    },
    {
      id: "macos-x64",
      platform: "macos",
      architecture: "x64",
      label: "macOS · Intel · DMG",
      description:
        "For Intel-based Macs. Distributed as a desktop application.",
      url: publicDownload(downloadMacosX64Url),
    },
    {
      id: "windows-x64",
      platform: "windows",
      architecture: "x64",
      label: "Windows · EXE",
      description:
        "Squirrel installer for 64-bit Windows PCs. Recommended for personal use.",
      url: publicDownload(downloadWindowsX64Url),
    },
    {
      id: "linux-x64",
      platform: "linux",
      architecture: "x64",
      label: "Linux · DEB",
      description:
        "For Debian and Ubuntu on x64.",
      url: publicDownload(downloadLinuxX64Url),
    },
    {
      id: "windows-x64-msi",
      platform: "windows",
      architecture: "x64",
      label: "Windows · MSI",
      description: "Squirrel MSI bootstrapper for x64. Choose either EXE or MSI, not both.",
      url: publicDownload(downloadWindowsX64MsiUrl),
    },
    {
      id: "linux-x64-rpm",
      platform: "linux",
      architecture: "x64",
      label: "Linux · RPM",
      description: "For Fedora and RPM-based distributions on x64.",
      url: publicDownload(downloadLinuxX64RpmUrl),
    },
  ];
}
