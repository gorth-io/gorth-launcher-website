import { Link } from "@gorth/primitive/cores/tanstack/router";
import { Header as PrimitiveHeader } from "@/layouts/header";
import { AppBrand } from "@/components/app-brand";
import { useNavigation } from "@/hooks/use-navigation";
import { headerNavigation, product } from "@/utils/constant";

export function Header() {
  const { user, auth } = useNavigation();
  return (
    <PrimitiveHeader
      user={user}
      auth={auth}
      nav={headerNavigation}
      bottom={
        <Link to="/" aria-label={product.name + " home"}>
          <AppBrand />
        </Link>
      }
    />
  );
}
