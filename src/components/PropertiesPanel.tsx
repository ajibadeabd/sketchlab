import React from 'react';
import type { Element } from '../types';

interface PropertiesPanelProps {
  selectedElement: Element | null;
  hasMultipleSelected: boolean;
  selectedCount: number;
  darkMode: boolean;
  onUpdateProperty: <K extends keyof Element>(property: K, value: Element[K]) => void;
  onToggleAutoLayout: () => void;
  onUpdateAutoLayout: <K extends keyof NonNullable<Element['autoLayout']>>(
    property: K,
    value: NonNullable<Element['autoLayout']>[K]
  ) => void;
  onSetConstraints: (horizontal: string, vertical: string) => void;
  onAddShadow: () => void;
  onRemoveShadow: () => void;
  onAddGradient: () => void;
  onRemoveGradient: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onToggleLock: () => void;
  onToggleVisibility: () => void;
  onCreateGroup: () => void;
  onUngroupSelected: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  hasMultipleSelected,
  selectedCount,
  darkMode,
  onUpdateProperty,
  onToggleAutoLayout,
  onUpdateAutoLayout,
  onSetConstraints,
  onAddShadow,
  onRemoveShadow,
  onAddGradient,
  onRemoveGradient,
  onBringToFront,
  onSendToBack,
  onToggleLock,
  onToggleVisibility,
  onCreateGroup,
  onUngroupSelected
}) => {
  if (!selectedElement && !hasMultipleSelected) {
    return (
      <div className={`w-64 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200'} border-l p-4 overflow-y-auto flex-shrink-0 h-screen`}>
        <h3 className="font-semibold mb-4">Design</h3>
        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p className="mb-4">Select an element to edit its properties</p>
          <div className="space-y-2">
            <div className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded`}>
              <p className="font-medium mb-1">Quick Tips:</p>
              <ul className="text-xs space-y-1">
                <li>• Press V for Select tool</li>
                <li>• Press R for Rectangle</li>
                <li>• Press C for Circle</li>
                <li>• Press T for Text</li>
                <li>• Press P for Pen tool</li>
                <li>• Cmd+A to select all</li>
                <li>• Cmd+D to duplicate</li>
                <li>• Cmd+G to group</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-64 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200'} border-l p-4 overflow-y-auto flex-shrink-0 h-screen`}>
      <h3 className="font-semibold mb-4">
        {hasMultipleSelected ? `Properties (${selectedCount} selected)` : 'Properties'}
      </h3>

      <div className="space-y-3">
        {selectedElement && (
          <>
            <div>
              <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Layer Name</label>
              <input
                type="text"
                value={selectedElement.layerName || ''}
                onChange={(e) => onUpdateProperty('layerName', e.target.value)}
                className={`w-full px-2 py-1 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>X</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.x)}
                  onChange={(e) => onUpdateProperty('x', parseInt(e.target.value) || 0)}
                  className={`w-full px-2 py-1 border rounded text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
                />
              </div>

              <div>
                <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Y</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.y)}
                  onChange={(e) => onUpdateProperty('y', parseInt(e.target.value) || 0)}
                  className={`w-full px-2 py-1 border rounded text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Width</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.width)}
                  onChange={(e) => onUpdateProperty('width', parseInt(e.target.value) || 1)}
                  className={`w-full px-2 py-1 border rounded text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
                />
              </div>

              <div>
                <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Height</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.height)}
                  onChange={(e) => onUpdateProperty('height', parseInt(e.target.value) || 1)}
                  className={`w-full px-2 py-1 border rounded text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rotation</label>
                <input
                  type="number"
                  value={selectedElement.rotation || 0}
                  onChange={(e) => onUpdateProperty('rotation', parseInt(e.target.value) || 0)}
                  className={`w-full px-2 py-1 border rounded text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
                />
              </div>

              <div>
                <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Opacity %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round((selectedElement.opacity || 1) * 100)}
                  onChange={(e) => onUpdateProperty('opacity', (parseInt(e.target.value) || 100) / 100)}
                  className={`w-full px-2 py-1 border rounded text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
                />
              </div>
            </div>

            <div>
              <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fill Color</label>
              <input
                type="color"
                value={selectedElement.fill}
                onChange={(e) => onUpdateProperty('fill', e.target.value)}
                className="w-full h-10 border rounded cursor-pointer"
              />
            </div>

            {(selectedElement.type === 'rectangle' || selectedElement.type === 'image') && (
              <div>
                <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Border Radius</label>
                <input
                  type="number"
                  min="0"
                  value={selectedElement.borderRadius || 0}
                  onChange={(e) => onUpdateProperty('borderRadius', parseInt(e.target.value) || 0)}
                  className={`w-full px-2 py-1 border rounded text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
                />
              </div>
            )}

            {selectedElement.type !== 'text' && selectedElement.type !== 'image' && (
              <>
                <div>
                  <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Stroke Color</label>
                  <input
                    type="color"
                    value={selectedElement.stroke || '#000000'}
                    onChange={(e) => onUpdateProperty('stroke', e.target.value)}
                    className="w-full h-10 border rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Stroke Width</label>
                  <input
                    type="number"
                    value={selectedElement.strokeWidth || 0}
                    onChange={(e) => onUpdateProperty('strokeWidth', parseInt(e.target.value) || 0)}
                    className={`w-full px-2 py-1 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
                  />
                </div>
              </>
            )}

            {selectedElement.type === 'text' && (
              <>
                <div>
                  <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Text</label>
                  <textarea
                    value={selectedElement.text || ''}
                    onChange={(e) => onUpdateProperty('text', e.target.value)}
                    className={`w-full px-2 py-1 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
                    rows={3}
                  />
                </div>

                <div>
                  <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Font Size</label>
                  <input
                    type="number"
                    value={selectedElement.fontSize || 16}
                    onChange={(e) => onUpdateProperty('fontSize', parseInt(e.target.value) || 12)}
                    className={`w-full px-2 py-1 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
                  />
                </div>

                <div>
                  <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Font Family</label>
                  <select
                    value={selectedElement.fontFamily || 'Arial, sans-serif'}
                    onChange={(e) => onUpdateProperty('fontFamily', e.target.value)}
                    className={`w-full px-2 py-1 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
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
                    onClick={() => onUpdateProperty('fontWeight', selectedElement.fontWeight === 'bold' ? 'normal' : 'bold')}
                    className={`flex-1 px-3 py-2 rounded text-sm ${
                      selectedElement.fontWeight === 'bold'
                        ? 'bg-blue-500 text-white'
                        : (darkMode ? 'bg-gray-700' : 'bg-gray-100')
                    }`}
                  >
                    <strong>B</strong> Bold
                  </button>
                  <button
                    onClick={() => onUpdateProperty('fontStyle', selectedElement.fontStyle === 'italic' ? 'normal' : 'italic')}
                    className={`flex-1 px-3 py-2 rounded text-sm ${
                      selectedElement.fontStyle === 'italic'
                        ? 'bg-blue-500 text-white'
                        : (darkMode ? 'bg-gray-700' : 'bg-gray-100')
                    }`}
                  >
                    <em>I</em> Italic
                  </button>
                </div>

                <button
                  onClick={() => onUpdateProperty('textDecoration', selectedElement.textDecoration === 'underline' ? 'none' : 'underline')}
                  className={`w-full px-3 py-2 rounded text-sm ${
                    selectedElement.textDecoration === 'underline'
                      ? 'bg-blue-500 text-white'
                      : (darkMode ? 'bg-gray-700' : 'bg-gray-100')
                  }`}
                >
                  <u>U</u> Underline
                </button>

                <div>
                  <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Text Align</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdateProperty('textAlign', 'left')}
                      className={`flex-1 px-3 py-2 rounded text-sm ${
                        selectedElement.textAlign === 'left'
                          ? 'bg-blue-500 text-white'
                          : (darkMode ? 'bg-gray-700' : 'bg-gray-100')
                      }`}
                    >
                      Left
                    </button>
                    <button
                      onClick={() => onUpdateProperty('textAlign', 'center')}
                      className={`flex-1 px-3 py-2 rounded text-sm ${
                        selectedElement.textAlign === 'center'
                          ? 'bg-blue-500 text-white'
                          : (darkMode ? 'bg-gray-700' : 'bg-gray-100')
                      }`}
                    >
                      Center
                    </button>
                    <button
                      onClick={() => onUpdateProperty('textAlign', 'right')}
                      className={`flex-1 px-3 py-2 rounded text-sm ${
                        selectedElement.textAlign === 'right'
                          ? 'bg-blue-500 text-white'
                          : (darkMode ? 'bg-gray-700' : 'bg-gray-100')
                      }`}
                    >
                      Right
                    </button>
                  </div>
                </div>
              </>
            )}

            {selectedElement.isComponent && selectedElement.componentId && (
              <div>
                <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Component Variant</label>
                <select
                  value={selectedElement.componentVariant || 'default'}
                  onChange={(e) => onUpdateProperty('componentVariant', e.target.value)}
                  className={`w-full px-2 py-1 border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
                >
                  <option value="default">Default</option>
                  <option value="hover">Hover</option>
                  <option value="pressed">Pressed</option>
                </select>
              </div>
            )}

            {selectedElement.isFrame && (
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold">Auto Layout</h4>
                  <button
                    onClick={onToggleAutoLayout}
                    className={`text-xs px-2 py-1 rounded ${
                      selectedElement.autoLayout
                        ? (darkMode ? 'bg-green-800 hover:bg-green-700' : 'bg-green-100 hover:bg-green-200')
                        : (darkMode ? 'bg-blue-800 hover:bg-blue-700' : 'bg-blue-100 hover:bg-blue-200')
                    }`}
                  >
                    {selectedElement.autoLayout ? 'ON' : 'OFF'}
                  </button>
                </div>

                {selectedElement.autoLayout && (
                  <div className="space-y-2">
                    <div>
                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Direction</label>
                      <select
                        value={selectedElement.autoLayout.direction}
                        onChange={(e) => onUpdateAutoLayout('direction', e.target.value as any)}
                        className={`w-full px-2 py-1 border rounded text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
                      >
                        <option value="horizontal">Horizontal</option>
                        <option value="vertical">Vertical</option>
                      </select>
                    </div>

                    <div>
                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Spacing</label>
                      <input
                        type="number"
                        value={selectedElement.autoLayout.spacing}
                        onChange={(e) => onUpdateAutoLayout('spacing', parseInt(e.target.value) || 0)}
                        className={`w-full px-2 py-1 border rounded text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
                      />
                    </div>

                    <div>
                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Padding</label>
                      <input
                        type="number"
                        value={selectedElement.autoLayout.padding}
                        onChange={(e) => onUpdateAutoLayout('padding', parseInt(e.target.value) || 0)}
                        className={`w-full px-2 py-1 border rounded text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
                      />
                    </div>

                    <div>
                      <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Alignment</label>
                      <select
                        value={selectedElement.autoLayout.alignment}
                        onChange={(e) => onUpdateAutoLayout('alignment', e.target.value as any)}
                        className={`w-full px-2 py-1 border rounded text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
                      >
                        <option value="start">Start</option>
                        <option value="center">Center</option>
                        <option value="end">End</option>
                        <option value="space-between">Space Between</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedElement.parentFrameId && (
              <div className={`pt-4 ${darkMode ? 'border-gray-700' : 'border-t'}`}>
                <h4 className="text-sm font-semibold mb-2">Constraints</h4>

                <div className="space-y-2">
                  <div>
                    <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Horizontal</label>
                    <select
                      value={selectedElement.constraints?.horizontal || 'left'}
                      onChange={(e) => onSetConstraints(e.target.value, selectedElement.constraints?.vertical || 'top')}
                      className={`w-full px-2 py-1 border rounded text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="center">Center</option>
                      <option value="left-right">Left & Right</option>
                      <option value="scale">Scale</option>
                    </select>
                  </div>

                  <div>
                    <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Vertical</label>
                    <select
                      value={selectedElement.constraints?.vertical || 'top'}
                      onChange={(e) => onSetConstraints(selectedElement.constraints?.horizontal || 'left', e.target.value)}
                      className={`w-full px-2 py-1 border rounded text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}
                    >
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="center">Center</option>
                      <option value="top-bottom">Top & Bottom</option>
                      <option value="scale">Scale</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {hasMultipleSelected && (
          <div className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded text-sm`}>
            <p className={darkMode ? 'text-gray-300' : 'text-blue-700'}>
              <strong>{selectedCount}</strong> elements selected
            </p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-blue-600'}`}>
              You can move, resize, align, or apply effects to all selected elements
            </p>
          </div>
        )}

        {selectedElement && (
          <div className={`pt-4 ${darkMode ? 'border-gray-700' : ''} border-t`}>
            <h4 className="text-sm font-semibold mb-2">Effects</h4>

            <div className="space-y-2">
              {selectedElement.shadow ? (
                <button
                  onClick={onRemoveShadow}
                  className={`w-full px-3 py-2 rounded text-sm ${darkMode ? 'bg-orange-800 hover:bg-orange-700' : 'bg-orange-100 hover:bg-orange-200'}`}
                >
                  Remove Shadow
                </button>
              ) : (
                <button
                  onClick={onAddShadow}
                  className={`w-full px-3 py-2 rounded text-sm ${darkMode ? 'bg-purple-800 hover:bg-purple-700' : 'bg-purple-100 hover:bg-purple-200'}`}
                >
                  Add Shadow
                </button>
              )}

              {selectedElement.gradient ? (
                <button
                  onClick={onRemoveGradient}
                  className={`w-full px-3 py-2 rounded text-sm ${darkMode ? 'bg-orange-800 hover:bg-orange-700' : 'bg-orange-100 hover:bg-orange-200'}`}
                >
                  Remove Gradient
                </button>
              ) : (
                <button
                  onClick={onAddGradient}
                  className={`w-full px-3 py-2 rounded text-sm ${darkMode ? 'bg-purple-800 hover:bg-purple-700' : 'bg-purple-100 hover:bg-purple-200'}`}
                >
                  Add Gradient
                </button>
              )}
            </div>
          </div>
        )}

        {selectedElement && (
          <div className={`pt-4 ${darkMode ? 'border-gray-700' : ''} border-t space-y-2`}>
            <button
              onClick={onBringToFront}
              className={`w-full px-3 py-2 rounded text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Bring to Front (])
            </button>
            <button
              onClick={onSendToBack}
              className={`w-full px-3 py-2 rounded text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Send to Back ([)
            </button>
            <button
              onClick={onToggleLock}
              className={`w-full px-3 py-2 rounded text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {selectedElement.locked ? 'Unlock (Cmd+L)' : 'Lock (Cmd+L)'}
            </button>
            <button
              onClick={onToggleVisibility}
              className={`w-full px-3 py-2 rounded text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {selectedElement.visible === false ? 'Show' : 'Hide'}
            </button>
            {selectedCount >= 2 && (
              <button
                onClick={onCreateGroup}
                className={`w-full px-3 py-2 rounded text-sm ${darkMode ? 'bg-blue-800 hover:bg-blue-700' : 'bg-blue-100 hover:bg-blue-200'}`}
              >
                Group Selection (Cmd+G)
              </button>
            )}
            {selectedElement.groupId && (
              <button
                onClick={onUngroupSelected}
                className={`w-full px-3 py-2 rounded text-sm ${darkMode ? 'bg-orange-800 hover:bg-orange-700' : 'bg-orange-100 hover:bg-orange-200'}`}
              >
                Ungroup
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
