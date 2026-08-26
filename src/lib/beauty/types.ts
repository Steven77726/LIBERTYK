export type BeautyCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type BeautyService = {
  id: string;
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type BeautyProfessionalService = {
  id: string;
  professionalId: string;
  serviceId: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  serviceName?: string;
  serviceSlug?: string;
  price?: number | null;
  priceFrom: boolean;
  durationMinutes?: number | null;
  atHome: boolean;
  onSite: boolean;
  active: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
};
