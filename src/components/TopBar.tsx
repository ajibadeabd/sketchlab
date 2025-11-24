import React from 'react';
import {
  ZoomIn, ZoomOut, AlignLeft, AlignCenter, AlignRight,
  AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter
} from 'lucide-react';

interface TopBarProps {
  zoom: number;
  darkMode: boolean;
  snapToGrid: boolean;
  showSmartGuides: boolean;
  selectedIds: number[];
  shiftKey: boolean;
  altKey: boolean;
  isDrawingPath: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onToggleSnapToGrid: () => void;
  onToggleSmartGuides: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBooleanUnion: () => void;
  onBooleanSubtract: () => void;
  onDistributeHorizontally: () => void;
  onDistributeVertically: () => void;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onAlignMiddle: () => void;
  onAlignTop: () => void;
  onAlignBottom: () => void;
  onFinishPath: () => void;
  onExportSVG: () => void;
  onExportPNG: () => void;
  totalElements: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  zoom,
  darkMode,
  snapToGrid,
  showSmartGuides,
  selectedIds,
  shiftKey,
  altKey,
  isDrawingPath,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onToggleSnapToGrid,
  onToggleSmartGuides,
  onSelectAll,
  onDeselectAll,
  onBooleanUnion,
  onBooleanSubtract,
  onDistributeHorizontally,
  onDistributeVertically,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAlignMiddle,
  onAlignTop,
  onAlignBottom,
  onFinishPath,
  onExportSVG,
  onExportPNG,
  totalElements
}) => {
  const buttonClass = `p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded`;
  const smallButtonClass = `px-3 py-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded text-sm`;

  return (
    <div className={`h-12 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200'} border-b flex items-center justify-between px-4 flex-shrink-0`}>
      <div className="flex items-center gap-2">
        <button onClick={onZoomOut} className={buttonClass} title="Zoom Out (Cmd+-)">
          <ZoomOut size={18} />
        </button>
        <span className="text-sm font-mono w-16 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button onClick={onZoomIn} className={buttonClass} title="Zoom In (Cmd++)">
          <ZoomIn size={18} />
        </button>
        <button onClick={onFitToScreen} className={smallButtonClass} title="Fit to Screen (Cmd+0)">
          Fit
        </button>

        <div className={`h-6 w-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} mx-2`} />

        <button
          onClick={onToggleSnapToGrid}
          className={`px-3 py-1 rounded text-sm ${
            snapToGrid
              ? (darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700')
              : (darkMode ? 'bg-gray-700' : 'bg-gray-100')
          }`}
          title="Toggle Snap to Grid (Cmd+;)"
        >
          Snap: {snapToGrid ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={onToggleSmartGuides}
          className={`px-3 py-1 rounded text-sm ${
            showSmartGuides
              ? (darkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700')
              : (darkMode ? 'bg-gray-700' : 'bg-gray-100')
          }`}
          title="Toggle Smart Guides (Cmd+')"
        >
          Guides: {showSmartGuides ? 'ON' : 'OFF'}
        </button>

        {selectedIds.length > 0 && (
          <>
            <div className={`h-6 w-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} mx-2`} />
            <button onClick={onSelectAll} className={smallButtonClass} title="Select All (Cmd+A)">
              Select All ({totalElements})
            </button>
            <button onClick={onDeselectAll} className={smallButtonClass} title="Deselect (Esc)">
              Deselect ({selectedIds.length})
            </button>
          </>
        )}

        {selectedIds.length >= 2 && (
          <>
            <div className={`h-6 w-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} mx-2`} />
            <button
              onClick={onBooleanUnion}
              className={`px-3 py-1 ${darkMode ? 'bg-purple-900 hover:bg-purple-800' : 'bg-purple-100 hover:bg-purple-200'} rounded text-sm`}
              title="Union"
            >
              Union
            </button>
            {selectedIds.length === 2 && (
              <button
                onClick={onBooleanSubtract}
                className={`px-3 py-1 ${darkMode ? 'bg-purple-900 hover:bg-purple-800' : 'bg-purple-100 hover:bg-purple-200'} rounded text-sm`}
                title="Subtract"
              >
                Subtract
              </button>
            )}
          </>
        )}

        {selectedIds.length >= 3 && (
          <>
            <div className={`h-6 w-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} mx-2`} />
            <button onClick={onDistributeHorizontally} className={smallButtonClass} title="Distribute Horizontally">
              Distribute H
            </button>
            <button onClick={onDistributeVertically} className={smallButtonClass} title="Distribute Vertically">
              Distribute V
            </button>
          </>
        )}

        {selectedIds.length >= 2 && (
          <>
            <div className={`h-6 w-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} mx-2`} />
            <button onClick={onAlignLeft} className={buttonClass} title="Align Left">
              <AlignLeft size={18} />
            </button>
            <button onClick={onAlignCenter} className={buttonClass} title="Align Center">
              <AlignCenter size={18} />
            </button>
            <button onClick={onAlignRight} className={buttonClass} title="Align Right">
              <AlignRight size={18} />
            </button>
            <button onClick={onAlignMiddle} className={buttonClass} title="Align Middle">
              <AlignHorizontalJustifyCenter size={18} />
            </button>
            <button onClick={onAlignTop} className={buttonClass} title="Align Top">
              <AlignVerticalJustifyCenter size={18} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <button onClick={onAlignBottom} className={buttonClass} title="Align Bottom">
              <AlignVerticalJustifyCenter size={18} />
            </button>
          </>
        )}
      </div>

      <div className="flex gap-2">
        {(shiftKey || altKey) && (
          <div className={`flex items-center gap-2 px-3 py-1 ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700'} rounded text-sm`}>
            {shiftKey && <span>⇧ Aspect Ratio Lock</span>}
            {shiftKey && altKey && <span>•</span>}
            {altKey && <span>⌥ Resize from Center</span>}
          </div>
        )}
        {isDrawingPath && (
          <button
            onClick={onFinishPath}
            className={`px-3 py-1 ${darkMode ? 'bg-green-700 hover:bg-green-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded text-sm`}
          >
            Finish Path (Enter)
          </button>
        )}
        <button onClick={onExportSVG} className={smallButtonClass}>
          Export SVG
        </button>
        <button
          onClick={onExportPNG}
          className={`px-3 py-1 ${darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded text-sm`}
        >
          Export PNG
        </button>
      </div>
    </div>
  );
};
