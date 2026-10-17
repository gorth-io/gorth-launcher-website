import { Link } from "@gorth/primitive/cores/tanstack/router";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
} from "@gorth/primitive/cores/lucide";
import { Badge } from "@gorth/primitive/custom/badge";
import { Button } from "@gorth/primitive/custom/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@gorth/primitive/default/card";
import { Wrapper } from "@/layouts/wrapper";
import { ProductPreview } from "@/components/product-preview";
import { AppBrand } from "@/components/app-brand";
import { features, product } from "@/utils/constant";

export default function HomePage() {
  return (
    <>
      <section aria-labelledby="product-title">
        <Wrapper className="grid gap-10 py-12 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-20">
          <div className="flex min-w-0 flex-col items-start gap-6">
            <div className="flex items-center gap-3">
              <AppBrand />
              <Badge variant="outline">{product.eyebrow}</Badge>
            </div>
            <div className="space-y-4">
              <h1
                id="product-title"
                className="max-w-xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
              >
                {product.headline}
              </h1>
              <p className="max-w-lg text-base leading-7 text-muted-foreground">
                {product.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button nativeButton={false} render={<Link to="/download" />}>
                <ArrowDownToLine />
                Download {product.name}
              </Button>
              <Button
                nativeButton={false}
                variant="outline"
                render={<Link to="/" hash="features" />}
              >
                Explore features
                <ArrowRight />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              macOS · Windows · Linux · No account required to download
            </p>
          </div>
          <div className="min-w-0">
            <ProductPreview />
          </div>
        </Wrapper>
      </section>
      <section
        id="features"
        aria-labelledby="features-title"
        className="scroll-mt-20 border-y bg-muted/20"
      >
        <Wrapper className="space-y-6 py-10 lg:py-12">
          <div className="space-y-2">
            <h2
              id="features-title"
              className="text-2xl font-bold tracking-tight"
            >
              Built around your everyday.
            </h2>
            <p className="text-sm text-muted-foreground">
              Familiar tools. A focused workspace. Part of the Gorth ecosystem.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map(({ title, description, icon: Icon }) => (
              <Card key={title}>
                <CardHeader>
                  <span className="mb-3 flex size-9 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-4" />
                  </span>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Wrapper>
      </section>
      <Wrapper className="py-10 lg:py-12">
        <Card>
          <CardContent className="gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                Make room for {product.name}.
              </h2>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="size-4" />
                Choose your platform and make it your own.
              </p>
            </div>
            <Button nativeButton={false} render={<Link to="/download" />}>
              View downloads
              <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      </Wrapper>
    </>
  );
}
