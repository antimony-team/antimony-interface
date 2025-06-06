import StateIndicator from '@sb/components/dashboard-page/state-indicator/state-indicator';
import {useCollectionStore, useLabStore} from '@sb/lib/stores/root-store';
import {Choose, When} from '@sb/types/control';
import {InstanceState, Lab} from '@sb/types/domain/lab';
import {Button, ButtonProps} from 'primereact/button';
import React from 'react';

import './lab-entry.sass';

interface LabEntryProps {
  lab: Lab;

  onOpenLab: () => void;
  onRescheduleLab: () => void;

  onDestroyLabRequest: () => void;
}

const defaultLabButtonProps: ButtonProps = {
  rounded: true,
  text: true,
  size: 'large',
  tooltipOptions: {
    position: 'bottom',
    showDelay: 200,
  },
};

const LabEntry = (props: LabEntryProps) => {
  const labStore = useLabStore();
  const collectionStore = useCollectionStore();

  function generateDisplayDate(lab: Lab): string {
    switch (lab.state) {
      case InstanceState.Scheduled:
        return lab.startTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      case InstanceState.Deploying:
      case InstanceState.Running:
        return lab.startTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      case InstanceState.Inactive:
      case InstanceState.Stopping:
      case InstanceState.Failed:
        return lab.startTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      default:
        return '';
    }
  }

  function onEditLab(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    props.onRescheduleLab();
  }

  return (
    <div className="lab-item-card">
      <div className="lab-group sb-corner-tab" onClick={props.onOpenLab}>
        <span>
          {collectionStore.lookup.get(props.lab.collectionId)?.name ??
            'unknown'}
        </span>
      </div>
      <div className="lab-name" onClick={() => props.onOpenLab()}>
        <span>{props.lab.name}</span>
      </div>
      <div className="lab-state">
        <div className="lab-state-buttons">
          <Choose>
            <When condition={props.lab.state === InstanceState.Scheduled}>
              <Button
                icon="pi pi-pen"
                severity="info"
                tooltip="Edit"
                onClick={onEditLab}
                aria-label="Edit"
                {...defaultLabButtonProps}
              />
              <Button
                icon="pi pi-power-off"
                severity="danger"
                tooltip="Destroy"
                aria-label="Destroy"
                onClick={() => props.onDestroyLabRequest()}
                {...defaultLabButtonProps}
              />
            </When>
            <When condition={props.lab.state === InstanceState.Inactive}>
              <Button
                icon="pi pi-play"
                severity="success"
                tooltip="Deploy Now"
                aria-label="Deploy Now"
                onClick={() => labStore.deployLab(props.lab)}
                {...defaultLabButtonProps}
              />
            </When>
            <When condition={props.lab.state === InstanceState.Deploying}>
              <Button
                icon="pi pi-power-off"
                severity="danger"
                tooltip="Destroy"
                aria-label="Destroy"
                onClick={() => props.onDestroyLabRequest()}
                {...defaultLabButtonProps}
              />
            </When>
            <When condition={props.lab.state === InstanceState.Failed}>
              <Button
                icon="pi pi-sync"
                severity="warning"
                tooltip="Redeploy"
                aria-label="Redeploy"
                onClick={() => labStore.deployLab(props.lab)}
                {...defaultLabButtonProps}
              />
            </When>
            <When condition={props.lab.state === InstanceState.Running}>
              <Button
                icon="pi pi-sync"
                severity="warning"
                tooltip="Redeploy"
                aria-label="Redeploy"
                onClick={() => labStore.deployLab(props.lab)}
                {...defaultLabButtonProps}
              />
              <Button
                icon="pi pi-power-off"
                severity="danger"
                tooltip="Destroy"
                aria-label="Destroy"
                onClick={() => props.onDestroyLabRequest()}
                {...defaultLabButtonProps}
              />
            </When>
          </Choose>
        </div>
        <span className="lab-state-label">
          <StateIndicator lab={props.lab} showText={true} />
          <div className="lab-state-date">
            <i className="pi pi-clock"></i>
            <span>{generateDisplayDate(props.lab)}</span>
          </div>
        </span>
      </div>
    </div>
  );
};

export default LabEntry;
