import React, { useState, useRef, useCallback } from 'react';
import { Toolbar, LayersPanel, StylesPanel, TopBar, PropertiesPanel } from './components';
import { useHistory, useSelection, useZoomPan, useKeyboardShortcuts } from './hooks';
import { exportToJSON, exportToSVG, exportToPNG, snapToGridValue, getGradientId, generatePolygonPath, generateStarPath, generateArrowPath } from './utils/helpers';
import type {
  ToolType, Element, Group, Component, TextStyle, ColorStyle,
  Point, SmartGuide, SelectionBox as SelectionBoxType, DrawPreview, ResizeState, ResizeStart
} from './types';

export default function DesignTool() {
  const [tool, setTool] = useState<ToolType>('select');
  const [elements, setElements] = useState<Element[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState<ResizeState | null>(null);
  const [resizeStart, setResizeStart] = useState<ResizeStart | null>(null);
  const [shiftKey, setShiftKey] = useState(false);
  const [altKey, setAltKey] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const gridSize = 20;
  const [editingTextId, setEditingTextId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showSmartGuides, setShowSmartGuides] = useState(true);
  const [smartGuides, setSmartGuides] = useState<SmartGuide[]>([]);
  const [selectionBox, setSelectionBox] = useState<SelectionBoxType | null>(null);
  const [isSelectingBox, setIsSelectingBox] = useState(false);
  const [clipboard, setClipboard] = useState<Element[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [darkMode, setDarkMode] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawPreview, setDrawPreview] = useState<DrawPreview | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [textStyles, setTextStyles] = useState<TextStyle[]>([]);
  const [colorStyles, setColorStyles] = useState<ColorStyle[]>([]);
  const [showStylesPanel, setShowStylesPanel] = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  const [penPoints, setPenPoints] = useState<Point[]>([]);
  const [isDrawingPath, setIsDrawingPath] = useState(false);

  const canvasRef = useRef<SVGSVGElement>(null);

  const { selectedIds, selectElement, selectMultiple, deselectAll, selectAll, setSelectedIds } = useSelection();
  const { zoom, pan, isPanning, setPan, setIsPanning, zoomIn, zoomOut, fitToScreen } = useZoomPan();
  const { historyIndex, saveHistory: saveToHistory, undo: undoHistory, redo: redoHistory, canUndo, canRedo, setHistoryIndex } = useHistory(elements, groups);

  const saveHistory = useCallback(() => {
    saveToHistory(elements, groups);
  }, [elements, groups, saveToHistory]);

  const undo = () => {
    const prevState = undoHistory();
    if (prevState) {
      setElements(prevState.elements);
      setGroups(prevState.groups);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    const nextState = redoHistory();
    if (nextState) {
      setElements(nextState.elements);
      setGroups(nextState.groups);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const addElement = (type: 'rectangle' | 'circle' | 'text' | 'line' | 'frame' | 'arrow' | 'polygon' | 'star', x: number, y: number, width: number, height: number) => {
    const maxZ = elements.length > 0 ? Math.max(...elements.map(e => e.zIndex)) : 0;
    const newElement: Element = {
      id: Date.now(),
      type: type === 'frame' ? 'frame' : type,
      x,
      y,
      width,
      height,
      fill: type === 'text' ? '#000000' : type === 'line' ? 'transparent' : type === 'frame' ? 'rgba(255, 255, 255, 0.01)' : type === 'arrow' ? 'transparent' : '#3b82f6',
      stroke: type === 'line' ? '#000000' : type === 'frame' ? '#8b5cf6' : type === 'arrow' ? '#000000' : undefined,
      strokeWidth: type === 'line' ? 2 : type === 'frame' ? 2 : type === 'arrow' ? 2 : undefined,
      text: type === 'text' ? 'Double-click to edit' : undefined,
      fontSize: 16,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'left',
      fontFamily: 'Arial, sans-serif',
      rotation: 0,
      opacity: 1,
      layerName: `${type.charAt(0).toUpperCase() + type.slice(1)} ${elements.length + 1}`,
      groupId: null,
      zIndex: maxZ + 1,
      locked: false,
      visible: true,
      borderRadius: 0,
      isFrame: type === 'frame',
      frameColor: type === 'frame' ? '#8b5cf6' : undefined,
      blur: 0,
      points: type === 'polygon' ? 6 : type === 'star' ? 5 : undefined,
      arrowHeadSize: type === 'arrow' ? 10 : undefined
    };
    setElements([...elements, newElement]);
    setSelectedIds([newElement.id]);
    saveHistory();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxZ = elements.length > 0 ? Math.max(...elements.map(el => el.zIndex)) : 0;
        const newElement: Element = {
          id: Date.now(),
          type: 'image',
          x: 100,
          y: 100,
          width: Math.min(img.width, 400),
          height: Math.min(img.height, 400),
          fill: 'transparent',
          imageUrl,
          rotation: 0,
          opacity: 1,
          layerName: `Image ${elements.length + 1}`,
          groupId: null,
          zIndex: maxZ + 1,
          locked: false,
          visible: true,
          borderRadius: 0
        };
        setElements([...elements, newElement]);
        setSelectedIds([newElement.id]);
        saveHistory();
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    if (tool === 'pen') {
      if (!isDrawingPath) {
        setIsDrawingPath(true);
        setPenPoints([{ x, y }]);
      } else {
        setPenPoints([...penPoints, { x, y }]);
      }
      return;
    }

    if (tool === 'eyedropper') {
      const clicked = [...elements]
        .filter(el => el.visible !== false)
        .sort((a, b) => b.zIndex - a.zIndex)
        .find(el =>
          x >= el.x && x <= el.x + el.width &&
          y >= el.y && y <= el.y + el.height
        );

      if (clicked && selectedIds.length > 0) {
        setElements(elements.map(el =>
          selectedIds.includes(el.id) ? { ...el, fill: clicked.fill } : el
        ));
        saveHistory();
      }
      setTool('select');
      return;
    }

    if (tool === 'text') {
      addElement('text', x, y, 200, 50);
      setTool('select');
    } else if (tool === 'select' && !e.shiftKey) {
      const clicked = [...elements]
        .filter(el => el.visible !== false)
        .sort((a, b) => b.zIndex - a.zIndex)
        .find(el =>
          !el.locked &&
          x >= el.x && x <= el.x + el.width &&
          y >= el.y && y <= el.y + el.height
        );

      setSelectedIds(clicked ? [clicked.id] : []);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    if (tool === 'hand') {
      setIsPanning(true);
      return;
    }

    if (tool === 'rectangle' || tool === 'circle' || tool === 'line' || tool === 'frame' || tool === 'arrow' || tool === 'polygon' || tool === 'star') {
      setIsDrawing(true);
      setDrawStart({ x, y });
      setDrawPreview({ x, y, width: 0, height: 0 });
      return;
    }

    if (tool !== 'select') return;

    const clicked = [...elements]
      .filter(el => el.visible !== false)
      .sort((a, b) => b.zIndex - a.zIndex)
      .find(el =>
        !el.locked &&
        x >= el.x && x <= el.x + el.width &&
        y >= el.y && y <= el.y + el.height
      );

    if (!clicked) {
      setIsSelectingBox(true);
      setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
    }
  };

  const finishPath = () => {
    if (penPoints.length < 2) {
      setPenPoints([]);
      setIsDrawingPath(false);
      return;
    }

    const xs = penPoints.map(p => p.x);
    const ys = penPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    const pathData = penPoints.map((p, i) =>
      i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
    ).join(' ');

    const maxZ = elements.length > 0 ? Math.max(...elements.map(e => e.zIndex)) : 0;
    const newElement: Element = {
      id: Date.now(),
      type: 'path',
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 2,
      rotation: 0,
      opacity: 1,
      layerName: `Path ${elements.length + 1}`,
      groupId: null,
      zIndex: maxZ + 1,
      locked: false,
      visible: true,
      path: pathData
    };

    setElements([...elements, newElement]);
    setSelectedIds([newElement.id]);
    setPenPoints([]);
    setIsDrawingPath(false);
    setTool('select');
    saveHistory();
  };

  const handleMouseDown = (e: React.MouseEvent, element: Element) => {
    if (tool !== 'select' || element.locked) return;
    e.stopPropagation();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragging(element.id);
    setOffset({
      x: (e.clientX - rect.left - pan.x) / zoom - element.x,
      y: (e.clientY - rect.top - pan.y) / zoom - element.y
    });

    if (!selectedIds.includes(element.id)) {
      setSelectedIds(e.shiftKey ? [...selectedIds, element.id] : [element.id]);
    }
  };

  const handleTextDoubleClick = (e: React.MouseEvent, element: Element) => {
    e.stopPropagation();
    if (element.type === 'text') {
      setEditingTextId(element.id);
      setEditingText(element.text || '');
    }
  };

  const finishTextEdit = () => {
    if (editingTextId !== null) {
      setElements(elements.map(el =>
        el.id === editingTextId ? { ...el, text: editingText } : el
      ));
      setEditingTextId(null);
      setEditingText('');
      saveHistory();
    }
  };

  const calculateSmartGuides = (movingElement: Element, newX: number, newY: number): SmartGuide[] => {
    if (!showSmartGuides) return [];

    const guides: SmartGuide[] = [];
    const threshold = 5;

    const otherElements = elements.filter(el => el.id !== movingElement.id && el.visible !== false);

    for (const el of otherElements) {
      if (Math.abs(newX - el.x) < threshold) {
        guides.push({ type: 'vertical', position: el.x });
      }
      if (Math.abs(newX + movingElement.width - (el.x + el.width)) < threshold) {
        guides.push({ type: 'vertical', position: el.x + el.width });
      }
      if (Math.abs(newX + movingElement.width / 2 - (el.x + el.width / 2)) < threshold) {
        guides.push({ type: 'vertical', position: el.x + el.width / 2 });
      }

      if (Math.abs(newY - el.y) < threshold) {
        guides.push({ type: 'horizontal', position: el.y });
      }
      if (Math.abs(newY + movingElement.height - (el.y + el.height)) < threshold) {
        guides.push({ type: 'horizontal', position: el.y + el.height });
      }
      if (Math.abs(newY + movingElement.height / 2 - (el.y + el.height / 2)) < threshold) {
        guides.push({ type: 'horizontal', position: el.y + el.height / 2 });
      }
    }

    return guides;
  };

  const handleResizeMouseDown = (e: React.MouseEvent, elementId: number, handle: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    setResizing({ id: elementId, handle });
    setResizeStart({
      x: mouseX,
      y: mouseY,
      width: element.width,
      height: element.height,
      elemX: element.x,
      elemY: element.y
    });
    setDragging(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: pan.x + e.movementX,
        y: pan.y + e.movementY
      });
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    if (isDrawing && drawStart) {
      const width = mouseX - drawStart.x;
      const height = mouseY - drawStart.y;

      let finalWidth = width;
      let finalHeight = height;

      if (shiftKey && (tool === 'rectangle' || tool === 'circle' || tool === 'frame' || tool === 'polygon' || tool === 'star')) {
        const size = Math.max(Math.abs(width), Math.abs(height));
        finalWidth = width >= 0 ? size : -size;
        finalHeight = height >= 0 ? size : -size;
      }

      setDrawPreview({
        x: finalWidth >= 0 ? drawStart.x : drawStart.x + finalWidth,
        y: finalHeight >= 0 ? drawStart.y : drawStart.y + finalHeight,
        width: Math.abs(finalWidth),
        height: Math.abs(finalHeight)
      });
      return;
    }

    if (isSelectingBox && selectionBox) {
      setSelectionBox({ ...selectionBox, endX: mouseX, endY: mouseY });
      return;
    }

    if (resizing && resizeStart) {
      const element = elements.find(el => el.id === resizing.id);
      if (!element) return;

      let deltaX = mouseX - resizeStart.x;
      let deltaY = mouseY - resizeStart.y;

      let newX = element.x;
      let newY = element.y;
      let newWidth = element.width;
      let newHeight = element.height;

      const aspectRatio = resizeStart.width / resizeStart.height;
      const isCornerHandle = ['nw', 'ne', 'sw', 'se'].includes(resizing.handle);

      if (shiftKey && isCornerHandle) {
        const absWidth = Math.abs(resizeStart.width + (resizing.handle.includes('e') ? deltaX : -deltaX));
        const absHeight = Math.abs(resizeStart.height + (resizing.handle.includes('s') ? deltaY : -deltaY));

        if (absWidth / aspectRatio > absHeight) {
          deltaY = (absWidth / aspectRatio - resizeStart.height) * (resizing.handle.includes('n') ? -1 : 1);
        } else {
          deltaX = (absHeight * aspectRatio - resizeStart.width) * (resizing.handle.includes('w') ? -1 : 1);
        }
      }

      if (altKey) {
        const centerX = resizeStart.elemX + resizeStart.width / 2;
        const centerY = resizeStart.elemY + resizeStart.height / 2;

        switch (resizing.handle) {
          case 'nw':
            newWidth = resizeStart.width - deltaX * 2;
            newHeight = resizeStart.height - deltaY * 2;
            newX = centerX - newWidth / 2;
            newY = centerY - newHeight / 2;
            break;
          case 'n':
            newHeight = resizeStart.height - deltaY * 2;
            newY = centerY - newHeight / 2;
            break;
          case 'ne':
            newWidth = resizeStart.width + deltaX * 2;
            newHeight = resizeStart.height - deltaY * 2;
            newX = centerX - newWidth / 2;
            newY = centerY - newHeight / 2;
            break;
          case 'w':
            newWidth = resizeStart.width - deltaX * 2;
            newX = centerX - newWidth / 2;
            break;
          case 'e':
            newWidth = resizeStart.width + deltaX * 2;
            newX = centerX - newWidth / 2;
            break;
          case 'sw':
            newWidth = resizeStart.width - deltaX * 2;
            newHeight = resizeStart.height + deltaY * 2;
            newX = centerX - newWidth / 2;
            newY = centerY - newHeight / 2;
            break;
          case 's':
            newHeight = resizeStart.height + deltaY * 2;
            newY = centerY - newHeight / 2;
            break;
          case 'se':
            newWidth = resizeStart.width + deltaX * 2;
            newHeight = resizeStart.height + deltaY * 2;
            newX = centerX - newWidth / 2;
            newY = centerY - newHeight / 2;
            break;
        }
      } else {
        switch (resizing.handle) {
          case 'nw':
            newX = resizeStart.elemX + deltaX;
            newY = resizeStart.elemY + deltaY;
            newWidth = resizeStart.width - deltaX;
            newHeight = resizeStart.height - deltaY;
            break;
          case 'n':
            newY = resizeStart.elemY + deltaY;
            newHeight = resizeStart.height - deltaY;
            break;
          case 'ne':
            newY = resizeStart.elemY + deltaY;
            newWidth = resizeStart.width + deltaX;
            newHeight = resizeStart.height - deltaY;
            break;
          case 'w':
            newX = resizeStart.elemX + deltaX;
            newWidth = resizeStart.width - deltaX;
            break;
          case 'e':
            newWidth = resizeStart.width + deltaX;
            break;
          case 'sw':
            newX = resizeStart.elemX + deltaX;
            newWidth = resizeStart.width - deltaX;
            newHeight = resizeStart.height + deltaY;
            break;
          case 's':
            newHeight = resizeStart.height + deltaY;
            break;
          case 'se':
            newWidth = resizeStart.width + deltaX;
            newHeight = resizeStart.height + deltaY;
            break;
        }
      }

      if (newWidth < 10) {
        newWidth = 10;
        if (resizing.handle.includes('w')) newX = element.x + element.width - 10;
      }
      if (newHeight < 10) {
        newHeight = 10;
        if (resizing.handle.includes('n')) newY = element.y + element.height - 10;
      }

      if (snapToGrid) {
        newX = snapToGridValue(newX, snapToGrid, gridSize);
        newY = snapToGridValue(newY, snapToGrid, gridSize);
        newWidth = snapToGridValue(newWidth, snapToGrid, gridSize);
        newHeight = snapToGridValue(newHeight, snapToGrid, gridSize);
      }

      setElements(elements.map(el =>
        el.id === resizing.id
          ? { ...el, x: newX, y: newY, width: newWidth, height: newHeight }
          : el
      ));
      return;
    }

    if (!dragging) return;

    const draggedElement = elements.find(el => el.id === dragging);
    if (!draggedElement) return;

    let x = mouseX - offset.x;
    let y = mouseY - offset.y;

    if (showSmartGuides && !snapToGrid) {
      const guides = calculateSmartGuides(draggedElement, x, y);
      setSmartGuides(guides);

      for (const guide of guides) {
        if (guide.type === 'vertical') {
          if (Math.abs(x - guide.position) < 5) x = guide.position;
          if (Math.abs(x + draggedElement.width - guide.position) < 5) x = guide.position - draggedElement.width;
          if (Math.abs(x + draggedElement.width / 2 - guide.position) < 5) x = guide.position - draggedElement.width / 2;
        } else {
          if (Math.abs(y - guide.position) < 5) y = guide.position;
          if (Math.abs(y + draggedElement.height - guide.position) < 5) y = guide.position - draggedElement.height;
          if (Math.abs(y + draggedElement.height / 2 - guide.position) < 5) y = guide.position - draggedElement.height / 2;
        }
      }
    } else {
      setSmartGuides([]);
    }

    if (snapToGrid) {
      x = snapToGridValue(x, snapToGrid, gridSize);
      y = snapToGridValue(y, snapToGrid, gridSize);
    }

    const deltaX = x - draggedElement.x;
    const deltaY = y - draggedElement.y;

    setElements(elements.map(el =>
      selectedIds.includes(el.id) && !el.locked
        ? { ...el, x: el.x + deltaX, y: el.y + deltaY }
        : el
    ));
  };

  const handleMouseUp = () => {
    if (isDrawing && drawStart && drawPreview) {
      const minWidth = 5;
      const minHeight = 5;

      if (drawPreview.width >= minWidth && drawPreview.height >= minHeight) {
        if (tool === 'rectangle') {
          addElement('rectangle', drawPreview.x, drawPreview.y, drawPreview.width, drawPreview.height);
        } else if (tool === 'circle') {
          addElement('circle', drawPreview.x, drawPreview.y, drawPreview.width, drawPreview.height);
        } else if (tool === 'line') {
          addElement('line', drawPreview.x, drawPreview.y, drawPreview.width, drawPreview.height);
        } else if (tool === 'frame') {
          addElement('frame', drawPreview.x, drawPreview.y, drawPreview.width, drawPreview.height);
        } else if (tool === 'arrow') {
          addElement('arrow', drawPreview.x, drawPreview.y, drawPreview.width, drawPreview.height);
        } else if (tool === 'polygon') {
          addElement('polygon', drawPreview.x, drawPreview.y, drawPreview.width, drawPreview.height);
        } else if (tool === 'star') {
          addElement('star', drawPreview.x, drawPreview.y, drawPreview.width, drawPreview.height);
        }
        setTool('select');
      }

      setIsDrawing(false);
      setDrawStart(null);
      setDrawPreview(null);
      return;
    }

    if (isSelectingBox && selectionBox) {
      const minX = Math.min(selectionBox.startX, selectionBox.endX);
      const maxX = Math.max(selectionBox.startX, selectionBox.endX);
      const minY = Math.min(selectionBox.startY, selectionBox.endY);
      const maxY = Math.max(selectionBox.startY, selectionBox.endY);

      const selected = elements.filter(el =>
        !el.locked &&
        el.visible !== false &&
        el.x >= minX && el.x + el.width <= maxX &&
        el.y >= minY && el.y + el.height <= maxY
      ).map(el => el.id);

      setSelectedIds(selected);
      setIsSelectingBox(false);
      setSelectionBox(null);
    }

    if (dragging || resizing) {
      saveHistory();
      setDragging(null);
      setResizing(null);
      setResizeStart(null);
      setSmartGuides([]);
    }
    setIsPanning(false);
  };

  const copySelected = () => {
    const selected = elements.filter(el => selectedIds.includes(el.id));
    setClipboard(selected);
  };

  const pasteFromClipboard = () => {
    if (clipboard.length === 0) return;

    const maxZ = elements.length > 0 ? Math.max(...elements.map(e => e.zIndex)) : 0;
    const newElements = clipboard.map((el, index) => ({
      ...el,
      id: Date.now() + index,
      x: el.x + 20,
      y: el.y + 20,
      zIndex: maxZ + index + 1
    }));

    setElements([...elements, ...newElements]);
    setSelectedIds(newElements.map(el => el.id));
    saveHistory();
  };

  const deleteSelected = () => {
    setElements(elements.filter(el => !selectedIds.includes(el.id)));
    setSelectedIds([]);
    saveHistory();
  };

  const duplicateSelected = () => {
    if (selectedIds.length === 0) return;

    const newElements = selectedIds.map(id => {
      const element = elements.find(el => el.id === id);
      if (!element) return null;

      return {
        ...element,
        id: Date.now() + Math.random(),
        x: element.x + 20,
        y: element.y + 20,
        zIndex: element.zIndex + 1
      };
    }).filter((el): el is Element => el !== null);

    setElements([...elements, ...newElements]);
    setSelectedIds(newElements.map(el => el.id));
    saveHistory();
  };

  const updateProperty = <K extends keyof Element>(property: K, value: Element[K]) => {
    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? { ...el, [property]: value } : el
    ));
    saveHistory();
  };

  const toggleLock = () => {
    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? { ...el, locked: !el.locked } : el
    ));
    saveHistory();
  };

  const toggleVisibility = () => {
    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? { ...el, visible: !el.visible } : el
    ));
    saveHistory();
  };

  const alignLeft = () => {
    if (selectedIds.length === 0) return;
    const minX = Math.min(...elements.filter(el => selectedIds.includes(el.id)).map(el => el.x));
    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? { ...el, x: minX } : el
    ));
    saveHistory();
  };

  const alignCenter = () => {
    if (selectedIds.length === 0) return;
    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    const minX = Math.min(...selectedElements.map(el => el.x));
    const maxX = Math.max(...selectedElements.map(el => el.x + el.width));
    const centerX = (minX + maxX) / 2;

    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? { ...el, x: centerX - el.width / 2 } : el
    ));
    saveHistory();
  };

  const alignRight = () => {
    if (selectedIds.length === 0) return;
    const maxX = Math.max(...elements.filter(el => selectedIds.includes(el.id)).map(el => el.x + el.width));
    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? { ...el, x: maxX - el.width } : el
    ));
    saveHistory();
  };

  const alignTop = () => {
    if (selectedIds.length === 0) return;
    const minY = Math.min(...elements.filter(el => selectedIds.includes(el.id)).map(el => el.y));
    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? { ...el, y: minY } : el
    ));
    saveHistory();
  };

  const alignMiddle = () => {
    if (selectedIds.length === 0) return;
    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    const minY = Math.min(...selectedElements.map(el => el.y));
    const maxY = Math.max(...selectedElements.map(el => el.y + el.height));
    const centerY = (minY + maxY) / 2;

    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? { ...el, y: centerY - el.height / 2 } : el
    ));
    saveHistory();
  };

  const alignBottom = () => {
    if (selectedIds.length === 0) return;
    const maxY = Math.max(...elements.filter(el => selectedIds.includes(el.id)).map(el => el.y + el.height));
    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? { ...el, y: maxY - el.height } : el
    ));
    saveHistory();
  };

  const distributeHorizontally = () => {
    if (selectedIds.length < 3) return;

    const selected = elements.filter(el => selectedIds.includes(el.id)).sort((a, b) => a.x - b.x);
    const first = selected[0];
    const last = selected[selected.length - 1];
    const totalSpace = (last.x + last.width) - first.x;
    const totalWidth = selected.reduce((sum, el) => sum + el.width, 0);
    const gap = (totalSpace - totalWidth) / (selected.length - 1);

    let currentX = first.x + first.width + gap;
    setElements(elements.map(el => {
      const index = selected.findIndex(s => s.id === el.id);
      if (index > 0 && index < selected.length - 1) {
        const newEl = { ...el, x: currentX };
        currentX += el.width + gap;
        return newEl;
      }
      return el;
    }));
    saveHistory();
  };

  const distributeVertically = () => {
    if (selectedIds.length < 3) return;

    const selected = elements.filter(el => selectedIds.includes(el.id)).sort((a, b) => a.y - b.y);
    const first = selected[0];
    const last = selected[selected.length - 1];
    const totalSpace = (last.y + last.height) - first.y;
    const totalHeight = selected.reduce((sum, el) => sum + el.height, 0);
    const gap = (totalSpace - totalHeight) / (selected.length - 1);

    let currentY = first.y + first.height + gap;
    setElements(elements.map(el => {
      const index = selected.findIndex(s => s.id === el.id);
      if (index > 0 && index < selected.length - 1) {
        const newEl = { ...el, y: currentY };
        currentY += el.height + gap;
        return newEl;
      }
      return el;
    }));
    saveHistory();
  };

  const createGroup = () => {
    if (selectedIds.length < 2) return;

    const newGroup: Group = {
      id: Date.now(),
      name: `Group ${groups.length + 1}`,
      elementIds: selectedIds
    };

    setGroups([...groups, newGroup]);
    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? { ...el, groupId: newGroup.id } : el
    ));
    saveHistory();
  };

  const ungroupSelected = () => {
    const groupIds = new Set(
      elements.filter(el => selectedIds.includes(el.id)).map(el => el.groupId).filter(Boolean)
    );

    setGroups(groups.filter(g => !groupIds.has(g.id)));
    setElements(elements.map(el =>
      groupIds.has(el.groupId) ? { ...el, groupId: null } : el
    ));
    saveHistory();
  };

  const bringToFront = () => {
    const maxZ = Math.max(...elements.map(e => e.zIndex));
    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? { ...el, zIndex: maxZ + 1 } : el
    ));
    saveHistory();
  };

  const sendToBack = () => {
    const minZ = Math.min(...elements.map(e => e.zIndex));
    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? { ...el, zIndex: minZ - 1 } : el
    ));
    saveHistory();
  };

  const booleanUnion = () => {
    if (selectedIds.length < 2) return;

    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    const minX = Math.min(...selectedElements.map(el => el.x));
    const minY = Math.min(...selectedElements.map(el => el.y));
    const maxX = Math.max(...selectedElements.map(el => el.x + el.width));
    const maxY = Math.max(...selectedElements.map(el => el.y + el.height));

    const maxZ = Math.max(...elements.map(e => e.zIndex));
    const unionElement: Element = {
      id: Date.now(),
      type: 'rectangle',
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      fill: selectedElements[0].fill,
      rotation: 0,
      opacity: 1,
      layerName: `Union ${elements.length + 1}`,
      groupId: null,
      zIndex: maxZ + 1,
      locked: false,
      visible: true,
      borderRadius: 0,
      blur: 0
    };

    setElements([...elements.filter(el => !selectedIds.includes(el.id)), unionElement]);
    setSelectedIds([unionElement.id]);
    saveHistory();
  };

  const booleanSubtract = () => {
    if (selectedIds.length !== 2) return;

    const base = elements.find(el => el.id === selectedIds[0]);
    const subtract = elements.find(el => el.id === selectedIds[1]);

    if (!base || !subtract) return;

    const remaining: Element = {
      ...base,
      id: Date.now(),
      layerName: `Subtract ${elements.length + 1}`
    };

    setElements([...elements.filter(el => !selectedIds.includes(el.id)), remaining]);
    setSelectedIds([remaining.id]);
    saveHistory();
  };

  const createComponent = () => {
    if (selectedIds.length !== 1) return;

    const element = elements.find(el => el.id === selectedIds[0]);
    if (!element) return;

    const newComponent: Component = {
      id: Date.now(),
      name: `Component ${components.length + 1}`,
      masterElement: { ...element },
      instances: [element.id],
      variants: [
        { id: 'default', name: 'Default', properties: {} },
        { id: 'hover', name: 'Hover', properties: { opacity: 0.8 } },
        { id: 'pressed', name: 'Pressed', properties: { opacity: 0.6 } }
      ]
    };

    setComponents([...components, newComponent]);
    setElements(elements.map(el =>
      el.id === element.id
        ? { ...el, isComponent: true, componentId: newComponent.id, componentVariant: 'default' }
        : el
    ));
    saveHistory();
  };

  const createTextStyle = () => {
    if (selectedIds.length !== 1) return;
    const element = elements.find(el => el.id === selectedIds[0]);
    if (!element || element.type !== 'text') return;

    const newStyle: TextStyle = {
      id: `text-${Date.now()}`,
      name: `Text Style ${textStyles.length + 1}`,
      fontFamily: element.fontFamily || 'Arial, sans-serif',
      fontSize: element.fontSize || 16,
      fontWeight: element.fontWeight || 'normal',
      fontStyle: element.fontStyle || 'normal'
    };

    setTextStyles([...textStyles, newStyle]);
    setElements(elements.map(el =>
      el.id === element.id ? { ...el, textStyleId: newStyle.id } : el
    ));
    saveHistory();
  };

  const createColorStyle = () => {
    if (selectedIds.length !== 1) return;
    const element = elements.find(el => el.id === selectedIds[0]);
    if (!element) return;

    const newStyle: ColorStyle = {
      id: `color-${Date.now()}`,
      name: `Color ${colorStyles.length + 1}`,
      color: element.fill
    };

    setColorStyles([...colorStyles, newStyle]);
    setElements(elements.map(el =>
      el.id === element.id ? { ...el, colorStyleId: newStyle.id } : el
    ));
    saveHistory();
  };

  const applyTextStyle = (styleId: string) => {
    const style = textStyles.find(s => s.id === styleId);
    if (!style) return;

    setElements(elements.map(el =>
      selectedIds.includes(el.id) && el.type === 'text'
        ? {
            ...el,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            fontStyle: style.fontStyle,
            textStyleId: styleId
          }
        : el
    ));
    saveHistory();
  };

  const applyColorStyle = (styleId: string) => {
    const style = colorStyles.find(s => s.id === styleId);
    if (!style) return;

    setElements(elements.map(el =>
      selectedIds.includes(el.id)
        ? { ...el, fill: style.color, colorStyleId: styleId }
        : el
    ));
    saveHistory();
  };

  const toggleAutoLayout = () => {
    if (selectedIds.length !== 1) return;

    setElements(elements.map(el =>
      selectedIds.includes(el.id)
        ? {
            ...el,
            autoLayout: el.autoLayout ? undefined : {
              direction: 'horizontal',
              spacing: 10,
              padding: 10,
              alignment: 'start',
              wrap: false
            }
          }
        : el
    ));
    saveHistory();
  };

  const updateAutoLayout = <K extends keyof NonNullable<Element['autoLayout']>>(
    property: K,
    value: NonNullable<Element['autoLayout']>[K]
  ) => {
    setElements(elements.map(el =>
      selectedIds.includes(el.id) && el.autoLayout
        ? { ...el, autoLayout: { ...el.autoLayout, [property]: value } }
        : el
    ));
    saveHistory();
  };

  const setConstraints = (horizontal: string, vertical: string) => {
    setElements(elements.map(el =>
      selectedIds.includes(el.id)
        ? { ...el, constraints: { horizontal: horizontal as any, vertical: vertical as any } }
        : el
    ));
    saveHistory();
  };

  const addShadow = () => {
    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? {
        ...el,
        shadow: el.shadow || { offsetX: 2, offsetY: 2, blur: 4, color: 'rgba(0,0,0,0.3)' }
      } : el
    ));
    saveHistory();
  };

  const removeShadow = () => {
    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? { ...el, shadow: undefined } : el
    ));
    saveHistory();
  };

  const addGradient = () => {
    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? {
        ...el,
        gradient: el.gradient || {
          type: 'linear',
          stops: [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#8b5cf6' }
          ],
          angle: 0
        }
      } : el
    ));
    saveHistory();
  };

  const removeGradient = () => {
    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? { ...el, gradient: undefined } : el
    ));
    saveHistory();
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.elements) setElements(data.elements);
        if (data.groups) setGroups(data.groups);
        saveHistory();
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const moveUp = (shiftPressed: boolean) => {
    const shift = shiftPressed ? 10 : 1;
    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? { ...el, y: el.y - shift } : el
    ));
  };

  const moveDown = (shiftPressed: boolean) => {
    const shift = shiftPressed ? 10 : 1;
    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? { ...el, y: el.y + shift } : el
    ));
  };

  const moveLeft = (shiftPressed: boolean) => {
    const shift = shiftPressed ? 10 : 1;
    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? { ...el, x: el.x - shift } : el
    ));
  };

  const moveRight = (shiftPressed: boolean) => {
    const shift = shiftPressed ? 10 : 1;
    setElements(elements.map(el =>
      selectedIds.includes(el.id) ? { ...el, x: el.x + shift } : el
    ));
  };

  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onDuplicate: duplicateSelected,
    onDelete: deleteSelected,
    onGroup: createGroup,
    onSetTool: setTool,
    onFinishPath: finishPath,
    onCancelPath: () => {
      setPenPoints([]);
      setIsDrawingPath(false);
      setTool('select');
    },
    onToggleLock: toggleLock,
    onToggleSnapToGrid: () => setSnapToGrid(!snapToGrid),
    onToggleSmartGuides: () => setShowSmartGuides(!showSmartGuides),
    onCopy: copySelected,
    onPaste: pasteFromClipboard,
    onCut: () => {
      copySelected();
      deleteSelected();
    },
    onSelectAll: () => selectAll(elements),
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onFitToScreen: () => fitToScreen(canvasContainerRef, elements),
    onDeselect: deselectAll,
    onFinishTextEdit: finishTextEdit,
    onCancelTextEdit: () => {
      setEditingTextId(null);
      setEditingText('');
    },
    onMoveUp: moveUp,
    onMoveDown: moveDown,
    onMoveLeft: moveLeft,
    onMoveRight: moveRight,
    onBringToFront: bringToFront,
    onSendToBack: sendToBack,
    onStartPanning: () => setIsPanning(true),
    onStopPanning: () => setIsPanning(false),
    setShiftKey,
    setAltKey,
    isDrawingPath,
    editingTextId,
    selectedIds
  });

  const selectedElements = elements.filter(el => selectedIds.includes(el.id));
  const selectedElement = selectedElements.length === 1 ? selectedElements[0] : null;
  const hasMultipleSelected = selectedIds.length > 1;
  const hasTextSelected = selectedIds.length === 1 && selectedElement?.type === 'text';

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} overflow-hidden`}>
      <Toolbar
        tool={tool}
        setTool={setTool}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        selectedIds={selectedIds}
        onDuplicate={duplicateSelected}
        onDelete={deleteSelected}
        onToggleLock={toggleLock}
        onCreateGroup={createGroup}
        onCreateComponent={createComponent}
        showStylesPanel={showStylesPanel}
        onToggleStylesPanel={() => setShowStylesPanel(!showStylesPanel)}
        showLayers={showLayers}
        onToggleLayers={() => setShowLayers(!showLayers)}
        onImportJSON={importJSON}
        onExportJSON={() => exportToJSON({ elements, groups })}
        onExportSVG={() => canvasRef.current && exportToSVG(canvasRef.current)}
        onImageUpload={handleImageUpload}
        selectedElementLocked={selectedElement?.locked}
        fileInputRef={fileInputRef}
      />

      {showLayers && (
        <LayersPanel
          elements={elements}
          selectedIds={selectedIds}
          darkMode={darkMode}
          onSelectElement={(id) => setSelectedIds([id])}
        />
      )}

      {showStylesPanel && (
        <StylesPanel
          textStyles={textStyles}
          colorStyles={colorStyles}
          darkMode={darkMode}
          selectedIds={selectedIds}
          onCreateTextStyle={createTextStyle}
          onCreateColorStyle={createColorStyle}
          onApplyTextStyle={applyTextStyle}
          onApplyColorStyle={applyColorStyle}
          hasTextSelected={hasTextSelected}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          zoom={zoom}
          darkMode={darkMode}
          snapToGrid={snapToGrid}
          showSmartGuides={showSmartGuides}
          selectedIds={selectedIds}
          shiftKey={shiftKey}
          altKey={altKey}
          isDrawingPath={isDrawingPath}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFitToScreen={() => fitToScreen(canvasContainerRef, elements)}
          onToggleSnapToGrid={() => setSnapToGrid(!snapToGrid)}
          onToggleSmartGuides={() => setShowSmartGuides(!showSmartGuides)}
          onSelectAll={() => selectAll(elements)}
          onDeselectAll={deselectAll}
          onBooleanUnion={booleanUnion}
          onBooleanSubtract={booleanSubtract}
          onDistributeHorizontally={distributeHorizontally}
          onDistributeVertically={distributeVertically}
          onAlignLeft={alignLeft}
          onAlignCenter={alignCenter}
          onAlignRight={alignRight}
          onAlignMiddle={alignMiddle}
          onAlignTop={alignTop}
          onAlignBottom={alignBottom}
          onFinishPath={finishPath}
          onExportSVG={() => canvasRef.current && exportToSVG(canvasRef.current)}
          onExportPNG={() => canvasRef.current && exportToPNG(canvasRef.current)}
          totalElements={elements.filter(el => !el.locked && el.visible !== false).length}
        />

        <div ref={canvasContainerRef} className="flex-1 overflow-auto">
          <svg
            ref={canvasRef}
            width="2000"
            height="2000"
            className={darkMode ? 'bg-gray-900' : 'bg-white'}
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              cursor: isPanning || tool === 'hand' ? 'grab' : tool === 'select' ? 'default' : tool === 'eyedropper' ? 'crosshair' : 'crosshair',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0'
            }}
          >
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
              </pattern>

              {elements.filter(el => el.gradient).map(element => {
                const gradId = getGradientId(element.id);
                if (element.gradient?.type === 'linear') {
                  const angle = element.gradient.angle || 0;
                  const x1 = 50 - 50 * Math.cos((angle * Math.PI) / 180);
                  const y1 = 50 - 50 * Math.sin((angle * Math.PI) / 180);
                  const x2 = 50 + 50 * Math.cos((angle * Math.PI) / 180);
                  const y2 = 50 + 50 * Math.sin((angle * Math.PI) / 180);

                  return (
                    <linearGradient key={gradId} id={gradId} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}>
                      {element.gradient.stops.map((stop, i) => (
                        <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                      ))}
                    </linearGradient>
                  );
                } else {
                  return (
                    <radialGradient key={gradId} id={gradId}>
                      {element.gradient!.stops.map((stop, i) => (
                        <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} />
                      ))}
                    </radialGradient>
                  );
                }
              })}
            </defs>
            <rect width="2000" height="2000" fill="url(#grid)" />

            {smartGuides.map((guide, i) => (
              guide.type === 'vertical' ? (
                <line
                  key={i}
                  x1={guide.position}
                  y1="0"
                  x2={guide.position}
                  y2="2000"
                  stroke="#ff00ff"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                />
              ) : (
                <line
                  key={i}
                  x1="0"
                  y1={guide.position}
                  x2="2000"
                  y2={guide.position}
                  stroke="#ff00ff"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                />
              )
            ))}

            {selectionBox && (
              <rect
                x={Math.min(selectionBox.startX, selectionBox.endX)}
                y={Math.min(selectionBox.startY, selectionBox.endY)}
                width={Math.abs(selectionBox.endX - selectionBox.startX)}
                height={Math.abs(selectionBox.endY - selectionBox.startY)}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="#3b82f6"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
            )}

            {isDrawing && drawPreview && (
              <>
                {tool === 'rectangle' && (
                  <rect
                    x={drawPreview.x}
                    y={drawPreview.y}
                    width={drawPreview.width}
                    height={drawPreview.height}
                    fill="rgba(59, 130, 246, 0.2)"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                )}
                {tool === 'circle' && (
                  <ellipse
                    cx={drawPreview.x + drawPreview.width / 2}
                    cy={drawPreview.y + drawPreview.height / 2}
                    rx={drawPreview.width / 2}
                    ry={drawPreview.height / 2}
                    fill="rgba(59, 130, 246, 0.2)"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                )}
                {tool === 'line' && (
                  <line
                    x1={drawPreview.x}
                    y1={drawPreview.y + drawPreview.height / 2}
                    x2={drawPreview.x + drawPreview.width}
                    y2={drawPreview.y + drawPreview.height / 2}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                )}
                {tool === 'frame' && (
                  <rect
                    x={drawPreview.x}
                    y={drawPreview.y}
                    width={drawPreview.width}
                    height={drawPreview.height}
                    fill="rgba(139, 92, 246, 0.1)"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                )}
                {tool === 'arrow' && (
                  <>
                    <line
                      x1={drawPreview.x}
                      y1={drawPreview.y + drawPreview.height / 2}
                      x2={drawPreview.x + drawPreview.width}
                      y2={drawPreview.y + drawPreview.height / 2}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                    <path
                      d={generateArrowPath(drawPreview.x, drawPreview.y, drawPreview.width, drawPreview.height, 10).head}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="5,5"
                    />
                  </>
                )}
                {tool === 'polygon' && (
                  <path
                    d={generatePolygonPath(drawPreview.x, drawPreview.y, drawPreview.width, drawPreview.height, 6)}
                    fill="rgba(59, 130, 246, 0.2)"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                )}
                {tool === 'star' && (
                  <path
                    d={generateStarPath(drawPreview.x, drawPreview.y, drawPreview.width, drawPreview.height, 5)}
                    fill="rgba(59, 130, 246, 0.2)"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                )}
              </>
            )}

            {[...elements].filter(el => el.visible !== false).sort((a, b) => a.zIndex - b.zIndex).map(element => {
              const fillValue = element.gradient ? `url(#${getGradientId(element.id)})` : element.fill;
              const shadowFilter = element.shadow
                ? `drop-shadow(${element.shadow.offsetX}px ${element.shadow.offsetY}px ${element.shadow.blur}px ${element.shadow.color})`
                : undefined;

              const isSelected = selectedIds.includes(element.id);
              const blurFilter = element.blur ? `blur(${element.blur}px)` : '';
              const combinedFilter = [shadowFilter, blurFilter].filter(Boolean).join(' ');

              return (
                <g key={element.id}>
                  <g
                    onMouseDown={(e) => handleMouseDown(e, element)}
                    opacity={element.opacity}
                    style={{ filter: combinedFilter }}
                  >
                    {element.type === 'frame' && (
                      <rect
                        x={element.x}
                        y={element.y}
                        width={element.width}
                        height={element.height}
                        fill={fillValue}
                        stroke={element.frameColor || '#8b5cf6'}
                        strokeWidth="2"
                        rx={element.borderRadius || 0}
                        ry={element.borderRadius || 0}
                        style={{ cursor: element.locked ? 'not-allowed' : 'move' }}
                      />
                    )}
                    {element.type === 'rectangle' && (
                      <rect
                        x={element.x}
                        y={element.y}
                        width={element.width}
                        height={element.height}
                        fill={fillValue}
                        stroke={isSelected ? '#3b82f6' : element.stroke || 'none'}
                        strokeWidth={isSelected ? 2 : element.strokeWidth || 0}
                        rx={element.borderRadius || 0}
                        ry={element.borderRadius || 0}
                        style={{ cursor: element.locked ? 'not-allowed' : 'move' }}
                        transform={`rotate(${element.rotation || 0} ${element.x + element.width / 2} ${element.y + element.height / 2})`}
                      />
                    )}
                    {element.type === 'circle' && (
                      <ellipse
                        cx={element.x + element.width / 2}
                        cy={element.y + element.height / 2}
                        rx={element.width / 2}
                        ry={element.height / 2}
                        fill={fillValue}
                        stroke={isSelected ? '#3b82f6' : element.stroke || 'none'}
                        strokeWidth={isSelected ? 2 : element.strokeWidth || 0}
                        style={{ cursor: element.locked ? 'not-allowed' : 'move' }}
                      />
                    )}
                    {element.type === 'image' && element.imageUrl && (
                      <image
                        x={element.x}
                        y={element.y}
                        width={element.width}
                        height={element.height}
                        href={element.imageUrl}
                        style={{ cursor: element.locked ? 'not-allowed' : 'move' }}
                        clipPath={element.borderRadius ? `inset(0 round ${element.borderRadius}px)` : undefined}
                      />
                    )}
                    {element.type === 'line' && (
                      <line
                        x1={element.x}
                        y1={element.y + element.height / 2}
                        x2={element.x + element.width}
                        y2={element.y + element.height / 2}
                        stroke={element.stroke || '#000000'}
                        strokeWidth={element.strokeWidth || 2}
                        style={{ cursor: element.locked ? 'not-allowed' : 'move' }}
                      />
                    )}
                    {element.type === 'path' && element.path && (
                      <path
                        d={element.path}
                        fill={fillValue}
                        stroke={isSelected ? '#3b82f6' : element.stroke || '#000000'}
                        strokeWidth={isSelected ? 3 : element.strokeWidth || 2}
                        style={{ cursor: element.locked ? 'not-allowed' : 'move' }}
                      />
                    )}
                    {element.type === 'arrow' && (
                      <>
                        <line
                          x1={element.x}
                          y1={element.y + element.height / 2}
                          x2={element.x + element.width}
                          y2={element.y + element.height / 2}
                          stroke={isSelected ? '#3b82f6' : element.stroke || '#000000'}
                          strokeWidth={element.strokeWidth || 2}
                          style={{ cursor: element.locked ? 'not-allowed' : 'move' }}
                        />
                        <path
                          d={generateArrowPath(element.x, element.y, element.width, element.height, element.arrowHeadSize || 10).head}
                          stroke={isSelected ? '#3b82f6' : element.stroke || '#000000'}
                          strokeWidth={element.strokeWidth || 2}
                          fill="none"
                          style={{ cursor: element.locked ? 'not-allowed' : 'move' }}
                        />
                      </>
                    )}
                    {element.type === 'polygon' && (
                      <path
                        d={generatePolygonPath(element.x, element.y, element.width, element.height, element.points || 6)}
                        fill={fillValue}
                        stroke={isSelected ? '#3b82f6' : element.stroke || 'none'}
                        strokeWidth={isSelected ? 2 : element.strokeWidth || 0}
                        style={{ cursor: element.locked ? 'not-allowed' : 'move' }}
                      />
                    )}
                    {element.type === 'star' && (
                      <path
                        d={generateStarPath(element.x, element.y, element.width, element.height, element.points || 5)}
                        fill={fillValue}
                        stroke={isSelected ? '#3b82f6' : element.stroke || 'none'}
                        strokeWidth={isSelected ? 2 : element.strokeWidth || 0}
                        style={{ cursor: element.locked ? 'not-allowed' : 'move' }}
                      />
                    )}
                    {element.type === 'text' && (
                      <>
                        <rect
                          x={element.x}
                          y={element.y}
                          width={element.width}
                          height={element.height}
                          fill="transparent"
                          stroke={isSelected ? '#3b82f6' : 'none'}
                          strokeWidth="2"
                          style={{ cursor: element.locked ? 'not-allowed' : 'move' }}
                        />
                        {editingTextId === element.id ? (
                          <foreignObject
                            x={element.x}
                            y={element.y}
                            width={element.width}
                            height={element.height}
                          >
                            <div style={{ width: '100%', height: '100%', padding: '10px' }}>
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                onBlur={finishTextEdit}
                                autoFocus
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  border: 'none',
                                  outline: 'none',
                                  background: 'transparent',
                                  color: element.fill,
                                  fontSize: `${element.fontSize}px`,
                                  fontFamily: 'inherit',
                                  resize: 'none',
                                  padding: 0
                                }}
                              />
                            </div>
                          </foreignObject>
                        ) : (
                          <text
                            x={element.x + 10}
                            y={element.y + (element.fontSize || 16) + 10}
                            fill={element.fill}
                            fontSize={element.fontSize}
                            fontWeight={element.fontWeight || 'normal'}
                            fontStyle={element.fontStyle || 'normal'}
                            textDecoration={element.textDecoration || 'none'}
                            textAnchor={element.textAlign === 'center' ? 'middle' : element.textAlign === 'right' ? 'end' : 'start'}
                            fontFamily={element.fontFamily || 'Arial, sans-serif'}
                            style={{ cursor: element.locked ? 'not-allowed' : 'move', userSelect: 'none' }}
                            onDoubleClick={(e) => handleTextDoubleClick(e, element)}
                          >
                            {element.text}
                          </text>
                        )}
                      </>
                    )}
                  </g>

                  {isSelected && !element.locked && element.type !== 'line' && element.type !== 'path' && element.type !== 'arrow' && selectedIds.length === 1 && (
                    <g>
                      {['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'].map((handle) => {
                        let x = element.x;
                        let y = element.y;
                        let cursor = 'nwse-resize';

                        if (handle.includes('e')) x = element.x + element.width;
                        if (handle.includes('w')) x = element.x;
                        if (handle.includes('s')) y = element.y + element.height;
                        if (handle.includes('n')) y = element.y;
                        if (!handle.includes('n') && !handle.includes('s')) y = element.y + element.height / 2;
                        if (!handle.includes('e') && !handle.includes('w')) x = element.x + element.width / 2;

                        if (handle === 'ne' || handle === 'sw') cursor = 'nesw-resize';
                        if (handle === 'n' || handle === 's') cursor = 'ns-resize';
                        if (handle === 'e' || handle === 'w') cursor = 'ew-resize';

                        return (
                          <rect
                            key={handle}
                            x={x - 4}
                            y={y - 4}
                            width="8"
                            height="8"
                            fill="white"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            style={{ cursor }}
                            onMouseDown={(e) => handleResizeMouseDown(e, element.id, handle)}
                          />
                        );
                      })}
                    </g>
                  )}
                </g>
              );
            })}

            {isDrawingPath && penPoints.length > 0 && (
              <>
                <path
                  d={penPoints.map((p, i) =>
                    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
                  ).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
                {penPoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="4" fill="#3b82f6" />
                ))}
              </>
            )}
          </svg>
        </div>
      </div>

      <PropertiesPanel
        selectedElement={selectedElement}
        hasMultipleSelected={hasMultipleSelected}
        selectedCount={selectedIds.length}
        darkMode={darkMode}
        onUpdateProperty={updateProperty}
        onToggleAutoLayout={toggleAutoLayout}
        onUpdateAutoLayout={updateAutoLayout}
        onSetConstraints={setConstraints}
        onAddShadow={addShadow}
        onRemoveShadow={removeShadow}
        onAddGradient={addGradient}
        onRemoveGradient={removeGradient}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onToggleLock={toggleLock}
        onToggleVisibility={toggleVisibility}
        onCreateGroup={createGroup}
        onUngroupSelected={ungroupSelected}
      />
    </div>
  );
}
