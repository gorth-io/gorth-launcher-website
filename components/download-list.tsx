import { ArrowDownToLine } from "@gorth/primitive/cores/lucide";
import { downloadPlatformIcons } from "@/utils/constant";
import { Button } from "@gorth/primitive/custom/button";
import { Badge } from "@gorth/primitive/custom/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@gorth/primitive/default/card";
import type { DownloadOption } from "@/utils/interface";

export function DownloadList({ downloads }: { downloads: DownloadOption[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {downloads.map((download) => {
        const Icon = downloadPlatformIcons[download.platform];
        return (
          <Card key={download.id}>
            <CardHeader>
              <div className="mb-4 flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-md bg-muted">
                  <Icon className="size-4" />
                </span>
                <Badge variant="outline">
                  {download.architecture === "arm64" ? "Apple Silicon" : "x64"}
                </Badge>
              </div>
              <CardTitle>{download.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="min-h-12 text-sm text-muted-foreground">
                {download.description}
              </p>
              {download.url ? (
                <Button
                  className="w-full"
                  nativeButton={false}
                  render={<a href={download.url} rel="noopener noreferrer" />}
                >
                  <ArrowDownToLine className="size-4" />
                  Download
                </Button>
              ) : (
                <Button className="w-full" disabled>
                  Not published yet
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
