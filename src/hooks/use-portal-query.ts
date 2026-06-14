import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

/** Runs API queries only after client auth is ready; scopes cache per logged-in user. */
export function usePortalQuery<TData>(options: UseQueryOptions<TData, Error, TData>) {
  const { session, loading, user } = useAuth();
  const enabled = !loading && !!session && (options.enabled ?? true);

  const baseKey = options.queryKey ?? [];
  const queryKey = user?.id ? [...(Array.isArray(baseKey) ? baseKey : [baseKey]), user.id] : baseKey;

  return useQuery({
    placeholderData: keepPreviousData,
    ...options,
    queryKey,
    enabled,
    staleTime: options.staleTime ?? 180_000,
    gcTime: options.gcTime ?? 15 * 60_000,
  });
}
