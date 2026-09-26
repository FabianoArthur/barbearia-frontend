export interface CreateServiceDto {
  establishmentId: string;
  name: string;
  price: number;
  durationMinutes: number;
  notes?: string;
}

export interface UpdateServiceDto {
  name?: string;
  price?: number;
  durationMinutes?: number;
  notes?: string;
}
