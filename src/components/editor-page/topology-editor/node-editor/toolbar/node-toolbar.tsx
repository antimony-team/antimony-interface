import React from 'react';

import classNames from 'classnames';
import {ExpandLines} from 'iconoir-react';
import {observer} from 'mobx-react-lite';
import {Button} from 'primereact/button';
import {Divider} from 'primereact/divider';

import {useTopologyStore} from '@sb/lib/stores/root-store';
import {useSimulationConfig} from '../state/simulation-config';

import './node-toolbar.sass';

interface NodeToolbarProps {
  onAddNode: () => void;
  onFitGraph: () => void;
  onDrawGroup: () => void;
  onToggleStabilization: () => void;
}

const NodeToolbar = observer((props: NodeToolbarProps) => {
  const topologyStore = useTopologyStore();
  const simulationConfig = useSimulationConfig();

  return (
    <div className="sb-node-editor-toolbar">
      <Button
        icon="pi pi-plus"
        text
        tooltip="Add Node"
        onClick={props.onAddNode}
        aria-label="Add Node"
      />
      <Button
        icon="pi pi-trash"
        text
        onClick={topologyStore.manager.clear}
        tooltip="Clear Graph"
        aria-label="Clear Graph"
      />
      <Button
        icon={<span className="material-symbols-outlined">Ink_Selection</span>}
        text
        onClick={props.onDrawGroup}
        tooltip="Group Nodes"
        aria-label="Group Nodes"
      />
      <Button
        className="sb-iconoir-button"
        icon={
          <ExpandLines
            style={{transform: 'rotate(90deg)'}}
            width={24}
            height={24}
          />
        }
        text
        tooltip="Fit Graph"
        onClick={props.onFitGraph}
        aria-label="Fit Graph"
      />
      <Divider />
      <Button
        icon="pi pi-cog"
        text
        tooltip="Graph Stabilization"
        className={classNames({toggled: simulationConfig.panelOpen})}
        onClick={props.onToggleStabilization}
        aria-label="Graph Stabilization"
      />
    </div>
  );
});

export default NodeToolbar;
