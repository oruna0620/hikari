export interface LineUserMapping {
  id: string;
  lineUserId: string;
  userId: string;
  displayName: string | null;
  pictureUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
