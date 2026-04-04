import { UserContext } from '@/contexts/user-context';
import type { ApiResponse, User } from '@/types';
import { useCallback, useEffect, useState } from 'react';

export const UserContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = useCallback(() => {
    (async () => {
      setLoading(true);
      try {
        let response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admins/me`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.status === 401) {
          const refreshTokenResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admins/me/refresh-tokens`, {
            method: 'POST',
            credentials: 'include',
          });

          if (!refreshTokenResponse.ok) {
            setUser(null);
            return;
          }

          response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admins/me`, {
            method: 'GET',
            credentials: 'include',
          });
        }

        if (!response.ok) {
          setUser(null);
          return;
        }

        const result = (await response.json()) as ApiResponse<Partial<{ admin: User }>>;

        if (result.data && result.data.admin) {
          setUser({
            _id: result.data.admin._id,
            phoneNumber: {
              countryCode: result.data.admin.phoneNumber.countryCode,
              number: result.data.admin.phoneNumber.number,
            },
            name: result.data.admin.name,
            role: result.data.admin.role,
          });
          return;
        } else {
          throw new Error('Invalid admin api response.');
        }
      } catch (error) {
        console.log(error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    fetchUser();
  }, []);

  return <UserContext.Provider value={{ user, fetchUser, loading }}>{children}</UserContext.Provider>;
};
