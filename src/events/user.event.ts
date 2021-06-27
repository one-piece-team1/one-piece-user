export enum UserEvent {
  'CREATEUSER' = 'create-user',
  'UPDATEUSERPASSWORD' = 'update-user-password',
  'UPDATEUSERADDITIONALINFO' = 'update-user-additional-info',
  'SOFTDELETEUSER' = 'soft-delete-user',
}

export enum UserAPIEvent {
  'CREATEUSER' = '/users/signup',
  'UPDATEUSERPASSWORD' = '/users/|^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$|/password',
}
