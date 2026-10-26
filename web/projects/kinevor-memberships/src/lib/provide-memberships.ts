import { EnvironmentProviders, Provider, Type, makeEnvironmentProviders } from '@angular/core';
import { HttpMembershipsGateway } from './http-memberships.gateway';
import {
  MEMBERSHIPS_API_BASE_URL,
  MEMBERSHIPS_GATEWAY,
  MembershipsGateway,
} from './membership.model';
import { MembershipsFacade } from './memberships.facade';

/** Configuration accepted by {@link provideMemberships}. */
export interface MembershipsOptions {
  /** Base URL of the memberships API, including `/api/v1`. */
  readonly apiBaseUrl?: string;
  /** Alternative gateway implementation; defaults to {@link HttpMembershipsGateway}. */
  readonly gateway?: Type<MembershipsGateway>;
}

/**
 * Registers the memberships gateway and facade.
 *
 * The host application must provide `HttpClient` when the default gateway is used.
 *
 * @param options - API base URL and gateway override.
 * @returns Providers for the memberships feature.
 */
export function provideMemberships(options: MembershipsOptions = {}): EnvironmentProviders {
  const providers: (Provider | EnvironmentProviders)[] = [
    { provide: MEMBERSHIPS_GATEWAY, useClass: options.gateway ?? HttpMembershipsGateway },
    MembershipsFacade,
  ];

  if (options.apiBaseUrl) {
    providers.push({ provide: MEMBERSHIPS_API_BASE_URL, useValue: options.apiBaseUrl });
  }

  return makeEnvironmentProviders(providers);
}
