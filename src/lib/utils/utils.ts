import {ElementDefinition} from 'cytoscape';
import {TooltipOptions} from 'primereact/tooltip/tooltipoptions';

import {DeviceStore} from '@sb/lib/stores/device-store';
import {TopologyManager} from '@sb/lib/topology-manager';
import {FetchState} from '@sb/types/types';
import {Topology} from '@sb/types/domain/topology';
import {Scalar, YAMLMap} from 'yaml';

export async function fetchResource<T>(
  path: string,
  method: string,
  body?: T,
  requestHeaders?: HeadersInit
): Promise<Response | null> {
  try {
    return await fetch(path, {
      method: method,
      headers: requestHeaders,
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
}

export function matchesSearch(value: string, search: string) {
  return value.toLowerCase().includes(search.toLowerCase());
}

export function combinedFetchState(...fetchStates: FetchState[]): FetchState {
  const states = new Set(fetchStates);
  if (states.has(FetchState.Error)) return FetchState.Error;
  if (states.has(FetchState.Pending)) return FetchState.Pending;

  return FetchState.Done;
}

export function filterSchemaEnum(values: string[] | undefined) {
  if (values === undefined) return undefined;

  const unqiueIndices = [];
  const filteredValues = new Set<string>();

  for (let i = 0; i < values.length; i++) {
    if (filteredValues.has(values[i].toLowerCase())) continue;

    filteredValues.add(values[i].toLowerCase());
    unqiueIndices.push(i);
  }

  return unqiueIndices.map(index => values[index]);
}

export function arrayOf(value: string, length: number) {
  return [...Array(length)].map(() => value);
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  pan: {x: number; y: number}
) {
  // const canvas = ctx.canvas;
  // const width = canvas.width;
  // const height = canvas.height;
  //
  // const gridSpacing = 40;
  // const gridColor = 'rgb(38,55,55)';
  // const largeGridColor = 'rgb(40,68,71)';
  //
  // ctx.clearRect(0, 0, width, height);
  // ctx.save();

  const width = window.outerWidth;
  const height = window.outerHeight;
  const gridSpacing = 50;
  const gridExtent = 4;
  const gridColor = 'rgb(38,55,55)';
  const largeGridColor = 'rgb(40,68,71)';

  ctx.strokeStyle = 'rgba(34, 51, 56, 1)';
  ctx.beginPath();

  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);

  for (let x = -width * gridExtent; x <= width * gridExtent; x += gridSpacing) {
    ctx.beginPath();
    if (x % 8 === 0) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = largeGridColor;
    } else {
      ctx.lineWidth = 1;
      ctx.strokeStyle = gridColor;
    }
    ctx.moveTo(x, height * gridExtent);
    ctx.lineTo(x, -height * gridExtent);
    ctx.stroke();
  }
  for (
    let y = -height * gridExtent;
    y <= height * gridExtent;
    y += gridSpacing
  ) {
    ctx.beginPath();
    if (y % 8 === 0) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = largeGridColor;
    } else {
      ctx.lineWidth = 1;
      ctx.strokeStyle = gridColor;
    }
    ctx.moveTo(width * gridExtent, y);
    ctx.lineTo(-width * gridExtent, y);
    ctx.stroke();
  }

  // apply pan & zoom to align grid

  // const startX = -pan.x / zoom;
  // const startY = -pan.y / zoom;
  // const endX = startX + width / zoom;
  // const endY = startY + height / zoom;
  //
  // for (
  //   let x = Math.floor(startX / gridSpacing) * gridSpacing;
  //   x < endX;
  //   x += gridSpacing
  // ) {
  //   ctx.beginPath();
  //   ctx.lineWidth = x % (gridSpacing * 8) === 0 ? 2 : 1;
  //   ctx.strokeStyle = x % (gridSpacing * 8) === 0 ? largeGridColor : gridColor;
  //   ctx.moveTo(x, startY);
  //   ctx.lineTo(x, endY);
  //   ctx.stroke();
  // }
  //
  // for (
  //   let y = Math.floor(startY / gridSpacing) * gridSpacing;
  //   y < endY;
  //   y += gridSpacing
  // ) {
  //   ctx.beginPath();
  //   ctx.lineWidth = y % (gridSpacing * 8) === 0 ? 2 : 1;
  //   ctx.strokeStyle = y % (gridSpacing * 8) === 0 ? largeGridColor : gridColor;
  //   ctx.moveTo(startX, y);
  //   ctx.lineTo(endX, y);
  //   ctx.stroke();
  // }

  // ctx.restore();
}

export function pushOrCreateList<T, R>(map: Map<T, R[]>, key: T, value: R) {
  if (map.has(key)) {
    map.get(key)!.push(value);
  } else {
    map.set(key, [value]);
  }
}

function hydratePositionsFromYaml(topology: Topology) {
  const yamlNodes = topology.definition.getIn(['topology', 'nodes']) as YAMLMap;

  const mapLevelComment = yamlNodes.commentBefore || '';

  yamlNodes.items.forEach(item => {
    const key = item.key as Scalar;

    const nodeId = key.value as string;
    let comment = key.commentBefore || key.comment;

    if (!comment && yamlNodes.items[0] === item && mapLevelComment) {
      comment = mapLevelComment;
    }

    if (!comment) return;

    const match = comment.match(/pos=\[([\d.-]+),([\d.-]+)\]/);
    if (match) {
      const x = parseFloat(match[1]);
      const y = parseFloat(match[2]);

      topology.positions.set(nodeId, {x, y});
    }
  });
}

export function generateGraph(
  topology: Topology,
  deviceStore: DeviceStore,
  topologyManager: TopologyManager
): ElementDefinition[] {
  const elements: ElementDefinition[] = [];
  hydratePositionsFromYaml(topology);
  const nodeDataMap = topology.metaData?.nodeData ?? new Map();
  // Nodes
  for (const [, [nodeName, node]] of Object.entries(
    topology.definition.toJS().topology.nodes
  ).entries()) {
    const kind = node?.kind ?? 'default';
    const meta = nodeDataMap.get(nodeName);
    elements.push({
      data: {
        id: nodeName,
        parent: meta?.parent,
        label: nodeName,
        title: topologyManager.getNodeTooltip(nodeName),
        kind: kind,
        image: deviceStore.getNodeIcon(node?.kind),
      },
      position: meta?.position ?? {x: 0, y: 0},
      classes: 'topology-node',
    });
  }
  // Edges
  for (const connection of topology.connections) {
    elements.push({
      data: {
        id: connection.index.toString(),
        source: connection.hostNode,
        target: connection.targetNode,
        title: topologyManager.getEdgeTooltip(connection),
        sourceLabel: connection.hostInterface,
        targetLabel: connection.targetInterface,
      },
      classes: 'edge',
    });
  }
  for (const utilityNodes of topology.metaData.utilityNodes) {
    elements.push({
      data: {
        id: utilityNodes.id,
        parent: utilityNodes.parent,
        label: utilityNodes.label,
      },
      position: utilityNodes.position,
      classes: utilityNodes.class,
    });
  }
  return elements;
}

export function generateUuidv4() {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16)
  );
}

export const SBTooltipOptions: TooltipOptions = {
  position: 'top',
  showDelay: 200,
  showOnDisabled: true,
};

export function conditional<T>(condition: boolean, onTrue: T, onFalse: T) {
  return condition ? onTrue : onFalse;
}
