import React, { useState } from 'react';
import {
  Square, Circle, Type, MousePointer, Trash2, Copy,
  Undo2, Redo2, Lock, Unlock, Upload, Pen, Moon, Sun, Box,
  FolderPlus, Package, Palette, Hand, Pipette, ArrowRight,
  Pentagon, Star, Ruler
} from 'lucide-react';
import type { ToolType } from '../types';

interface ToolbarProps {
  tool: ToolType;
  setTool: (tool: ToolType) => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  selectedIds: number[];
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleLock: () => void;
  onCreateGroup: () => void;
  onCreateComponent: () => void;
  showStylesPanel: boolean;
  onToggleStylesPanel: () => void;
  showLayers: boolean;
  onToggleLayers: () => void;
  onImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportJSON: () => void;
  onExportSVG: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedElementLocked?: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  setTool,
  darkMode,
  setDarkMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  selectedIds,
  onDuplicate,
  onDelete,
  onToggleLock,
  onCreateGroup,
  onCreateComponent,
  showStylesPanel,
  onToggleStylesPanel,
  showLayers,
  onToggleLayers,
  onImportJSON,
  onExportJSON,
  onExportSVG,
  onImageUpload,
  selectedElementLocked,
  fileInputRef
}) => {
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  const buttonClass = (isActive: boolean) =>
    `p-3 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${
      isActive ? (darkMode ? 'bg-blue-900' : 'bg-blue-100') : ''
    } ${darkMode ? 'text-gray-200' : ''}`;

  const disabledButtonClass = `p-3 rounded ${darkMode ? 'hover:bg-gray-700 disabled:opacity-30 text-gray-200' : 'hover:bg-gray-100 disabled:opacity-30'}`;

  return (
    <div className={`w-16 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col items-center py-4 gap-2 overflow-y-auto flex-shrink-0 relative`}>
      {hoveredTooltip && (
        <div
          className={`fixed left-16 z-50 px-3 py-2 text-sm font-medium rounded shadow-lg whitespace-nowrap pointer-events-none ${
            darkMode ? 'bg-gray-700 text-white border border-gray-600' : 'bg-gray-900 text-white'
          }`}
          style={{
            top: `${(document.querySelector(`[data-tooltip="${hoveredTooltip}"]`) as HTMLElement)?.getBoundingClientRect().top}px`,
            marginLeft: '8px'
          }}
        >
          {hoveredTooltip}
        </div>
      )}

      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`p-3 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} relative`}
        onMouseEnter={() => setHoveredTooltip('Toggle Dark Mode')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Toggle Dark Mode"
      >
        {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
      </button>

      <div className={`h-px w-10 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} my-2`} />

      <button
        onClick={() => setTool('select')}
        className={buttonClass(tool === 'select')}
        onMouseEnter={() => setHoveredTooltip('Select (V)')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Select (V)"
      >
        <MousePointer size={20} />
      </button>

      <button
        onClick={() => setTool('rectangle')}
        className={buttonClass(tool === 'rectangle')}
        onMouseEnter={() => setHoveredTooltip('Rectangle (R)')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Rectangle (R)"
      >
        <Square size={20} />
      </button>

      <button
        onClick={() => setTool('circle')}
        className={buttonClass(tool === 'circle')}
        onMouseEnter={() => setHoveredTooltip('Circle (O)')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Circle (O)"
      >
        <Circle size={20} />
      </button>

      <button
        onClick={() => setTool('text')}
        className={buttonClass(tool === 'text')}
        onMouseEnter={() => setHoveredTooltip('Text (T)')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Text (T)"
      >
        <Type size={20} />
      </button>

      <button
        onClick={() => setTool('line')}
        className={buttonClass(tool === 'line')}
        onMouseEnter={() => setHoveredTooltip('Line (L)')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Line (L)"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <line x1="2" y1="10" x2="18" y2="10" strokeWidth="2" />
        </svg>
      </button>

      <button
        onClick={() => setTool('pen')}
        className={buttonClass(tool === 'pen')}
        onMouseEnter={() => setHoveredTooltip('Pen Tool (P)')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Pen Tool (P)"
      >
        <Pen size={20} />
      </button>

      <button
        onClick={() => setTool('frame')}
        className={buttonClass(tool === 'frame')}
        onMouseEnter={() => setHoveredTooltip('Frame (F)')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Frame (F)"
      >
        <Box size={20} />
      </button>

      <button
        onClick={() => setTool('arrow')}
        className={buttonClass(tool === 'arrow')}
        onMouseEnter={() => setHoveredTooltip('Arrow (W)')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Arrow (W)"
      >
        <ArrowRight size={20} />
      </button>

      <button
        onClick={() => setTool('polygon')}
        className={buttonClass(tool === 'polygon')}
        onMouseEnter={() => setHoveredTooltip('Polygon (G)')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Polygon (G)"
      >
        <Pentagon size={20} />
      </button>

      <button
        onClick={() => setTool('star')}
        className={buttonClass(tool === 'star')}
        onMouseEnter={() => setHoveredTooltip('Star (S)')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Star (S)"
      >
        <Star size={20} />
      </button>

      <div className={`h-px w-10 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} my-2`} />

      <button
        onClick={() => setTool('hand')}
        className={buttonClass(tool === 'hand')}
        onMouseEnter={() => setHoveredTooltip('Hand Tool (H)')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Hand Tool (H)"
      >
        <Hand size={20} />
      </button>

      <button
        onClick={() => setTool('eyedropper')}
        className={buttonClass(tool === 'eyedropper')}
        onMouseEnter={() => setHoveredTooltip('Eyedropper (I)')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Eyedropper (I)"
      >
        <Pipette size={20} />
      </button>

      <div className={`h-px w-10 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} my-2`} />

      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={disabledButtonClass}
        onMouseEnter={() => setHoveredTooltip('Undo (Cmd+Z)')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Undo (Cmd+Z)"
      >
        <Undo2 size={20} />
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={disabledButtonClass}
        onMouseEnter={() => setHoveredTooltip('Redo (Cmd+Shift+Z)')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Redo (Cmd+Shift+Z)"
      >
        <Redo2 size={20} />
      </button>

      <div className={`h-px w-10 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} my-2`} />

      <button
        onClick={onDuplicate}
        disabled={selectedIds.length === 0}
        className={disabledButtonClass}
        onMouseEnter={() => setHoveredTooltip('Duplicate (Cmd+D)')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Duplicate (Cmd+D)"
      >
        <Copy size={20} />
      </button>

      <button
        onClick={onDelete}
        disabled={selectedIds.length === 0}
        className={disabledButtonClass}
        onMouseEnter={() => setHoveredTooltip('Delete')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Delete"
      >
        <Trash2 size={20} />
      </button>

      <button
        onClick={onToggleLock}
        disabled={selectedIds.length === 0}
        className={disabledButtonClass}
        onMouseEnter={() => setHoveredTooltip(selectedElementLocked ? 'Unlock (Cmd+L)' : 'Lock (Cmd+L)')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip={selectedElementLocked ? 'Unlock (Cmd+L)' : 'Lock (Cmd+L)'}
      >
        {selectedElementLocked ? <Lock size={20} /> : <Unlock size={20} />}
      </button>

      <button
        onClick={onCreateGroup}
        disabled={selectedIds.length < 2}
        className={disabledButtonClass}
        onMouseEnter={() => setHoveredTooltip('Group (Cmd+G)')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Group (Cmd+G)"
      >
        <FolderPlus size={20} />
      </button>

      <button
        onClick={onCreateComponent}
        disabled={selectedIds.length !== 1}
        className={disabledButtonClass}
        onMouseEnter={() => setHoveredTooltip('Create Component')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Create Component"
      >
        <Package size={20} />
      </button>

      <button
        onClick={onToggleStylesPanel}
        className={buttonClass(showStylesPanel)}
        onMouseEnter={() => setHoveredTooltip('Styles Panel')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Styles Panel"
      >
        <Palette size={20} />
      </button>

      <div className={`h-px w-10 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} my-2`} />

      <button
        onClick={onToggleLayers}
        className={`p-3 rounded ${darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100'}`}
        onMouseEnter={() => setHoveredTooltip('Toggle Layers')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Toggle Layers"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <path d="M2 5l8-3 8 3-8 3-8-3z" strokeWidth="1.5" />
          <path d="M2 10l8 3 8-3" strokeWidth="1.5" />
          <path d="M2 15l8 3 8-3" strokeWidth="1.5" />
        </svg>
      </button>

      <label
        className={`p-3 rounded ${darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100'} cursor-pointer`}
        onMouseEnter={() => setHoveredTooltip('Import JSON')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Import JSON"
      >
        <Upload size={20} />
        <input type="file" accept=".json" onChange={onImportJSON} className="hidden" />
      </label>

      <button
        onClick={onExportJSON}
        className={`p-3 rounded ${darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100'}`}
        onMouseEnter={() => setHoveredTooltip('Export JSON')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Export JSON"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" strokeWidth="1.5" />
          <path d="M8 6h4M8 10h4M8 14h2" strokeWidth="1.5" />
        </svg>
      </button>

      <button
        onClick={onExportSVG}
        className={`p-3 rounded ${darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100'}`}
        onMouseEnter={() => setHoveredTooltip('Export SVG')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Export SVG"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <path d="M10 2L2 6v8l8 4 8-4V6l-8-4z" strokeWidth="1.5" />
          <path d="M2 6l8 4m0 0l8-4m-8 4v8" strokeWidth="1.5" />
        </svg>
      </button>

      <div className={`h-px w-10 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} my-2`} />

      <label
        className={`p-3 rounded ${darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100'} cursor-pointer`}
        onMouseEnter={() => setHoveredTooltip('Upload Image')}
        onMouseLeave={() => setHoveredTooltip(null)}
        data-tooltip="Upload Image"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onImageUpload}
          className="hidden"
        />
        <Upload size={20} />
      </label>
    </div>
  );
};
