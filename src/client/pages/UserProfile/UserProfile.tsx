import { apiRoutes, routes, queriesConfig } from '@/shared/config/routes';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import styles from './UserProfile.module.scss';

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
    <div className={styles.container}>
      <div className={styles.header}>
        <img src={pageData.image} alt={pageData.username} className={styles.avatar} />
        <h1 className={styles.name}>
          {pageData.firstName} {pageData.lastName}
        </h1>
        <span className={styles.username}>@{pageData.username}</span>
      </div>

      <div className={styles.info}>
        <p className={styles.email}>{pageData.email}</p>
      </div>

      <div className={styles.actions}></div>
    </div>
  );
};

export default UserProfile;
