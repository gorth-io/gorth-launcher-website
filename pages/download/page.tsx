import { Badge } from "@gorth/primitive/custom/badge";
import { Button } from "@gorth/primitive/custom/button";
import { Wrapper } from "@/layouts/wrapper";
import { DownloadList } from "@/components/download-list";
import { useDownloads } from "@/services/download-client";
import { product } from "@/utils/constant";

export default function DownloadPage() {
  const query = useDownloads();
  return (
    <Wrapper className="space-y-6 py-6">
      <Badge variant="outline" className="mb-6">
        {query.data?.version
          ? "Version " + query.data.version
          : "Releases coming soon"}
      </Badge>
      <h1 className="text-2xl font-bold tracking-tight">
        Download {product.name}
      </h1>
      <p className="mt-4 mb-10 max-w-xl leading-7 text-muted-foreground">
        Pick the build for your operating system and processor. Published builds
        appear here as soon as their download URLs are configured.
      </p>
      {query.isPending ? (
        <p role="status">Loading downloads…</p>
      ) : query.isError ? (
        <div role="alert">
          <p>Unable to load downloads.</p>
          <Button onClick={() => void query.refetch()}>Try again</Button>
        </div>
      ) : (
        <DownloadList downloads={query.data?.items ?? []} />
      )}
      <p className="mt-8 text-sm text-muted-foreground">
        Only download software from a trusted source. Installation and signing
        requirements will be listed with each release.
      </p>
    </Wrapper>
  );
}
