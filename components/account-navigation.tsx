import { Link } from "@gorth/primitive/cores/tanstack/router";
import { useLocation } from "@gorth/primitive/cores/tanstack/router";
import { Tabs, TabsList, TabsTrigger } from "@gorth/primitive/custom/tabs";
import { accountNavigation } from "@/utils/constant";

export function AccountNavigation() {
  const pathname = useLocation({ select: (location) => location.pathname });
  return (
    <Tabs value={pathname} className="min-w-0">
      <TabsList
        aria-label="Account navigation"
        className="max-w-full justify-start overflow-x-auto"
      >
        {accountNavigation.map((item) => (
          <TabsTrigger
            key={item.url}
            value={item.url}
            nativeButton={false}
            render={<Link to={item.url} />}
            onClick={(event) => {
              if (pathname === item.url) event.preventDefault();
            }}
          >
            {item.title}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
