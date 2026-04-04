import { useUser } from '@/contexts/user-context';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

const AdminOnlyPage = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const userContext = useUser();

  useEffect(() => {
    if (userContext?.loading) {
      return;
    }

    if (!userContext?.user || userContext?.user.role !== 'Admin') {
      navigate('/');
    }
  }, [userContext]);

  if (!userContext?.user || userContext?.user.role !== 'Admin') {
    return <></>;
  }

  return children;
};

export default AdminOnlyPage;
