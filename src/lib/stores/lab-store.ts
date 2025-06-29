import {
  DataBinder,
  DataResponse,
  Subscription,
} from '@sb/lib/stores/data-binder/data-binder';

import {DataStore} from '@sb/lib/stores/data-store';
import {RootStore} from '@sb/lib/stores/root-store';
import {StatusMessageStore} from '@sb/lib/stores/status-message-store';
import {TopologyStore} from '@sb/lib/stores/topology-store';
import {QueryBuilder} from '@sb/lib/utils/query-builder';
import {
  Instance,
  InstanceOut,
  InstanceState,
  Lab,
  LabCommand,
  LabCommandData,
  LabIn,
  LabOut,
  LabUpdateOut,
} from '@sb/types/domain/lab';
import {Result} from '@sb/types/result';
import dayjs from 'dayjs';
import {action, computed, observable, observe, runInAction} from 'mobx';

export class LabStore extends DataStore<Lab, LabIn, LabOut> {
  @observable accessor offset: number = 0;
  @observable accessor totalEntries: number | null = 0;

  @observable accessor limit: number = 1000;
  @observable accessor stateFilter: InstanceState[] = [
    InstanceState.Scheduled,
    InstanceState.Deploying,
    InstanceState.Running,
    InstanceState.Failed,
    InstanceState.Inactive,
    InstanceState.Stopping,
  ];
  @observable accessor collectionFilter: string[] = [];
  @observable accessor searchQuery: string = '';

  @observable accessor startDate: string | null = null;
  @observable accessor endDate: string | null = null;

  private readonly labCommandsSubscription: Subscription;

  private dataBinder: DataBinder;
  private topologyStore: TopologyStore;
  private statusMessageStore: StatusMessageStore;

  constructor(
    rootStore: RootStore,
    dataBinder: DataBinder,
    topologyStore: TopologyStore,
    statusMessageStore: StatusMessageStore,
  ) {
    super(rootStore);

    this.dataBinder = dataBinder;
    this.topologyStore = topologyStore;
    this.statusMessageStore = statusMessageStore;

    observe(this, 'getParams' as keyof this, () => this.fetch());

    this.dataBinder.subscribeNamespace(
      'lab-updates',
      this.onLabUpdate.bind(this),
    );

    this.labCommandsSubscription =
      this.dataBinder.subscribeNamespace('lab-commands');
  }

  protected get resourcePath(): string {
    return '/labs';
  }

  @action
  private async fetchSingle(labId: string) {
    const response = await this.rootStore._dataBinder.get<LabOut>(
      this.resourcePath + '/' + labId,
    );

    if (response.isOk()) {
      const updatedLab = this.parseLab(response.data.payload);

      runInAction(() => {
        this.data = [
          ...this.data
            .map(lab => {
              if (lab.id !== labId) return lab;

              return updatedLab;
            })
            .filter(lab => lab !== null),
        ];

        this.lookup = new Map(this.data.map(lab => [lab.id, lab]));
      });
    }
  }

  @computed
  protected get getParams() {
    return new QueryBuilder()
      .add('limit', this.limit)
      .add('offset', this.offset)
      .add('searchQuery', this.searchQuery)
      .addList('stateFilter', this.stateFilter)
      .addList('collectionFilter', this.collectionFilter)
      .add('startDate', this.startDate)
      .add('endDate', this.endDate)
      .toString();
  }

  public async sendLabCommand(command: LabCommandData): Promise<Result<null>> {
    const response = await this.labCommandsSubscription.socket!.emitWithAck(
      'data',
      JSON.stringify(command),
    );

    if (!('payload' in response)) {
      console.error('Failed to execute lab command: ', response);
      return Result.createErr(response);
    }

    return Result.createOk(response);
  }

  public async deployLab(lab: Lab): Promise<Result<null>> {
    const result = await this.sendLabCommand({
      labId: lab.id,
      command: LabCommand.Deploy,
    });

    if (result.isErr()) {
      this.statusMessageStore.error(
        result.error.message,
        'Failed to deploy lab',
      );
    }

    return result;
  }

  public async destroyLab(lab: Lab): Promise<Result<null>> {
    const result = await this.sendLabCommand({
      labId: lab.id,
      command: LabCommand.Destroy,
    });

    if (result.isErr()) {
      this.statusMessageStore.error(
        result.error.message,
        'Failed to destroy lab',
      );
    }

    return result;
  }

