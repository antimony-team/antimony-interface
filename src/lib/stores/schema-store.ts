import {action, observable} from 'mobx';

import {DataStore} from '@sb/lib/stores/data-store';
import {DefaultFetchReport, FetchReport} from '@sb/types/types';
import {ClabSchema} from '@sb/types/domain/schema';
import {DataResponse} from '@sb/lib/stores/data-binder/data-binder';

export class SchemaStore extends DataStore<ClabSchema, void, ClabSchema> {
  @observable accessor fetchReport: FetchReport = DefaultFetchReport;
  @observable accessor clabSchema: ClabSchema | null = null;

  protected get isExternal(): boolean {
    return true;
  }

  protected get resourcePath(): string {
    return process.env.SB_CLAB_SCHEMA_URL!;
  }

  @action
  protected handleUpdate(response: DataResponse<ClabSchema>): void {
    this.clabSchema = response.payload;
  }
}
