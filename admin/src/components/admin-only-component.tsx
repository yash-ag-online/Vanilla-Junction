import { useUser } from '@/contexts/user-context';

const AdminOnly = ({ children }: { children: React.ReactNode }) => {
  const userContext = useUser();
  const userRole = userContext!.user?.role;

  if (!userRole || userRole !== 'Admin') {
    return <></>;
  }

  return children;
};

export default AdminOnly;