  public async stopNode(lab: Lab, nodeName: string): Promise<Result<null>> {
    const result = await this.sendLabCommand({
      labId: lab.id,
      command: LabCommand.StopNode,
      node: nodeName,
    });

    if (result.isErr()) {
      this.statusMessageStore.error(
        result.error.message,
        'Failed to stop node',
      );
    }

    return result;
  }

  public async startNode(lab: Lab, nodeName: string): Promise<Result<null>> {
    const result = await this.sendLabCommand({
      labId: lab.id,
      command: LabCommand.StartNode,
      node: nodeName,
    });

    if (result.isErr()) {
      this.statusMessageStore.error(
        result.error.message,
        'Failed to start node',
      );
    }

    return result;
  }

  public async restartNode(lab: Lab, nodeName: string): Promise<Result<null>> {
    const result = await this.sendLabCommand({
      labId: lab.id,
      command: LabCommand.RestartNode,
      node: nodeName,
    });

    if (result.isErr()) {
      this.statusMessageStore.error(
        result.error.message,
        'Failed to restart node',
      );
    }

    return result;
  }

  @action
  protected handleUpdate(response: DataResponse<LabOut[]>): void {
    this.data = this.parseLabs(response.payload);
    this.lookup = new Map(this.data.map(lab => [lab.id, lab]));

    if (response.headers && response.headers.has('X-Total-Count')) {
      this.totalEntries = Number(response.headers!.get('X-Total-Count'));
    }
  }

  private onLabUpdate(data: DataResponse<LabUpdateOut>) {
    if (data.payload.labId && this.lookup.has(data.payload.labId)) {
      void this.fetchSingle(data.payload.labId);
    } else {
      void this.fetch();
    }
  }

  @action
  public setLimit(limit: number) {
    this.limit = limit;
  }

  @action
  public setOffset(offset: number) {
    this.offset = offset;
  }

  @action
  public setStateFilter(filter: InstanceState[]) {
    this.stateFilter = filter;
  }

  @action
  public setCollectionFilter(filter: string[]) {
    this.collectionFilter = filter;
  }

  public toggleState(state: InstanceState) {
    if (this.stateFilter.includes(state)) {
      this.setStateFilter(this.stateFilter.filter(s => s !== state));
    } else {
      this.setStateFilter([...this.stateFilter, state]);
    }
  }

  public toggleCollection(collectionId: string) {
    if (this.collectionFilter.includes(collectionId)) {
      this.setCollectionFilter(
        this.collectionFilter.filter(c => c !== collectionId),
      );
    } else {
      this.setCollectionFilter([...this.collectionFilter, collectionId]);
    }
  }

  @action
  public setSearchQuery(searchQuery: string) {
    this.searchQuery = searchQuery;
  }

  @action
  public setDates(startDate: string, endDate: string) {
    this.startDate = startDate;
    this.endDate = endDate;
  }

  private parseLabs(input: LabOut[]): Lab[] {
    return input.map(lab => this.parseLab(lab)).filter(lab => lab !== null);
  }

  private parseLab(input: LabOut): Lab | null {
    const startTime = new Date(input.startTime);
    const endTime = input.endTime ? new Date(input.endTime) : null;

    const definition = this.topologyStore.parseTopology(
      input.topologyDefinition,
    );

    if (!definition) {
      console.error('[NET] Failed to parse incoming run topology: ', input);
      return null;
    }

    return {
      ...input,
      startTime: startTime,
      endTime: endTime,
      state: input.instance
        ? input.instance.state
        : endTime &&
            endTime >= dayjs(new Date()).toDate() &&
            startTime >= dayjs(new Date()).subtract(2, 'minutes').toDate()
          ? InstanceState.Scheduled
          : InstanceState.Inactive,
      instance: this.parseInstance(input.instance),
      instanceName: input.instanceName,
      topologyDefinition: {
        ...this.topologyStore.manager.buildTopologyMetadata(definition),
        definition: definition,
      },
    };
  }

  private parseInstance(input?: InstanceOut): Instance | null {
    if (input === undefined) return null;

    return {
      ...input,
      nodeMap: new Map(input.nodes?.map(node => [node.name, node])),
    };
  }
}
