import React from 'react';
import type { TextStyle, ColorStyle } from '../types';

interface StylesPanelProps {
  textStyles: TextStyle[];
  colorStyles: ColorStyle[];
  darkMode: boolean;
  selectedIds: number[];
  onCreateTextStyle: () => void;
  onCreateColorStyle: () => void;
  onApplyTextStyle: (styleId: string) => void;
  onApplyColorStyle: (styleId: string) => void;
  hasTextSelected: boolean;
}

export const StylesPanel: React.FC<StylesPanelProps> = ({
  textStyles,
  colorStyles,
  darkMode,
  selectedIds,
  onCreateTextStyle,
  onCreateColorStyle,
  onApplyTextStyle,
  onApplyColorStyle,
  hasTextSelected
}) => {
  return (
    <div className={`w-64 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200'} border-r p-4 overflow-y-auto flex-shrink-0 h-screen`}>
      <h3 className="font-semibold mb-3">Styles</h3>

      <div className="space-y-4">
        {/* Text Styles */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Text Styles</h4>
            <button
              onClick={onCreateTextStyle}
              disabled={!hasTextSelected}
              className={`text-xs px-2 py-1 rounded ${
                darkMode
                  ? 'bg-blue-900 hover:bg-blue-800 disabled:opacity-30'
                  : 'bg-blue-100 hover:bg-blue-200 disabled:opacity-30'
              }`}
            >
              + New
            </button>
          </div>
          <div className="space-y-1">
            {textStyles.map(style => (
              <div
                key={style.id}
                onClick={() => onApplyTextStyle(style.id)}
                className={`px-2 py-2 rounded text-xs cursor-pointer ${
                  darkMode ? 'hover:bg-gray-700 bg-gray-750' : 'hover:bg-gray-100 bg-gray-50'
                }`}
              >
                <div className="font-medium">{style.name}</div>
                <div className="text-gray-500">
                  {style.fontFamily} • {style.fontSize}px
                </div>
              </div>
            ))}
            {textStyles.length === 0 && (
              <p className="text-xs text-gray-500">No text styles yet</p>
            )}
          </div>
        </div>

        {/* Color Styles */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Color Styles</h4>
            <button
              onClick={onCreateColorStyle}
              disabled={selectedIds.length !== 1}
              className={`text-xs px-2 py-1 rounded ${
                darkMode
                  ? 'bg-blue-900 hover:bg-blue-800 disabled:opacity-30'
                  : 'bg-blue-100 hover:bg-blue-200 disabled:opacity-30'
              }`}
            >
              + New
            </button>
          </div>
          <div className="space-y-1">
            {colorStyles.map(style => (
              <div
                key={style.id}
                onClick={() => onApplyColorStyle(style.id)}
                className={`px-2 py-2 rounded text-xs cursor-pointer flex items-center gap-2 ${
                  darkMode ? 'hover:bg-gray-700 bg-gray-750' : 'hover:bg-gray-100 bg-gray-50'
                }`}
              >
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: style.color }}
                ></div>
                <div>
                  <div className="font-medium">{style.name}</div>
                  <div className="text-gray-500">{style.color}</div>
                </div>
              </div>
            ))}
            {colorStyles.length === 0 && (
              <p className="text-xs text-gray-500">No color styles yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
