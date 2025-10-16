import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as AppUser } from "@/types/task";
import { cache, CACHE_KEYS, withCache } from "@/lib/cache";
import { withErrorHandling, DatabaseError } from "@/lib/errors";

const mapRowToUser = (row: any): AppUser => ({
  id: row.id,
  email: row.email,
  username: row.username,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (): Promise<AppUser[]> => {
    return withCache(
      CACHE_KEYS.USERS,
      async () => {
        const { data, error } = await supabase.from("users").select("*").order("username");
        if (error) {
          throw new DatabaseError(`Error al cargar usuarios: ${error.message}`);
        }
        return (data ?? []).map(mapRowToUser);
      },
      10 * 60 * 1000 // 10 minutos
    );
  };

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const usersData = await fetchUsers();
        setUsers(usersData);
        setError(null);
      } catch (err) {
        const errorResult = await withErrorHandling(() => Promise.reject(err), false);
        setError(errorResult.error?.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Función para invalidar caché y recargar
  const refetch = async () => {
    cache.invalidate(CACHE_KEYS.USERS);
    const usersData = await fetchUsers();
    setUsers(usersData);
    return usersData;
  };

  return { users, loading, error, refetch };
}
