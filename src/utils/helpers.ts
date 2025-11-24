export const snapToGridValue = (value: number, snapToGrid: boolean, gridSize: number = 20): number => {
  if (!snapToGrid) return value;
  return Math.round(value / gridSize) * gridSize;
};

export const getGradientId = (elementId: number): string => {
  return `gradient-${elementId}`;
};

export const exportToJSON = (data: any): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'design.json';
  link.click();
  URL.revokeObjectURL(url);
};

export const exportToSVG = (svgElement: SVGSVGElement): void => {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'design.svg';
  link.click();
  URL.revokeObjectURL(url);
};

export const exportToPNG = (svgElement: SVGSVGElement): void => {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
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

export const generatePolygonPath = (x: number, y: number, width: number, height: number, points: number = 6): string => {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const radiusX = width / 2;
  const radiusY = height / 2;

  const pathPoints: string[] = [];

  for (let i = 0; i < points; i++) {
    const angle = (i * 2 * Math.PI / points) - Math.PI / 2;
    const px = centerX + radiusX * Math.cos(angle);
    const py = centerY + radiusY * Math.sin(angle);
    pathPoints.push(`${i === 0 ? 'M' : 'L'} ${px} ${py}`);
  }

  pathPoints.push('Z');
  return pathPoints.join(' ');
};

export const generateStarPath = (x: number, y: number, width: number, height: number, points: number = 5): string => {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const outerRadiusX = width / 2;
  const outerRadiusY = height / 2;
  const innerRadiusX = outerRadiusX * 0.4;
  const innerRadiusY = outerRadiusY * 0.4;

  const pathPoints: string[] = [];

  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI / points) - Math.PI / 2;
    const isOuter = i % 2 === 0;
    const radiusX = isOuter ? outerRadiusX : innerRadiusX;
    const radiusY = isOuter ? outerRadiusY : innerRadiusY;
    const px = centerX + radiusX * Math.cos(angle);
    const py = centerY + radiusY * Math.sin(angle);
    pathPoints.push(`${i === 0 ? 'M' : 'L'} ${px} ${py}`);
  }

  pathPoints.push('Z');
  return pathPoints.join(' ');
};

export const generateArrowPath = (x: number, y: number, width: number, height: number, headSize: number = 10): { shaft: string; head: string } => {
  const y1 = y + height / 2;
  const y2 = y + height / 2;
  const x2 = x + width;

  const shaft = `M ${x} ${y1} L ${x2} ${y2}`;

  const angle = Math.atan2(0, width);
  const headAngle = Math.PI / 6;

  const head1X = x2 - headSize * Math.cos(angle - headAngle);
  const head1Y = y2 - headSize * Math.sin(angle - headAngle);
  const head2X = x2 - headSize * Math.cos(angle + headAngle);
  const head2Y = y2 - headSize * Math.sin(angle + headAngle);

  const head = `M ${head1X} ${head1Y} L ${x2} ${y2} L ${head2X} ${head2Y}`;

  return { shaft, head };
};
