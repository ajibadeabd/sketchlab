import { useState, useCallback } from 'react';
import type  {  RefObject } from 'react';
import type { Element } from '../types';

export const useZoomPan = () => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(5, prev * 1.2));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(0.1, prev / 1.2));
  }, []);

  const fitToScreen = useCallback((
    containerRef: RefObject<HTMLDivElement>,
    elements: Element[]
  ) => {
    if (!containerRef.current || elements.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    const minX = Math.min(...elements.map(el => el.x));
    const minY = Math.min(...elements.map(el => el.y));
    const maxX = Math.max(...elements.map(el => el.x + el.width));
    const maxY = Math.max(...elements.map(el => el.y + el.height));

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const padding = 50;
    const zoomX = (containerWidth - padding * 2) / contentWidth;
    const zoomY = (containerHeight - padding * 2) / contentHeight;
    const newZoom = Math.min(zoomX, zoomY, 1);

    const centerX = (containerWidth - contentWidth * newZoom) / 2 - minX * newZoom;
    const centerY = (containerHeight - contentHeight * newZoom) / 2 - minY * newZoom;

    setZoom(newZoom);
    setPan({ x: centerX, y: centerY });
  }, []);

  return {
    zoom,
    pan,
    isPanning,
    setZoom,
    setPan,
    setIsPanning,
    zoomIn,
    zoomOut,
    fitToScreen
  };
};
