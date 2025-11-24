import React from 'react';
import { Lock, Package } from 'lucide-react';
import type  { Element } from '../types';

interface LayersPanelProps {
  elements: Element[];
  selectedIds: number[];
  darkMode: boolean;
  onSelectElement: (id: number) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  elements,
  selectedIds,
  darkMode,
  onSelectElement
}) => {
  return (
    <div className={`w-64 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200'} border-r p-4 overflow-y-auto flex-shrink-0 h-screen`}>
      <h3 className="font-semibold mb-3">Layers</h3>
      <div className="space-y-1">
        {[...elements].sort((a, b) => b.zIndex - a.zIndex).map(el => (
          <div
            key={el.id}
            onClick={() => onSelectElement(el.id)}
            className={`px-3 py-2 rounded text-sm cursor-pointer flex justify-between items-center ${
              selectedIds.includes(el.id)
                ? (darkMode ? 'bg-blue-900' : 'bg-blue-100')
                : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
            } ${!el.visible ? 'opacity-50' : ''}`}
          >
            <span className="flex items-center gap-2">
              {el.isComponent && <Package size={12} />}
              {el.layerName || `${el.type} ${el.id}`}
            </span>
            {el.locked && <Lock size={14} />}
          </div>
        ))}
      </div>
    </div>
  );
};
