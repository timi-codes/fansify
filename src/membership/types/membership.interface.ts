

export interface IMembership {
  id: number;
  name: string;
  description: string;
  price: number;
  status: string;
  tokenId: string;
  trxHash: string;
  collectionTag: string | null;
  updatedAt: Date;
  createdAt: Date;
  creatorId: number;
  ownerId: number;
}
