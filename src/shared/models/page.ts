export type PageModel = UserProfilePage | EmptyPage;

export type UserProfilePage = {
  $type: 'UserProfilePage';
  id: number;
  firstName: string;
  lastName: string;
  image: string;
  email: string;
  username: string;
};

export type EmptyPage = {
  $type: 'EmptyPage';
};

export const isUserProfilePage = (page: PageModel): page is UserProfilePage => {
  return page?.$type === 'UserProfilePage';
};
