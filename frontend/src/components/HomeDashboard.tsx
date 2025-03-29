import type { UserType } from '@/types/types.ts';
import { strapiClient } from '@/lib/strapi.ts';
import { useQuery } from '@tanstack/react-query';
import Dashboard from './kokonutui/dashboard';

export function HomeDashboard() {
  const { data: updatedUser } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => strapiClient.find<UserType>('users/me').then(res => res.data),
  });
  return (
    <>
      <h1 className="text-3xl font-semibold pb-6">
        Welcome
        {' '}

        {updatedUser?.username}
      </h1>

      <Dashboard user={updatedUser!} />
    </>
  );
}
