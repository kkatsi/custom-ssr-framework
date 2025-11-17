import { pagesRoutes } from '@/shared/config/routes';
import { generatePath, Outlet, Route, Routes } from 'react-router-dom';
import OptimisticLink from './components/OptimisticLink';
import useUpdateDocumentTitle from './hooks/useUpdateDocumentTitle';
import UserProfile from './pages/UserProfile';

function Layout() {
  useUpdateDocumentTitle();

  return (
    <>
      <nav>
        <OptimisticLink
          to={generatePath(pagesRoutes.userProfile, {
            id: '1',
          })}
        >
          User 1
        </OptimisticLink>
        <OptimisticLink
          to={generatePath(pagesRoutes.userProfile, {
            id: '2',
          })}
        >
          User 2
        </OptimisticLink>
        <OptimisticLink
          to={generatePath(pagesRoutes.userProfile, {
            id: '3',
          })}
        >
          User 3
        </OptimisticLink>
      </nav>
      <Outlet />
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<>Home</>} />
        <Route path={pagesRoutes.userProfile} element={<UserProfile />} />
      </Route>
    </Routes>
  );
}

export default App;
