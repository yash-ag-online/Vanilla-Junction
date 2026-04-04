import { Outlet, useNavigate } from 'react-router';
import Footer from '../components/footer';
import Header from '../components/header';
import Main from '../components/main';
import { useUser } from '@/contexts/user-context';
import { useEffect } from 'react';

const Wrapper = () => {
  const navigate = useNavigate();
  const userContext = useUser();

  useEffect(() => {
    if (userContext) {
      const { loading, user } = userContext;

      if (!loading && !user) navigate('/auth');
    }
  }, [userContext]);

  if (!userContext?.loading && userContext?.user) {
    return (
      <div className="wrapper flex flex-col min-h-screen w-full max-w-6xl mx-auto px-4 xl:px-0" id="wrapper">
        <Header />
        <Main>
          <Outlet />
        </Main>
        <Footer />
      </div>
    );
  } else return <></>;
};

export default Wrapper;
