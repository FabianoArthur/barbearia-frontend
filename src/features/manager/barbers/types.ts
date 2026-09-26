export interface CreateBarberDto {
  userId: string;
  establishmentId: string;
  commissionPercent?: number;
}

export interface AddBarberDto {
  name: string;
  email: string;
  password: string;
  establishmentId: string;
  commissionPercent: number;
}

export interface UpdateBarberDto {
  commissionPercent?: number;
}
