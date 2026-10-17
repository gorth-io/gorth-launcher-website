import { useCallerQuery } from "@/utils/caller";
import type { DownloadOption } from "@/utils/interface";
export function useDownloads() {
  return useCallerQuery<{ version: string | null; items: DownloadOption[] }>({
    url: "/download/catalog",
    auth: false,
    queryKey: ["download", "catalog"],
    queryOptions: { retry: false },
  });
}
