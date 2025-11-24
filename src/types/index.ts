export type ToolType = 'select' | 'rectangle' | 'circle' | 'text' | 'line' | 'pen' | 'frame' | 'hand' | 'eyedropper' | 'arrow' | 'polygon' | 'star';

export interface Point {
  x: number;
  y: number;
}

export interface Element {
  id: number;
  type: 'rectangle' | 'circle' | 'text' | 'line' | 'path' | 'image' | 'frame' | 'arrow' | 'polygon' | 'star';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  points?: number;
  arrowHeadSize?: number;
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
  isFrame?: boolean;
  frameColor?: string;
  componentId?: number | null;
  isComponent?: boolean;
  componentProps?: Record<string, any>;
  componentVariant?: string;
  blur?: number;
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
  autoLayout?: {
    direction: 'horizontal' | 'vertical';
    spacing: number;
    padding: number;
    alignment: 'start' | 'center' | 'end' | 'space-between';
    wrap: boolean;
  };
  constraints?: {
    horizontal: 'left' | 'right' | 'center' | 'left-right' | 'scale';
    vertical: 'top' | 'bottom' | 'center' | 'top-bottom' | 'scale';
  };
  parentFrameId?: number | null;
  textStyleId?: string | null;
  colorStyleId?: string | null;
}

export interface Component {
  id: number;
  name: string;
  masterElement: Element;
  instances: number[];
  variants?: ComponentVariant[];
}

export interface ComponentVariant {
  id: string;
  name: string;
  properties: Record<string, any>;
}

export interface TextStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  lineHeight?: number;
  letterSpacing?: number;
}

export interface ColorStyle {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface Group {
  id: number;
  name: string;
  elementIds: number[];
}

export interface HistoryState {
  elements: Element[];
  groups: Group[];
}

export interface SmartGuide {
  type: 'vertical' | 'horizontal';
  position: number;
}

export interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface DrawPreview {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResizeState {
  id: number;
  handle: string;
}

export interface ResizeStart {
  x: number;
  y: number;
  width: number;
  height: number;
  elemX: number;
  elemY: number;
}
