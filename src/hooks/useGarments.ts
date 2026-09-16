import { useCallback, useEffect, useState } from "react";

import { listGarments, type GarmentFilters } from "../domain/garments";
import type { Garment } from "../domain/types";

export function useGarments(filters: GarmentFilters) {
  const [garments, setGarments] = useState<Garment[]>([]);

  const refresh = useCallback(() => {
    setGarments(listGarments(filters));
    // filters is a plain object recreated per render; stringify keeps refresh stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { garments, refresh };
}
