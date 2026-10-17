import { Spinner } from "@gorth/primitive/pattern/spinner";
export default function DashboardLoading() {
  return (
    <div
      className="flex min-h-64 flex-1 items-center justify-center"
      role="status"
      aria-label="Loading dashboard"
    >
      <Spinner variant="infinite" className="size-8" />
    </div>
  );
}
