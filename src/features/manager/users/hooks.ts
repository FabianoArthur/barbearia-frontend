import useSWR, { mutate as globalMutate } from "swr";
import type { PaginatedResponse, PaginationMeta, User } from "@/types";
import * as userService from "./services";
import type { CreateUserDto, UpdateUserDto, UserQueryParams } from "./types";

export function useUser(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<User>(
    id ? `/users/${id}` : null,
    () => userService.findById(id!),
  );
  return { user: data, isLoading, isError: !!error, mutate };
}

const EMPTY_META: PaginationMeta = {
  totalItems: 0,
  itemsPerPage: 20,
  currentPage: 1,
  totalPages: 0,
};

function buildCacheKey(params?: UserQueryParams): string {
  if (!params) return "/users";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `/users?${qs}` : "/users";
}

export function useUsers(params?: UserQueryParams) {
  const key = buildCacheKey(params);

  const { data, error, isLoading } = useSWR<PaginatedResponse<User>>(
    key,
    () => userService.findAll(params),
    { dedupingInterval: 2000 },
  );

  return {
    users: data?.data ?? [],
    meta: data?.meta ?? EMPTY_META,
    isLoading,
    isError: !!error,
  };
}

async function revalidateUserLists() {
  await globalMutate(
    (key) => typeof key === "string" && key.startsWith("/users"),
    undefined,
    { revalidate: true },
  );
}

export function useUserMutations() {
  async function create(data: CreateUserDto) {
    const user = await userService.createUser(data);
    await revalidateUserLists();
    return user;
  }

  async function update(id: string, data: UpdateUserDto) {
    const user = await userService.updateUser(id, data);
    await globalMutate(`/users/${id}`);
    await revalidateUserLists();
    return user;
  }

  async function remove(id: string) {
    await userService.deleteUser(id);
    await revalidateUserLists();
  }

  return { create, update, remove };
}
