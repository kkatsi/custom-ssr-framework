import { generatePath, Link, Route, Routes } from 'react-router-dom';
import UserProfile from './pages/UserProfile';
import LinkWithPrefetch from './components/LinkWithPrefetch';
import { routes } from '@/shared/config/routes';
import OptimisticLink from './components/OptimisticLink';

function App() {
  return (
    <>
      <OptimisticLink
        to={generatePath(routes.userProfile, {
          id: '1',
        })}
      >
        User 1
      </OptimisticLink>
      <OptimisticLink
        to={generatePath(routes.userProfile, {
          id: '2',
        })}
      >
        User 2
      </OptimisticLink>
      <OptimisticLink
        to={generatePath(routes.userProfile, {
          id: '3',
        })}
      >
        User 3
      </OptimisticLink>
      <Routes>
        <Route path="/" element={<>Home</>} />
        <Route path={routes.userProfile} element={<UserProfile />} />
      </Routes>
    </>
  );
}

export default App;
