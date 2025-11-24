import { useEffect } from 'react';
import type { ToolType } from '../types';

interface KeyboardShortcutsProps {
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onGroup: () => void;
  onSetTool: (tool: ToolType) => void;
  onFinishPath: () => void;
  onCancelPath: () => void;
  onToggleLock: () => void;
  onToggleSnapToGrid: () => void;
  onToggleSmartGuides: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onCut: () => void;
  onSelectAll: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onDeselect: () => void;
  onFinishTextEdit: () => void;
  onCancelTextEdit: () => void;
  onMoveUp: (shift: boolean) => void;
  onMoveDown: (shift: boolean) => void;
  onMoveLeft: (shift: boolean) => void;
  onMoveRight: (shift: boolean) => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onStartPanning: () => void;
  onStopPanning: () => void;
  setShiftKey: (value: boolean) => void;
  setAltKey: (value: boolean) => void;
  isDrawingPath: boolean;
  editingTextId: number | null;
  selectedIds: number[];
}

export const useKeyboardShortcuts = ({
  onUndo,
  onRedo,
  onDuplicate,
  onDelete,
  onGroup,
  onSetTool,
  onFinishPath,
  onCancelPath,
  onToggleLock,
  onToggleSnapToGrid,
  onToggleSmartGuides,
  onCopy,
  onPaste,
  onCut,
  onSelectAll,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onDeselect,
  onFinishTextEdit,
  onCancelTextEdit,
  onMoveUp,
  onMoveDown,
  onMoveLeft,
  onMoveRight,
  onBringToFront,
  onSendToBack,
  onStartPanning,
  onStopPanning,
  setShiftKey,
  setAltKey,
  isDrawingPath,
  editingTextId,
  selectedIds
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Shift') setShiftKey(true);
      if (e.key === 'Alt') setAltKey(true);

      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        onRedo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        onDuplicate();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault();
        onGroup();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        e.preventDefault();
        onCopy();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        e.preventDefault();
        onPaste();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'x') {
        e.preventDefault();
        onCut();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        onSelectAll();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        onToggleLock();
      } else if ((e.metaKey || e.ctrlKey) && e.key === ';') {
        e.preventDefault();
        onToggleSnapToGrid();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "'") {
        e.preventDefault();
        onToggleSmartGuides();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        onZoomIn();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        onZoomOut();
      } else if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        onFitToScreen();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        onDelete();
      } else if (e.key === 'v' && !e.metaKey && !e.ctrlKey) {
        onSetTool('select');
      } else if (e.key === 'r' && !e.metaKey && !e.ctrlKey) {
        onSetTool('rectangle');
      } else if (e.key === 'o' && !e.metaKey && !e.ctrlKey) {
        onSetTool('circle');
      } else if (e.key === 't' && !e.metaKey && !e.ctrlKey) {
        onSetTool('text');
      } else if (e.key === 'p' && !e.metaKey && !e.ctrlKey) {
        onSetTool('pen');
      } else if (e.key === 'f' && !e.metaKey && !e.ctrlKey) {
        onSetTool('frame');
      } else if (e.key === 'h' && !e.metaKey && !e.ctrlKey) {
        onSetTool('hand');
      } else if (e.key === 'i' && !e.metaKey && !e.ctrlKey) {
        onSetTool('eyedropper');
      } else if (e.key === 'w' && !e.metaKey && !e.ctrlKey) {
        onSetTool('arrow');
      } else if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        onSetTool('polygon');
      } else if (e.key === 's' && !e.metaKey && !e.ctrlKey) {
        onSetTool('star');
      } else if (e.key === 'l' && !e.metaKey && !e.ctrlKey) {
        onSetTool('line');
      } else if (e.key === 'Escape' && isDrawingPath) {
        onCancelPath();
      } else if (e.key === 'Enter' && isDrawingPath) {
        onFinishPath();
      } else if (e.key === ' ') {
        e.preventDefault();
        onStartPanning();
      } else if (e.key === ']') {
        onBringToFront();
      } else if (e.key === '[') {
        onSendToBack();
      } else if (e.key === 'Escape' && selectedIds.length > 0 && !editingTextId) {
        onDeselect();
      } else if (e.key === 'Enter' && editingTextId !== null) {
        onFinishTextEdit();
      } else if (e.key === 'Escape' && editingTextId !== null) {
        onCancelTextEdit();
      } else if (e.key === 'ArrowUp' && selectedIds.length > 0) {
        e.preventDefault();
        onMoveUp(e.shiftKey);
      } else if (e.key === 'ArrowDown' && selectedIds.length > 0) {
        e.preventDefault();
        onMoveDown(e.shiftKey);
      } else if (e.key === 'ArrowLeft' && selectedIds.length > 0) {
        e.preventDefault();
        onMoveLeft(e.shiftKey);
      } else if (e.key === 'ArrowRight' && selectedIds.length > 0) {
        e.preventDefault();
        onMoveRight(e.shiftKey);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        onStopPanning();
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
  }, [
    onUndo, onRedo, onDuplicate, onDelete, onGroup, onSetTool,
    onFinishPath, onCancelPath, onToggleLock, onToggleSnapToGrid,
    onToggleSmartGuides, onCopy, onPaste, onCut, onSelectAll,
    onZoomIn, onZoomOut, onFitToScreen, onDeselect, onFinishTextEdit,
    onCancelTextEdit, onMoveUp, onMoveDown, onMoveLeft, onMoveRight,
    onBringToFront, onSendToBack, onStartPanning, onStopPanning,
    setShiftKey, setAltKey, isDrawingPath, editingTextId, selectedIds
  ]);
};
