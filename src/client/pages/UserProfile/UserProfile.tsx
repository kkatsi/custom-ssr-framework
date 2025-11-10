import { apiRoutes, routes, queriesConfig } from '@/shared/config/routes';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const {
    data: pageData,
    isLoading,
    error,
  } = useQuery(queriesConfig[routes.userProfile].getQueryOptions({ id: id! }));

  if (isLoading) return <div className="page-loader">Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!pageData) return <div>No data</div>;

  return (
    <div>
      <h2>
        {pageData.firstName} {pageData.lastName}
      </h2>
      <h5>{pageData.username}</h5>
      <span>{pageData.email}</span>
      <img src={pageData.image} alt="" />
    </div>
  );
};

export default UserProfile;
