// Types bases que pueden ser reutilizadas en diferentes entidades

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface BaseCreateDto {
  createdBy?: string;
}

export interface BaseUpdateDto {
  updatedBy?: string;
}
