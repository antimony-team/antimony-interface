import React, {forwardRef} from 'react';

import classNames from 'classnames';
import {Chip} from 'primereact/chip';
import {Badge} from 'primereact/badge';
import {observer} from 'mobx-react-lite';
import {Button} from 'primereact/button';
import {ListBox} from 'primereact/listbox';
import {OverlayPanel} from 'primereact/overlaypanel';

import {If} from '@sb/types/control';
import {useStatusMessages} from '@sb/lib/stores/root-store';

import './status-message-panel.sass';
import {
  StatusMessage,
  Severity,
  SeverityMapping,
  SeverityIconMap,
} from '@sb/types/domain/status-message';

const StatusMessagePanel = observer(
  forwardRef<OverlayPanel>((_, overlayRef) => {
    const statusMessageStore = useStatusMessages();

    const messageTemplate = (message: StatusMessage) => {
      return (
        <div
          className="sb-dock-status-messages-item-container"
          onMouseEnter={() => {
            statusMessageStore.maskAsRead(message.id);
          }}
        >
          <div
            className={classNames(
              'sb-dock-status-messages-item',
              SeverityMapping[message.severity],
            )}
          >
            <i className={SeverityIconMap[message.severity]}></i>
            <div className="sb-dock-status-messages-date">
              <span>
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span>
                {message.timestamp.toLocaleDateString([], {
                  month: 'numeric',
                  day: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>
            <If condition={!message.isRead}>
              <Badge severity="danger"></Badge>
            </If>
            <div className="sb-dock-status-messages-text">
              <div className="sb-dock-status-messages-summary">
                {message.content}
              </div>
              <div className="sb-dock-status-messages-detail">
                {message.source}
              </div>
            </div>
          </div>
        </div>
      );
    };

    // const filteredStatusMessages = useMemo(() => {
    //   if (severityFilter.size < 1) return statusMessageStore.data.toReversed();
    //
    //   return statusMessageStore.data
    //     .filter(msg => severityFilter.has(msg.severity))
    //     .toReversed();
    // }, [statusMessageStore.data, severityFilter]);

    const FilterChip = observer(({severity}: {severity: Severity}) => {
      const label = statusMessageStore.countBySeverity.has(severity)
        ? String(statusMessageStore.countBySeverity.get(severity))
        : '0';

      return (
        <Chip
          label={label}
          icon={SeverityIconMap[severity]}
          className={classNames(SeverityMapping[severity], {
            selected: statusMessageStore.severityFilter.has(severity),
          })}
          onClick={() => statusMessageStore.toggleSeverity(severity)}
        />
      );
    });

    return (
      <OverlayPanel ref={overlayRef} className="sb-dock-status-messages">
        <div className="sb-dock-status-messages-header">
          <div className="sb-dock-status-messages-left">
            <span>Filter by</span>
            <FilterChip severity={Severity.Error} />
            <FilterChip severity={Severity.Warning} />
            <FilterChip severity={Severity.Success} />
            <FilterChip severity={Severity.Info} />
          </div>
          <Button
            text
            rounded
            icon="pi pi-eye"
            tooltip="Mark all as read"
            onClick={() => statusMessageStore.markAllAsRead()}
            aria-label="Mark all as read"
          />
        </div>
        <ListBox
          options={statusMessageStore.filteredMessages}
          optionLabel="name"
          itemTemplate={messageTemplate}
          emptyMessage="No status messages"
        />
      </OverlayPanel>
    );
  }),
);

export default StatusMessagePanel;
