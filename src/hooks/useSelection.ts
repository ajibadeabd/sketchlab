import { useState, useCallback } from 'react';
import type { Element } from '../types';

export const useSelection = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const selectElement = useCallback((id: number, addToSelection: boolean = false) => {
    setSelectedIds(prev => {
      if (addToSelection) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return [id];
    });
  }, []);

  const selectMultiple = useCallback((ids: number[]) => {
    setSelectedIds(ids);
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const selectAll = useCallback((elements: Element[]) => {
    const allIds = elements.filter(el => !el.locked && el.visible !== false).map(el => el.id);
    setSelectedIds(allIds);
  }, []);

  const isSelected = useCallback((id: number) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  return {
    selectedIds,
    selectElement,
    selectMultiple,
    deselectAll,
    selectAll,
    isSelected,
    setSelectedIds
  };
};
