/** Límites aproximados (bounding box) para validación de comuna en terreno. */
export interface CommuneBounds {
  north: number;
  south: number;
  west: number;
  east: number;
}

/** Comuna San Miguel, Región Metropolitana — área operativa demo. */
export const SAN_MIGUEL_BOUNDS: CommuneBounds = {
  north: -33.468,
  south: -33.522,
  west: -70.682,
  east: -70.628,
};

export const COMMUNE_BOUNDS: Record<string, CommuneBounds> = {
  'San Miguel': SAN_MIGUEL_BOUNDS,
};
