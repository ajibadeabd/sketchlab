import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Square, Circle, Type, MousePointer, Trash2, Copy, 
  Download, Layers, FolderPlus, Undo2, Redo2,
  ZoomIn, ZoomOut, Minus, Lock, Unlock, Upload,
  AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter, Pen, Save
} from 'lucide-react';

type ToolType = 'select' | 'rectangle' | 'circle' | 'text' | 'line' | 'pen';

interface Point {
  x: number;
  y: number;
}

interface Element {
  id: number;
  type: 'rectangle' | 'circle' | 'text' | 'line' | 'path' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: string;
  rotation?: number;
  opacity?: number;
  layerName?: string;
  groupId?: number | null;
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
  path?: string;
  borderRadius?: number;
  imageUrl?: string;
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
  gradient?: {
    type: 'linear' | 'radial';
    stops: Array<{ offset: number; color: string }>;
    angle?: number;
  };
}

interface Group {
  id: number;
  name: string;
  elementIds: number[];
}

interface HistoryState {
  elements: Element[];
  groups: Group[];
}

export default function DesignTool() {
  const [tool, setTool] = useState<ToolType>('select');
  const [elements, setElements] = useState<Element[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState<{ id: number; handle: string } | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number; elemX: number; elemY: number } | null>(null);
  const [shiftKey, setShiftKey] = useState(false);
  const [altKey, setAltKey] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const gridSize = 20;
  const [editingTextId, setEditingTextId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showSmartGuides, setShowSmartGuides] = useState(true);
  const [smartGuides, setSmartGuides] = useState<Array<{ type: 'vertical' | 'horizontal'; position: number }>>([]);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [isSelectingBox, setIsSelectingBox] = useState(false);
  const [clipboard, setClipboard] = useState<Element[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showLayers, setShowLayers] = useState(true);
  const [penPoints, setPenPoints] = useState<Point[]>([]);
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  
  const canvasRef = useRef<SVGSVGElement>(null);

  const saveHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ elements: [...elements], groups: [...groups] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [elements, groups, history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setElements(prevState.elements);
      setGroups(prevState.groups);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setElements(nextState.elements);
      setGroups(nextState.groups);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const addElement = (type: 'rectangle' | 'circle' | 'text' | 'line') => {
    const maxZ = elements.length > 0 ? Math.max(...elements.map(e => e.zIndex)) : 0;
    const newElement: Element = {
      id: Date.now(),
      type,
      x: 100 + pan.x / zoom,
      y: 100 + pan.y / zoom,
      width: type === 'text' ? 200 : type === 'line' ? 150 : 150,
      height: type === 'text' ? 50 : type === 'line' ? 2 : 150,
      fill: type === 'text' ? '#000000' : type === 'line' ? 'transparent' : '#3b82f6',
      stroke: type === 'line' ? '#000000' : undefined,
      strokeWidth: type === 'line' ? 2 : undefined,
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
      borderRadius: 0
    };
    setElements([...elements, newElement]);
    setSelectedIds([newElement.id]);
    setTool('select');
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

    if (tool === 'rectangle') {
      addElement('rectangle');
    } else if (tool === 'circle') {
      addElement('circle');
    } else if (tool === 'text') {
      addElement('text');
    } else if (tool === 'line') {
      addElement('line');
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
    if (tool !== 'select') return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Check if clicking on an element
    const clicked = [...elements]
      .filter(el => el.visible !== false)
      .sort((a, b) => b.zIndex - a.zIndex)
      .find(el => 
        !el.locked &&
        x >= el.x && x <= el.x + el.width &&
        y >= el.y && y <= el.y + el.height
      );

    if (!clicked) {
      // Start selection box
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

  const snapToGridValue = (value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
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

  const calculateSmartGuides = (movingElement: Element, newX: number, newY: number) => {
    if (!showSmartGuides) return [];
    
    const guides: Array<{ type: 'vertical' | 'horizontal'; position: number }> = [];
    const threshold = 5;
    
    const otherElements = elements.filter(el => el.id !== movingElement.id && el.visible !== false);
    
    for (const el of otherElements) {
      // Vertical alignment (X positions)
      if (Math.abs(newX - el.x) < threshold) {
        guides.push({ type: 'vertical', position: el.x });
      }
      if (Math.abs(newX + movingElement.width - (el.x + el.width)) < threshold) {
        guides.push({ type: 'vertical', position: el.x + el.width });
      }
      if (Math.abs(newX + movingElement.width / 2 - (el.x + el.width / 2)) < threshold) {
        guides.push({ type: 'vertical', position: el.x + el.width / 2 });
      }
      
      // Horizontal alignment (Y positions)
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

    // Handle selection box
    if (isSelectingBox && selectionBox) {
      setSelectionBox({ ...selectionBox, endX: mouseX, endY: mouseY });
      return;
    }

    // Handle resizing
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

      // Aspect ratio lock with Shift key
      if (shiftKey && isCornerHandle) {
        const absWidth = Math.abs(resizeStart.width + (resizing.handle.includes('e') ? deltaX : -deltaX));
        const absHeight = Math.abs(resizeStart.height + (resizing.handle.includes('s') ? deltaY : -deltaY));
        
        if (absWidth / aspectRatio > absHeight) {
          deltaY = (absWidth / aspectRatio - resizeStart.height) * (resizing.handle.includes('n') ? -1 : 1);
        } else {
          deltaX = (absHeight * aspectRatio - resizeStart.width) * (resizing.handle.includes('w') ? -1 : 1);
        }
      }

      // Calculate new dimensions based on handle
      if (altKey) {
        // Resize from center
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
        // Normal resize
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

      // Prevent negative dimensions
      if (newWidth < 10) {
        newWidth = 10;
        if (resizing.handle.includes('w')) newX = element.x + element.width - 10;
      }
      if (newHeight < 10) {
        newHeight = 10;
        if (resizing.handle.includes('n')) newY = element.y + element.height - 10;
      }

      // Apply snap to grid
      if (snapToGrid) {
        newX = snapToGridValue(newX);
        newY = snapToGridValue(newY);
        newWidth = snapToGridValue(newWidth);
        newHeight = snapToGridValue(newHeight);
      }

      setElements(elements.map(el =>
        el.id === resizing.id
          ? { ...el, x: newX, y: newY, width: newWidth, height: newHeight }
          : el
      ));
      return;
    }
    
    // Handle dragging
    if (!dragging) return;
    
    let x = mouseX - offset.x;
    let y = mouseY - offset.y;

    const draggedElement = elements.find(el => el.id === dragging);
    if (!draggedElement) return;

    // Calculate smart guides
    if (showSmartGuides && !snapToGrid) {
      const guides = calculateSmartGuides(draggedElement, x, y);
      setSmartGuides(guides);
      
      // Snap to guides
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

    // Apply snap to grid for dragging
    if (snapToGrid) {
      x = snapToGridValue(x);
      y = snapToGridValue(y);
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
    if (isSelectingBox && selectionBox) {
      // Select elements within box
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

  const exportJSON = () => {
    const data = { elements, groups };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'design.json';
    link.click();
    URL.revokeObjectURL(url);
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

  const exportSVG = () => {
    const svg = canvasRef.current;
    if (!svg) return;
    
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'design.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = () => {
    const svg = canvasRef.current;
    if (!svg) return;
    
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 2000;
    canvas.height = 2000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'design.png';
        link.click();
        URL.revokeObjectURL(url);
      });
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
  };

  const getGradientId = (element: Element) => `gradient-${element.id}`;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // Track modifier keys
      if (e.key === 'Shift') setShiftKey(true);
      if (e.key === 'Alt') setAltKey(true);
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault();
        createGroup();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      } else if (e.key === 'v') {
        setTool('select');
      } else if (e.key === 'r') {
        setTool('rectangle');
      } else if (e.key === 'c') {
        setTool('circle');
      } else if (e.key === 't') {
        setTool('text');
      } else if (e.key === 'p') {
        setTool('pen');
      } else if (e.key === 'Escape' && isDrawingPath) {
        setPenPoints([]);
        setIsDrawingPath(false);
        setTool('select');
      } else if (e.key === 'Enter' && isDrawingPath) {
        finishPath();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPanning(true);
      } else if (e.key === ']') {
        bringToFront();
      } else if (e.key === '[') {
        sendToBack();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        toggleLock();
      } else if ((e.metaKey || e.ctrlKey) && e.key === ';') {
        e.preventDefault();
        setSnapToGrid(!snapToGrid);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "'") {
        e.preventDefault();
        setShowSmartGuides(!showSmartGuides);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        e.preventDefault();
        copySelected();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        e.preventDefault();
        pasteFromClipboard();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'x') {
        e.preventDefault();
        copySelected();
        deleteSelected();
      } else if (e.key === 'Enter' && editingTextId !== null) {
        finishTextEdit();
      } else if (e.key === 'Escape' && editingTextId !== null) {
        setEditingTextId(null);
        setEditingText('');
      } else if (e.key === 'ArrowUp' && selectedIds.length > 0) {
        e.preventDefault();
        const shift = e.shiftKey ? 10 : 1;
        setElements(elements.map(el => 
          selectedIds.includes(el.id) ? { ...el, y: el.y - shift } : el
        ));
      } else if (e.key === 'ArrowDown' && selectedIds.length > 0) {
        e.preventDefault();
        const shift = e.shiftKey ? 10 : 1;
        setElements(elements.map(el => 
          selectedIds.includes(el.id) ? { ...el, y: el.y + shift } : el
        ));
      } else if (e.key === 'ArrowLeft' && selectedIds.length > 0) {
        e.preventDefault();
        const shift = e.shiftKey ? 10 : 1;
        setElements(elements.map(el => 
          selectedIds.includes(el.id) ? { ...el, x: el.x - shift } : el
        ));
      } else if (e.key === 'ArrowRight' && selectedIds.length > 0) {
        e.preventDefault();
        const shift = e.shiftKey ? 10 : 1;
        setElements(elements.map(el => 
          selectedIds.includes(el.id) ? { ...el, x: el.x + shift } : el
        ));
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsPanning(false);
      }
      if (e.key === 'Shift') setShiftKey(false);
      if (e.key === 'Alt') setAltKey(false);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedIds, elements, historyIndex, isPanning, isDrawingPath, penPoints, snapToGrid, showSmartGuides, editingTextId]);

  const selectedElements = elements.filter(el => selectedIds.includes(el.id));
  const selectedElement = selectedElements.length === 1 ? selectedElements[0] : null;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2 overflow-y-auto">
        <button
          onClick={() => setTool('select')}
          className={`p-3 rounded hover:bg-gray-100 ${tool === 'select' ? 'bg-blue-100' : ''}`}
          title="Select (V)"
        >
          <MousePointer size={20} />
        </button>
        <button
          onClick={() => setTool('rectangle')}
          className={`p-3 rounded hover:bg-gray-100 ${tool === 'rectangle' ? 'bg-blue-100' : ''}`}
          title="Rectangle (R)"
        >
          <Square size={20} />
        </button>
        <button
          onClick={() => setTool('circle')}
          className={`p-3 rounded hover:bg-gray-100 ${tool === 'circle' ? 'bg-blue-100' : ''}`}
          title="Circle (C)"
        >
          <Circle size={20} />
        </button>
        <button
          onClick={() => setTool('text')}
          className={`p-3 rounded hover:bg-gray-100 ${tool === 'text' ? 'bg-blue-100' : ''}`}
          title="Text (T)"
        >
          <Type size={20} />
        </button>
        <button
          onClick={() => setTool('line')}
          className={`p-3 rounded hover:bg-gray-100 ${tool === 'line' ? 'bg-blue-100' : ''}`}
          title="Line (L)"
        >
          <Minus size={20} />
        </button>
        <button
          onClick={() => setTool('pen')}
          className={`p-3 rounded hover:bg-gray-100 ${tool === 'pen' ? 'bg-blue-100' : ''}`}
          title="Pen Tool (P)"
        >
          <Pen size={20} />
        </button>
        
        <div className="h-px w-10 bg-gray-200 my-2" />
        
        <button onClick={undo} disabled={historyIndex <= 0} className="p-3 rounded hover:bg-gray-100 disabled:opacity-30" title="Undo (Cmd+Z)">
          <Undo2 size={20} />
        </button>
        <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-3 rounded hover:bg-gray-100 disabled:opacity-30" title="Redo (Cmd+Shift+Z)">
          <Redo2 size={20} />
        </button>
        
        <div className="h-px w-10 bg-gray-200 my-2" />
        
        <button onClick={duplicateSelected} disabled={selectedIds.length === 0} className="p-3 rounded hover:bg-gray-100 disabled:opacity-30" title="Duplicate (Cmd+D)">
          <Copy size={20} />
        </button>
        <button onClick={deleteSelected} disabled={selectedIds.length === 0} className="p-3 rounded hover:bg-gray-100 disabled:opacity-30" title="Delete">
          <Trash2 size={20} />
        </button>
        <button onClick={toggleLock} disabled={selectedIds.length === 0} className="p-3 rounded hover:bg-gray-100 disabled:opacity-30" title="Lock/Unlock (Cmd+L)">
          {selectedElement?.locked ? <Lock size={20} /> : <Unlock size={20} />}
        </button>
        <button onClick={createGroup} disabled={selectedIds.length < 2} className="p-3 rounded hover:bg-gray-100 disabled:opacity-30" title="Group (Cmd+G)">
          <FolderPlus size={20} />
        </button>
        
        <div className="h-px w-10 bg-gray-200 my-2" />
        
        <button onClick={() => setShowLayers(!showLayers)} className="p-3 rounded hover:bg-gray-100" title="Toggle Layers">
          <Layers size={20} />
        </button>
        <label className="p-3 rounded hover:bg-gray-100 cursor-pointer" title="Import JSON">
          <Upload size={20} />
          <input type="file" accept=".json" onChange={importJSON} className="hidden" />
        </label>
        <button onClick={exportJSON} className="p-3 rounded hover:bg-gray-100" title="Export JSON">
          <Save size={20} />
        </button>
        <button onClick={exportSVG} className="p-3 rounded hover:bg-gray-100" title="Export SVG">
          <Download size={20} />
        </button>
        
        <div className="h-px w-10 bg-gray-200 my-2" />
        
        <label className="p-3 rounded hover:bg-gray-100 cursor-pointer" title="Upload Image">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Upload size={20} />
        </label>
      </div>

      {/* Layers Panel */}
      {showLayers && (
        <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <h3 className="font-semibold mb-3">Layers</h3>
          <div className="space-y-1">
            {[...elements].sort((a, b) => b.zIndex - a.zIndex).map(el => (
              <div
                key={el.id}
                onClick={() => setSelectedIds([el.id])}
                className={`px-3 py-2 rounded text-sm cursor-pointer flex justify-between items-center ${
                  selectedIds.includes(el.id) ? 'bg-blue-100' : 'hover:bg-gray-100'
                } ${!el.visible ? 'opacity-50' : ''}`}
              >
                <span>{el.layerName || `${el.type} ${el.id}`}</span>
                {el.locked && <Lock size={14} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className="p-2 hover:bg-gray-100 rounded">
              <ZoomOut size={18} />
            </button>
            <span className="text-sm font-mono w-16 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(5, zoom + 0.1))} className="p-2 hover:bg-gray-100 rounded">
              <ZoomIn size={18} />
            </button>

            <div className="h-6 w-px bg-gray-300 mx-2" />
            
            <button 
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`px-3 py-1 rounded text-sm ${snapToGrid ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
              title="Toggle Snap to Grid (Cmd+;)"
            >
              Snap: {snapToGrid ? 'ON' : 'OFF'}
            </button>

            <button 
              onClick={() => setShowSmartGuides(!showSmartGuides)}
              className={`px-3 py-1 rounded text-sm ${showSmartGuides ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'}`}
              title="Toggle Smart Guides (Cmd+')"
            >
              Guides: {showSmartGuides ? 'ON' : 'OFF'}
            </button>
            
            {selectedIds.length >= 3 && (
              <>
                <div className="h-6 w-px bg-gray-300 mx-2" />
                <button onClick={distributeHorizontally} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm" title="Distribute Horizontally">
                  Distribute H
                </button>
                <button onClick={distributeVertically} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm" title="Distribute Vertically">
                  Distribute V
                </button>
              </>
            )}
            
            {selectedIds.length >= 2 && (
              <>
                <div className="h-6 w-px bg-gray-300 mx-2" />
                <button onClick={alignLeft} className="p-2 hover:bg-gray-100 rounded" title="Align Left">
                  <AlignLeft size={18} />
                </button>
                <button onClick={alignCenter} className="p-2 hover:bg-gray-100 rounded" title="Align Center">
                  <AlignCenter size={18} />
                </button>
                <button onClick={alignRight} className="p-2 hover:bg-gray-100 rounded" title="Align Right">
                  <AlignRight size={18} />
                </button>
                <button onClick={alignMiddle} className="p-2 hover:bg-gray-100 rounded" title="Align Middle">
                  <AlignHorizontalJustifyCenter size={18} />
                </button>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            {(shiftKey || altKey) && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded text-sm text-blue-700">
                {shiftKey && <span>⇧ Aspect Ratio Lock</span>}
                {shiftKey && altKey && <span>•</span>}
                {altKey && <span>⌥ Resize from Center</span>}
              </div>
            )}
            {isDrawingPath && (
              <button onClick={finishPath} className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm">
                Finish Path (Enter)
              </button>
            )}
            <button onClick={exportSVG} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm">
              Export SVG
            </button>
            <button onClick={exportPNG} className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm">
              Export PNG
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto">
          <svg
            ref={canvasRef}
            width="2000"
            height="2000"
            className="bg-white"
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ 
              cursor: isPanning ? 'grabbing' : tool === 'select' ? 'default' : 'crosshair',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
            }}
          >
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
              </pattern>
              
              {/* Gradients */}
              {elements.filter(el => el.gradient).map(element => {
                const gradId = getGradientId(element);
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
            
            {/* Smart Guides */}
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

            {/* Selection Box */}
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
            
            {/* Elements */}
            {[...elements].filter(el => el.visible !== false).sort((a, b) => a.zIndex - b.zIndex).map(element => {
              const fillValue = element.gradient ? `url(#${getGradientId(element)})` : element.fill;
              const shadowFilter = element.shadow 
                ? `drop-shadow(${element.shadow.offsetX}px ${element.shadow.offsetY}px ${element.shadow.blur}px ${element.shadow.color})`
                : undefined;
              
              const isSelected = selectedIds.includes(element.id);
              
              return (
                <g key={element.id}>
                  <g 
                    onMouseDown={(e) => handleMouseDown(e, element)} 
                    opacity={element.opacity}
                    style={{ filter: shadowFilter }}
                  >
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
                        transform={`rotate(${element.rotation || 0} ${element.x + element.width/2} ${element.y + element.height/2})`}
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
                  
                  {/* Resize Handles */}
                  {isSelected && !element.locked && element.type !== 'line' && element.type !== 'path' && selectedIds.length === 1 && (
                    <g>
                      {/* Corner handles */}
                      <rect
                        x={element.x - 4}
                        y={element.y - 4}
                        width="8"
                        height="8"
                        fill="white"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        style={{ cursor: 'nwse-resize' }}
                        onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'nw')}
                      />
                      <rect
                        x={element.x + element.width - 4}
                        y={element.y - 4}
                        width="8"
                        height="8"
                        fill="white"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        style={{ cursor: 'nesw-resize' }}
                        onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'ne')}
                      />
                      <rect
                        x={element.x - 4}
                        y={element.y + element.height - 4}
                        width="8"
                        height="8"
                        fill="white"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        style={{ cursor: 'nesw-resize' }}
                        onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'sw')}
                      />
                      <rect
                        x={element.x + element.width - 4}
                        y={element.y + element.height - 4}
                        width="8"
                        height="8"
                        fill="white"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        style={{ cursor: 'nwse-resize' }}
                        onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'se')}
                      />
                      
                      {/* Edge handles */}
                      <rect
                        x={element.x + element.width / 2 - 4}
                        y={element.y - 4}
                        width="8"
                        height="8"
                        fill="white"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        style={{ cursor: 'ns-resize' }}
                        onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'n')}
                      />
                      <rect
                        x={element.x + element.width / 2 - 4}
                        y={element.y + element.height - 4}
                        width="8"
                        height="8"
                        fill="white"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        style={{ cursor: 'ns-resize' }}
                        onMouseDown={(e) => handleResizeMouseDown(e, element.id, 's')}
                      />
                      <rect
                        x={element.x - 4}
                        y={element.y + element.height / 2 - 4}
                        width="8"
                        height="8"
                        fill="white"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        style={{ cursor: 'ew-resize' }}
                        onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'w')}
                      />
                      <rect
                        x={element.x + element.width - 4}
                        y={element.y + element.height / 2 - 4}
                        width="8"
                        height="8"
                        fill="white"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        style={{ cursor: 'ew-resize' }}
                        onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'e')}
                      />
                    </g>
                  )}
                </g>
              );
            })}
            
            {/* Drawing path preview */}
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

      {/* Properties Panel */}
      {selectedElement && (
        <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Properties</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Layer Name</label>
              <input
                type="text"
                value={selectedElement.layerName || ''}
                onChange={(e) => updateProperty('layerName', e.target.value)}
                className="w-full px-2 py-1 border rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm text-gray-600">X</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.x)}
                  onChange={(e) => updateProperty('x', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Y</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.y)}
                  onChange={(e) => updateProperty('y', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm text-gray-600">Width</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.width)}
                  onChange={(e) => updateProperty('width', parseInt(e.target.value) || 1)}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Height</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.height)}
                  onChange={(e) => updateProperty('height', parseInt(e.target.value) || 1)}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm text-gray-600">Rotation</label>
                <input
                  type="number"
                  value={selectedElement.rotation || 0}
                  onChange={(e) => updateProperty('rotation', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Opacity %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round((selectedElement.opacity || 1) * 100)}
                  onChange={(e) => updateProperty('opacity', (parseInt(e.target.value) || 100) / 100)}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm text-gray-600">Fill Color</label>
              <input
                type="color"
                value={selectedElement.fill}
                onChange={(e) => updateProperty('fill', e.target.value)}
                className="w-full h-10 border rounded cursor-pointer"
              />
            </div>

            {(selectedElement.type === 'rectangle' || selectedElement.type === 'image') && (
              <div>
                <label className="text-sm text-gray-600">Border Radius</label>
                <input
                  type="number"
                  min="0"
                  value={selectedElement.borderRadius || 0}
                  onChange={(e) => updateProperty('borderRadius', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
            )}

            {selectedElement.type !== 'text' && selectedElement.type !== 'image' && (
              <>
                <div>
                  <label className="text-sm text-gray-600">Stroke Color</label>
                  <input
                    type="color"
                    value={selectedElement.stroke || '#000000'}
                    onChange={(e) => updateProperty('stroke', e.target.value)}
                    className="w-full h-10 border rounded cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-600">Stroke Width</label>
                  <input
                    type="number"
                    value={selectedElement.strokeWidth || 0}
                    onChange={(e) => updateProperty('strokeWidth', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
              </>
            )}
            
            {selectedElement.type === 'text' && (
              <>
                <div>
                  <label className="text-sm text-gray-600">Text</label>
                  <textarea
                    value={selectedElement.text || ''}
                    onChange={(e) => updateProperty('text', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-600">Font Size</label>
                  <input
                    type="number"
                    value={selectedElement.fontSize || 16}
                    onChange={(e) => updateProperty('fontSize', parseInt(e.target.value) || 12)}
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Font Family</label>
                  <select
                    value={selectedElement.fontFamily || 'Arial, sans-serif'}
                    onChange={(e) => updateProperty('fontFamily', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                  >
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="'Courier New', monospace">Courier New</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                    <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => updateProperty('fontWeight', selectedElement.fontWeight === 'bold' ? 'normal' : 'bold')}
                    className={`flex-1 px-3 py-2 rounded text-sm ${selectedElement.fontWeight === 'bold' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                  >
                    <strong>B</strong> Bold
                  </button>
                  <button
                    onClick={() => updateProperty('fontStyle', selectedElement.fontStyle === 'italic' ? 'normal' : 'italic')}
                    className={`flex-1 px-3 py-2 rounded text-sm ${selectedElement.fontStyle === 'italic' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                  >
                    <em>I</em> Italic
                  </button>
                </div>

                <div>
                  <button
                    onClick={() => updateProperty('textDecoration', selectedElement.textDecoration === 'underline' ? 'none' : 'underline')}
                    className={`w-full px-3 py-2 rounded text-sm ${selectedElement.textDecoration === 'underline' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                  >
                    <u>U</u> Underline
                  </button>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Text Align</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateProperty('textAlign', 'left')}
                      className={`flex-1 px-3 py-2 rounded text-sm ${selectedElement.textAlign === 'left' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                    >
                      Left
                    </button>
                    <button
                      onClick={() => updateProperty('textAlign', 'center')}
                      className={`flex-1 px-3 py-2 rounded text-sm ${selectedElement.textAlign === 'center' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                    >
                      Center
                    </button>
                    <button
                      onClick={() => updateProperty('textAlign', 'right')}
                      className={`flex-1 px-3 py-2 rounded text-sm ${selectedElement.textAlign === 'right' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                    >
                      Right
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Effects Section */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Effects</h4>
              
              <div className="space-y-2">
                {selectedElement.shadow ? (
                  <button onClick={removeShadow} className="w-full px-3 py-2 bg-orange-100 hover:bg-orange-200 rounded text-sm">
                    Remove Shadow
                  </button>
                ) : (
                  <button onClick={addShadow} className="w-full px-3 py-2 bg-purple-100 hover:bg-purple-200 rounded text-sm">
                    Add Shadow
                  </button>
                )}
                
                {selectedElement.gradient ? (
                  <button onClick={removeGradient} className="w-full px-3 py-2 bg-orange-100 hover:bg-orange-200 rounded text-sm">
                    Remove Gradient
                  </button>
                ) : (
                  <button onClick={addGradient} className="w-full px-3 py-2 bg-purple-100 hover:bg-purple-200 rounded text-sm">
                    Add Gradient
                  </button>
                )}
              </div>
            </div>

            {/* Layer Controls */}
            <div className="pt-4 border-t space-y-2">
              <button onClick={bringToFront} className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm">
                Bring to Front (])
              </button>
              <button onClick={sendToBack} className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm">
                Send to Back ([)
              </button>
              <button onClick={toggleLock} className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm">
                {selectedElement.locked ? 'Unlock (Cmd+L)' : 'Lock (Cmd+L)'}
              </button>
              <button onClick={toggleVisibility} className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm">
                {selectedElement.visible === false ? 'Show' : 'Hide'}
              </button>
              {selectedIds.length >= 2 && (
                <button onClick={createGroup} className="w-full px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded text-sm">
                  Group Selection (Cmd+G)
                </button>
              )}
              {selectedElement.groupId && (
                <button onClick={ungroupSelected} className="w-full px-3 py-2 bg-orange-100 hover:bg-orange-200 rounded text-sm">
                  Ungroup
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}