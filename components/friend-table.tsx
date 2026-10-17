import { useState, useMemo, useCallback } from "react";
import { DataTable } from "@/components/custom/data-table";
import type { DataTableProps } from "@gorth/primitive/utils/interface";
import { NavIdentity } from "@/components/dashboard/nav-user";
import { Input } from "@gorth/primitive/default/input";
import { Button } from "@gorth/primitive/custom/button";
import { Spinner } from "@gorth/primitive/pattern/spinner";
import { toast } from "@gorth/primitive/custom/toast";
import { useFriends, useFriendMutation } from "@/services/profile";
import { normalizeCallerError } from "@/utils/caller";
import type { FriendRow } from "@/schemas/profile";

export function FriendTable() {
  const query = useFriends();
  const mutation = useFriendMutation();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState("");
  const { mutateAsync } = mutation;
  const run = useCallback(
    async (input: Parameters<typeof mutateAsync>[0]) => {
      try {
        await mutateAsync(input);
        setPagination((current) => ({ ...current, pageIndex: 0 }));
      } catch (error) {
        toast.add({
          type: "error",
          title: normalizeCallerError(error).message,
        });
      }
    },
    [mutateAsync],
  );
  const filtered = (query.data?.items ?? []).filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );
  const columns = useMemo<DataTableProps<FriendRow>["columns"]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Player",
        cell: ({ row }) => (
          <NavIdentity
            user={{ name: row.original.name, avatar: row.original.avatar }}
            description={
              row.original.status === "accepted"
                ? "Friend"
                : row.original.incoming
                  ? "Incoming request"
                  : "Request sent"
            }
          />
        ),
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex gap-2">
            {row.original.status === "requested" && row.original.incoming ? (
              <Button
                variant="outline"
                disabled={mutation.isPending}
                onClick={() =>
                  void run({ id: row.original.id, action: "accept" })
                }
              >
                Accept
              </Button>
            ) : null}
            <Button
              variant="ghost"
              disabled={mutation.isPending}
              onClick={() => {
                if (window.confirm("Remove this friendship or request?"))
                  void run({ id: row.original.id, action: "remove" });
              }}
            >
              Remove
            </Button>
          </div>
        ),
      },
    ],
    [mutation.isPending, run],
  );
  return (
    <DataTable
      columns={columns}
      data={filtered.slice(
        pagination.pageIndex * pagination.pageSize,
        (pagination.pageIndex + 1) * pagination.pageSize,
      )}
      rowCount={filtered.length}
      pagination={pagination}
      onPaginationChange={setPagination}
      nav={{
        name: "Friend",
        description:
          "Send a request using an exact Minecraft name. Only the recipient can accept.",
      }}
      search={{
        value: search,
        placeholder: "Search friends...",
        onValueChange: (value) => {
          setSearch(value);
          setPagination((current) => ({ ...current, pageIndex: 0 }));
        },
      }}
      render={
        <form
          className="flex flex-wrap gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            await run({ name: String(new FormData(form).get("name") ?? "") });
          }}
        >
          <Input
            name="name"
            aria-label="Minecraft name"
            placeholder="Minecraft name"
            pattern="[A-Za-z0-9_]{3,16}"
            required
            maxLength={16}
          />
          <Button disabled={mutation.isPending} type="submit">
            Send request
          </Button>
        </form>
      }
      loading={query.isPending}
      loadingMessage={<Spinner variant="infinite" className="mx-auto size-8" />}
      onReload={() => void query.refetch()}
      emptyMessage={
        query.isError
          ? "Unable to load friends. Check the database migration."
          : "No friend requests or friendships yet."
      }
    />
  );
}
