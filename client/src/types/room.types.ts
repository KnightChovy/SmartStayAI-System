export interface Room {
  id: string;
  name: string;
  price: number;
  rating: string;
  description: string;
  details: string;
  capacity: string;
  size: string;
  bed: string;
  view: string;
  inHighDemand: boolean;
  roomsLeft: number;
}

export interface RoomImage {
  url: string;
  alt: string;
}
