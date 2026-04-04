import { useUser } from '@/contexts/user-context';
import { IceCreamsList, OrdersList } from './components';

const Home = () => {
  const userContext = useUser();
  const userRole = userContext!.user?.role;

  if (userRole === 'Admin') {
    return (
      <div className="min-h-screen">
        <IceCreamsList />
      </div>
    );
  }

  if (userRole === 'Delivery Person') {
    return (
      <div className="min-h-screen">
        <OrdersList />
      </div>
    );
  }

  return <></>;
};

export default Home;
