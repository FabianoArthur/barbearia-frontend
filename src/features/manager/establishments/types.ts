export interface CreateEstablishmentDto {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  monthlyCost?: number;
}

export interface UpdateEstablishmentDto {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  monthlyCost?: number;
}
