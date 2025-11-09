import { generatePath, Link, Route, Routes } from 'react-router-dom';
import { routes } from '../shared/models/routes';
import UserProfile from './pages/UserProfile';

function App() {
  return (
    <>
      <Link
        to={generatePath(routes.userProfile, {
          id: '1',
        })}
      >
        User 1
      </Link>
      <Link
        to={generatePath(routes.userProfile, {
          id: '2',
        })}
      >
        User 2
      </Link>
      <Link
        to={generatePath(routes.userProfile, {
          id: '3',
        })}
      >
        User 3
      </Link>
      <Routes>
        <Route path="/" element={<>Home</>} />
        <Route path={routes.userProfile} element={<UserProfile />} />
      </Routes>
    </>
  );
}

export default App;
