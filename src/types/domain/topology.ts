import {User} from '@sb/types/domain/user';
import {uuid4, YAMLDocument} from '@sb/types/types';
import {InterfaceConfig} from '@sb/types/domain/device-info';

export type BindFileIn = {
  filePath: string;
  content: string;
};

export type BindFile = BindFileIn & {
  id: uuid4;
  topologyId: uuid4;
};

export type TopologyIn = {
  collectionId: uuid4;
  definition: string;
  syncUrl: string;
};

export type TopologyOut = TopologyIn & {
  id: uuid4;
  creator: User;
  bindFiles: BindFile[];
  lastDeployFailed: boolean;
};

export type Topology = TopologyMeta & {
  id: uuid4;
  name: string;
  definition: YAMLDocument<TopologyDefinition>;
  definitionString: string;
  collectionId: uuid4;
  creator: User;
  syncUrl: string;
  bindFiles: BindFile[];
  lastDeployFailed: boolean;
};

export type RunTopology = TopologyMeta & {
  definition: YAMLDocument<TopologyDefinition>;
};

export interface TopologyDefinition {
  name: string;
  topology: {
    nodes: {[nodeName: string]: TopologyNode};
    links: {
      endpoints: string;
    };
  };
}

/**
 * Metadata object to hold the connections and positions of nodes in a topology.
 *
 * This object is generated from the definition object and is not persisted.
 */
export type TopologyMeta = {
  connections: NodeConnection[];
  connectionMap: Map<string, NodeConnection[]>;
};

/**
 * Holds information about a link between two nodes.
 *
 * This object is generated from the definition object and is not persisted.
 */
export interface NodeConnection {
  index: number;

  hostNode: string;
  hostInterface: string;
  hostInterfaceIndex: number;
  hostInterfaceConfig: InterfaceConfig;

  targetNode: string;
  targetInterface: string;
  targetInterfaceIndex: number;
  targetInterfaceConfig: InterfaceConfig;
}

export interface TopologyNode {
  kind?: string;
  image?: string;
  labels?: NodeLabels;
}

export interface NodeLabels {
  'graph-icon'?: string;
  'graph-group'?: string;
  'graph-level'?: number;
  'graph-posX'?: string;
  'graph-posY'?: string;
  'graph-geoCoordinateLat'?: string;
  'graph-geoCoordinateLng'?: string;

  [key: string]: string | number | undefined;
}
