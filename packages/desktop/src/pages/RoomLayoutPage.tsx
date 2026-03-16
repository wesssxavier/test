import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer, Circle, Rect, Text, Group, Line } from 'react-konva';
import Konva from 'konva';
import {
  Plus, ZoomIn, ZoomOut, RotateCcw, MousePointer, Square, CircleIcon,
  RectangleHorizontal, Music, Mic, Trash2, Save, UtensilsCrossed, DoorOpen,
} from 'lucide-react';
import { tablesApi, roomElementsApi, eventsApi } from '../lib/api';
import toast from 'react-hot-toast';

interface TableData {
  id: string;
  tableName: string;
  shape: 'ROUND' | 'SQUARE' | 'RECTANGLE';
  capacity: number;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
  rotation: number;
}

interface RoomElement {
  id: string;
  elementType: 'STAGE' | 'DANCE_FLOOR' | 'BUFFET' | 'BAR' | 'ENTRANCE' | 'EXIT';
  label: string;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
  rotation: number;
}

type Tool = 'select' | 'add-round' | 'add-square' | 'add-rectangle' | 'add-element';

const GRID_SIZE = 30;
const DEFAULT_ROOM_WIDTH = 1200;
const DEFAULT_ROOM_HEIGHT = 800;

export default function RoomLayoutPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [tables, setTables] = useState<TableData[]>([]);
  const [elements, setElements] = useState<RoomElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [addElementType, setAddElementType] = useState<RoomElement['elementType']>('STAGE');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [roomWidth, setRoomWidth] = useState(DEFAULT_ROOM_WIDTH);
  const [roomHeight, setRoomHeight] = useState(DEFAULT_ROOM_HEIGHT);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const stageRef = useRef<Konva.Stage>(null);

  const fetchData = useCallback(async () => {
    if (!eventId) return;
    try {
      const [tablesRes, elementsRes, eventRes] = await Promise.all([
        tablesApi.list(eventId),
        roomElementsApi.list(eventId).catch(() => ({ data: [] })),
        eventsApi.get(eventId).catch(() => ({ data: null })),
      ]);
      setTables(tablesRes.data);
      setElements(elementsRes.data || []);
      if (eventRes.data) {
        if (eventRes.data.roomWidth) setRoomWidth(eventRes.data.roomWidth);
        if (eventRes.data.roomHeight) setRoomHeight(eventRes.data.roomHeight);
      }
    } catch {
      toast.error('Failed to load room layout');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.1, 2));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.1, 0.3));
  const handleResetZoom = () => setScale(1);

  const snapToGrid = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;

  const handleTableDragEnd = (tableId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const x = snapToGrid(e.target.x());
    const y = snapToGrid(e.target.y());
    e.target.x(x);
    e.target.y(y);

    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, xPosition: x, yPosition: y } : t))
    );
    setHasUnsavedChanges(true);
  };

  const handleElementDragEnd = (elementId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const x = snapToGrid(e.target.x());
    const y = snapToGrid(e.target.y());
    e.target.x(x);
    e.target.y(y);

    setElements((prev) =>
      prev.map((el) => (el.id === elementId ? { ...el, xPosition: x, yPosition: y } : el))
    );
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = async () => {
    if (!eventId) return;
    try {
      const tableUpdates = tables.map((t) =>
        tablesApi.update(eventId, t.id, { xPosition: t.xPosition, yPosition: t.yPosition })
      );
      const elementUpdates = elements.map((el) =>
        roomElementsApi.update(eventId, el.id, { xPosition: el.xPosition, yPosition: el.yPosition })
      );
      await Promise.all([...tableUpdates, ...elementUpdates]);
      setHasUnsavedChanges(false);
      toast.success('Layout saved');
    } catch {
      toast.error('Failed to save layout');
    }
  };

  const handleStageClick = async (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool === 'select') {
      if (e.target === e.target.getStage()) {
        setSelectedId(null);
      }
      return;
    }

    if (!eventId) return;
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const x = snapToGrid(pos.x / scale);
    const y = snapToGrid(pos.y / scale);

    if (tool === 'add-round' || tool === 'add-square' || tool === 'add-rectangle') {
      const shapeMap: Record<string, 'ROUND' | 'SQUARE' | 'RECTANGLE'> = {
        'add-round': 'ROUND',
        'add-square': 'SQUARE',
        'add-rectangle': 'RECTANGLE',
      };
      const shape = shapeMap[tool];
      const existingNames = tables.map((t) => t.tableName);
      let num = tables.length + 1;
      while (existingNames.includes(`Table ${num}`)) num++;

      const sizeDefaults: Record<string, { width: number; height: number }> = {
        ROUND: { width: 80, height: 80 },
        SQUARE: { width: 80, height: 80 },
        RECTANGLE: { width: 120, height: 80 },
      };

      try {
        const res = await tablesApi.create(eventId, {
          tableName: `Table ${num}`,
          capacity: shape === 'ROUND' ? 8 : 10,
          shape,
          xPosition: x,
          yPosition: y,
          width: sizeDefaults[shape].width,
          height: sizeDefaults[shape].height,
          rotation: 0,
        });
        setTables((prev) => [...prev, res.data]);
        toast.success(`Table ${num} added`);
      } catch {
        toast.error('Failed to add table');
      }
    } else if (tool === 'add-element') {
      try {
        const labelMap: Record<string, string> = {
          STAGE: 'Stage',
          DANCE_FLOOR: 'Dance Floor',
          BUFFET: 'Buffet',
          BAR: 'Bar',
          ENTRANCE: 'Entrance',
          EXIT: 'Exit',
        };
        const res = await roomElementsApi.create(eventId, {
          elementType: addElementType,
          label: labelMap[addElementType] || addElementType,
          xPosition: x,
          yPosition: y,
          width: 120,
          height: 80,
          rotation: 0,
        });
        setElements((prev) => [...prev, res.data]);
        toast.success('Element added');
      } catch {
        toast.error('Failed to add element');
      }
    }

    setTool('select');
  };

  const handleDeleteSelected = async () => {
    if (!selectedId || !eventId) return;

    const table = tables.find((t) => t.id === selectedId);
    const element = elements.find((el) => el.id === selectedId);

    try {
      if (table) {
        await tablesApi.delete(eventId, selectedId);
        setTables((prev) => prev.filter((t) => t.id !== selectedId));
        toast.success('Table deleted');
      } else if (element) {
        await roomElementsApi.delete(eventId, selectedId);
        setElements((prev) => prev.filter((el) => el.id !== selectedId));
        toast.success('Element deleted');
      }
      setSelectedId(null);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const renderGrid = () => {
    if (!showGrid) return null;
    const lines = [];
    for (let i = 0; i <= roomWidth; i += GRID_SIZE) {
      lines.push(
        <Line key={`v-${i}`} points={[i, 0, i, roomHeight]} stroke="#f1f3f5" strokeWidth={1} />
      );
    }
    for (let j = 0; j <= roomHeight; j += GRID_SIZE) {
      lines.push(
        <Line key={`h-${j}`} points={[0, j, roomWidth, j]} stroke="#f1f3f5" strokeWidth={1} />
      );
    }
    return lines;
  };

  const renderTable = (table: TableData) => {
    const x = table.xPosition ?? 100;
    const y = table.yPosition ?? 100;
    const isSelected = selectedId === table.id;
    const fillColor = isSelected ? '#dbe4ff' : '#f0f4ff';
    const strokeColor = isSelected ? '#4c6ef5' : '#bac8ff';

    if (table.shape === 'ROUND') {
      const radius = (table.width || 80) / 2;
      return (
        <Group
          key={table.id}
          x={x}
          y={y}
          rotation={table.rotation || 0}
          draggable
          onClick={() => setSelectedId(table.id)}
          onTap={() => setSelectedId(table.id)}
          onDragEnd={(e) => handleTableDragEnd(table.id, e)}
        >
          <Circle
            radius={radius}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={isSelected ? 2 : 1}
          />
          <Text
            text={table.tableName}
            fontSize={11}
            fontStyle="bold"
            fill="#364fc7"
            align="center"
            verticalAlign="middle"
            width={radius * 2 - 10}
            x={-(radius - 5)}
            y={-12}
          />
          <Text
            text={`Cap: ${table.capacity}`}
            fontSize={10}
            fill="#868e96"
            align="center"
            width={radius * 2 - 10}
            x={-(radius - 5)}
            y={4}
          />
        </Group>
      );
    }

    // SQUARE or RECTANGLE
    const w = table.width || (table.shape === 'SQUARE' ? 80 : 120);
    const h = table.height || (table.shape === 'SQUARE' ? 80 : 80);

    return (
      <Group
        key={table.id}
        x={x}
        y={y}
        rotation={table.rotation || 0}
        draggable
        onClick={() => setSelectedId(table.id)}
        onTap={() => setSelectedId(table.id)}
        onDragEnd={(e) => handleTableDragEnd(table.id, e)}
      >
        <Rect
          width={w}
          height={h}
          offsetX={w / 2}
          offsetY={h / 2}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={isSelected ? 2 : 1}
          cornerRadius={4}
        />
        <Text
          text={table.tableName}
          fontSize={11}
          fontStyle="bold"
          fill="#364fc7"
          align="center"
          verticalAlign="middle"
          width={w - 10}
          x={-(w / 2 - 5)}
          y={-14}
        />
        <Text
          text={`Cap: ${table.capacity}`}
          fontSize={10}
          fill="#868e96"
          align="center"
          width={w - 10}
          x={-(w / 2 - 5)}
          y={4}
        />
      </Group>
    );
  };

  const renderElement = (element: RoomElement) => {
    const isSelected = selectedId === element.id;
    const colors: Record<string, { fill: string; stroke: string; text: string }> = {
      STAGE: { fill: '#fff3bf', stroke: '#fab005', text: '#e67700' },
      DANCE_FLOOR: { fill: '#d3f9d8', stroke: '#51cf66', text: '#2b8a3e' },
      BUFFET: { fill: '#fff4e6', stroke: '#fd7e14', text: '#d9480f' },
      BAR: { fill: '#ffe8cc', stroke: '#ff922b', text: '#d9480f' },
      ENTRANCE: { fill: '#e3fafc', stroke: '#22b8cf', text: '#0b7285' },
      EXIT: { fill: '#f3d9fa', stroke: '#cc5de8', text: '#862e9c' },
    };
    const color = colors[element.elementType] || colors.STAGE;

    return (
      <Group
        key={element.id}
        x={element.xPosition}
        y={element.yPosition}
        rotation={element.rotation || 0}
        draggable
        onClick={() => setSelectedId(element.id)}
        onTap={() => setSelectedId(element.id)}
        onDragEnd={(e) => handleElementDragEnd(element.id, e)}
      >
        <Rect
          width={element.width}
          height={element.height}
          offsetX={element.width / 2}
          offsetY={element.height / 2}
          fill={color.fill}
          stroke={isSelected ? color.text : color.stroke}
          strokeWidth={isSelected ? 2 : 1}
          cornerRadius={6}
          dash={[5, 3]}
        />
        <Text
          text={element.label}
          fontSize={12}
          fontStyle="bold"
          fill={color.text}
          align="center"
          verticalAlign="middle"
          width={element.width}
          height={element.height}
          x={-element.width / 2}
          y={-element.height / 2}
        />
      </Group>
    );
  };

  const getToolHint = (): string => {
    switch (tool) {
      case 'add-round': return 'round table';
      case 'add-square': return 'square table';
      case 'add-rectangle': return 'rectangle table';
      case 'add-element': {
        const labels: Record<string, string> = {
          STAGE: 'stage', DANCE_FLOOR: 'dance floor', BUFFET: 'buffet',
          BAR: 'bar', ENTRANCE: 'entrance', EXIT: 'exit',
        };
        return labels[addElementType] || addElementType;
      }
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-surface-500">Loading room layout...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-surface-200 bg-white px-4 py-2">
        <div className="flex items-center gap-1 rounded-lg bg-surface-100 p-1">
          <button
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tool === 'select' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-600 hover:text-surface-800'}`}
            onClick={() => setTool('select')}
            title="Select & Move"
          >
            <MousePointer className="h-3.5 w-3.5" />
          </button>
          <button
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tool === 'add-round' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-600 hover:text-surface-800'}`}
            onClick={() => setTool('add-round')}
            title="Add Round Table"
          >
            <CircleIcon className="h-3.5 w-3.5" />
          </button>
          <button
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tool === 'add-square' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-600 hover:text-surface-800'}`}
            onClick={() => setTool('add-square')}
            title="Add Square Table"
          >
            <Square className="h-3.5 w-3.5" />
          </button>
          <button
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tool === 'add-rectangle' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-600 hover:text-surface-800'}`}
            onClick={() => setTool('add-rectangle')}
            title="Add Rectangle Table"
          >
            <RectangleHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="h-6 w-px bg-surface-200" />

        {/* Add Elements */}
        <div className="relative">
          <button
            className="btn-secondary btn-sm"
            onClick={() => setShowAddMenu(!showAddMenu)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Element
          </button>
          {showAddMenu && (
            <div className="absolute left-0 top-full mt-1 z-20 w-44 rounded-lg border border-surface-200 bg-white py-1 shadow-lg">
              {[
                { type: 'STAGE' as const, label: 'Stage', icon: Mic },
                { type: 'DANCE_FLOOR' as const, label: 'Dance Floor', icon: Music },
                { type: 'BAR' as const, label: 'Bar', icon: UtensilsCrossed },
                { type: 'ENTRANCE' as const, label: 'Entrance', icon: DoorOpen },
              ].map((item) => (
                <button
                  key={item.type}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
                  onClick={() => {
                    setAddElementType(item.type);
                    setTool('add-element');
                    setShowAddMenu(false);
                  }}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-surface-200" />

        {/* Grid toggle */}
        <button
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${showGrid ? 'bg-surface-200 text-surface-900' : 'text-surface-600 hover:text-surface-800'}`}
          onClick={() => setShowGrid((g) => !g)}
          title="Toggle Grid"
        >
          Grid
        </button>

        <div className="h-6 w-px bg-surface-200" />

        {/* Zoom Controls */}
        <button className="btn-icon p-1.5" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="text-xs text-surface-500 w-12 text-center">{Math.round(scale * 100)}%</span>
        <button className="btn-icon p-1.5" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </button>
        <button className="btn-icon p-1.5" onClick={handleResetZoom} title="Reset Zoom">
          <RotateCcw className="h-4 w-4" />
        </button>

        <div className="ml-auto flex items-center gap-2">
          {/* Tool hint */}
          {tool !== 'select' && (
            <div className="text-xs text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
              Click on canvas to place {getToolHint()}
            </div>
          )}

          {/* Save button */}
          <button
            className={`btn-sm flex items-center gap-1.5 ${hasUnsavedChanges ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleSaveAll}
            title="Save Layout"
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </button>

          {/* Delete Selected */}
          {selectedId && (
            <button className="btn-danger btn-sm" onClick={handleDeleteSelected}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-white">
        <Stage
          ref={stageRef}
          width={roomWidth}
          height={roomHeight}
          scaleX={scale}
          scaleY={scale}
          onClick={handleStageClick}
          style={{ cursor: tool !== 'select' ? 'crosshair' : 'default' }}
        >
          <Layer>
            {/* Grid */}
            {renderGrid()}

            {/* Room border */}
            <Rect
              x={0}
              y={0}
              width={roomWidth}
              height={roomHeight}
              stroke="#dee2e6"
              strokeWidth={2}
            />

            {/* Room Elements */}
            {elements.map(renderElement)}

            {/* Tables */}
            {tables.map(renderTable)}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
