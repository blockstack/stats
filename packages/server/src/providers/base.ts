import { EventAction, Actions, RunOptions, Provider, PageAction } from '@blockstack/stats';
import { Request } from 'express';

export class BaseProvider {
  static async run(opts: RunOptions, provider: Provider, req: Request) {
    if (opts.action === Actions.EVENT) {
      const { eventData } = opts;
      if (!eventData) {
        throw 'No data provided for event';
      }
      console.log(`${this.name}: sending event.`, eventData);
      return this.event(
        {
          context: opts.context,
          eventData,
          id: opts.id,
          provider,
        },
        req
      );
    }

    const { pageData, id } = opts;

    if (!pageData) {
      throw 'No page data provided for page method';
    }
    console.log(`${this.name}: sending page.`, pageData);
    return this.page(
      {
        context: opts.context,
        pageData,
        id,
        provider,
      },
      req
    );
  }

  static async event(_eventAction: EventAction, _req: Request): Promise<void> {
    return Promise.reject(`.event not implemented for ${this.name}`);
  }

  static async page(_pageAction: PageAction, _req: Request): Promise<void> {
    return Promise.reject(`.page not implemented for ${this.name}`);
  }
}
