import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { UserProfilePage } from '../../../shared/models/page';

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const {
    data: pageData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      return response.json() as Promise<UserProfilePage>;
    },
  });
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
