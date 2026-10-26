import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ApiEnvelope,
  FreezeMembershipRequest,
  MembershipCreated,
  MembershipDetail,
  MembershipListQuery,
  MEMBERSHIPS_API_BASE_URL,
  MembershipsGateway,
  MembershipPlan,
  MembershipSummary,
  PagedResult,
  StartMembershipRequest,
  StartMyMembershipRequest,
} from './membership.model';

/** Typed HTTP gateway for the Kinevor memberships API. */
@Injectable()
export class HttpMembershipsGateway implements MembershipsGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(MEMBERSHIPS_API_BASE_URL).replace(/\/$/, '');

  /** {@inheritDoc MembershipsGateway.listPlans} */
  async listPlans(includeInactive = false): Promise<MembershipPlan[]> {
    const params = new HttpParams().set('includeInactive', includeInactive);
    const response = await firstValueFrom(
      this.http.get<ApiEnvelope<MembershipPlan[]>>(`${this.baseUrl}/plans`, { params }),
    );
    return response.data;
  }

  /** {@inheritDoc MembershipsGateway.planById} */
  async planById(id: string): Promise<MembershipPlan> {
    const response = await firstValueFrom(
      this.http.get<ApiEnvelope<MembershipPlan>>(`${this.baseUrl}/plans/${id}`),
    );
    return response.data;
  }

  /** {@inheritDoc MembershipsGateway.listMemberships} */
  async listMemberships(query: MembershipListQuery): Promise<PagedResult<MembershipSummary>> {
    let params = new HttpParams()
      .set('page', query.page ?? 1)
      .set('pageSize', query.pageSize ?? 20);

    if (query.memberId) params = params.set('memberId', query.memberId);
    if (query.status) params = params.set('status', query.status);

    const response = await firstValueFrom(
      this.http.get<ApiEnvelope<PagedResult<MembershipSummary>>>(
        `${this.baseUrl}/memberships`,
        { params },
      ),
    );
    return response.data;
  }

  /** {@inheritDoc MembershipsGateway.currentMembership} */
  async currentMembership(memberId: string): Promise<MembershipDetail | null> {
    const params = new HttpParams().set('memberId', memberId);
    const response = await firstValueFrom(
      this.http.get<ApiEnvelope<MembershipDetail | null>>(
        `${this.baseUrl}/memberships/current`,
        { params },
      ),
    );
    return response.data;
  }

  /** {@inheritDoc MembershipsGateway.membershipById} */
  async membershipById(id: string): Promise<MembershipDetail> {
    const response = await firstValueFrom(
      this.http.get<ApiEnvelope<MembershipDetail>>(`${this.baseUrl}/memberships/${id}`),
    );
    return response.data;
  }

  /** {@inheritDoc MembershipsGateway.startMembership} */
  async startMembership(request: StartMembershipRequest): Promise<MembershipCreated> {
    const response = await firstValueFrom(
      this.http.post<ApiEnvelope<MembershipCreated>>(`${this.baseUrl}/memberships`, request),
    );
    return response.data;
  }

  /** {@inheritDoc MembershipsGateway.freezeMembership} */
  async freezeMembership(
    id: string,
    request: FreezeMembershipRequest,
  ): Promise<MembershipDetail> {
    const response = await firstValueFrom(
      this.http.post<ApiEnvelope<MembershipDetail>>(
        `${this.baseUrl}/memberships/${id}/freeze`,
        request,
      ),
    );
    return response.data;
  }

  /** {@inheritDoc MembershipsGateway.resumeMembership} */
  async resumeMembership(id: string): Promise<MembershipDetail> {
    const response = await firstValueFrom(
      this.http.post<ApiEnvelope<MembershipDetail>>(
        `${this.baseUrl}/memberships/${id}/resume`,
        {},
      ),
    );
    return response.data;
  }

  /** {@inheritDoc MembershipsGateway.cancelMembership} */
  async cancelMembership(id: string): Promise<MembershipDetail> {
    const response = await firstValueFrom(
      this.http.post<ApiEnvelope<MembershipDetail>>(
        `${this.baseUrl}/memberships/${id}/cancel`,
        {},
      ),
    );
    return response.data;
  }

  /** {@inheritDoc MembershipsGateway.renewMembership} */
  async renewMembership(id: string, periods: number): Promise<MembershipDetail> {
    const response = await firstValueFrom(
      this.http.post<ApiEnvelope<MembershipDetail>>(
        `${this.baseUrl}/memberships/${id}/renew`,
        { periods },
      ),
    );
    return response.data;
  }

  /** {@inheritDoc MembershipsGateway.myMemberships} */
  async myMemberships(): Promise<MembershipSummary[]> {
    const response = await firstValueFrom(
      this.http.get<ApiEnvelope<MembershipSummary[]>>(`${this.baseUrl}/me/memberships`),
    );
    return response.data;
  }

  /** {@inheritDoc MembershipsGateway.myCurrent} */
  async myCurrent(): Promise<MembershipDetail | null> {
    const response = await firstValueFrom(
      this.http.get<ApiEnvelope<MembershipDetail | null>>(
        `${this.baseUrl}/me/memberships/current`,
      ),
    );
    return response.data;
  }

  /** {@inheritDoc MembershipsGateway.myMembershipById} */
  async myMembershipById(id: string): Promise<MembershipDetail> {
    const response = await firstValueFrom(
      this.http.get<ApiEnvelope<MembershipDetail>>(`${this.baseUrl}/me/memberships/${id}`),
    );
    return response.data;
  }

  /** {@inheritDoc MembershipsGateway.startMyMembership} */
  async startMyMembership(request: StartMyMembershipRequest): Promise<MembershipCreated> {
    const response = await firstValueFrom(
      this.http.post<ApiEnvelope<MembershipCreated>>(`${this.baseUrl}/me/memberships`, request),
    );
    return response.data;
  }

  /** {@inheritDoc MembershipsGateway.freezeMyMembership} */
  async freezeMyMembership(
    id: string,
    request: FreezeMembershipRequest,
  ): Promise<MembershipDetail> {
    const response = await firstValueFrom(
      this.http.post<ApiEnvelope<MembershipDetail>>(
        `${this.baseUrl}/me/memberships/${id}/freeze`,
        request,
      ),
    );
    return response.data;
  }

  /** {@inheritDoc MembershipsGateway.resumeMyMembership} */
  async resumeMyMembership(id: string): Promise<MembershipDetail> {
    const response = await firstValueFrom(
      this.http.post<ApiEnvelope<MembershipDetail>>(
        `${this.baseUrl}/me/memberships/${id}/resume`,
        {},
      ),
    );
    return response.data;
  }

  /** {@inheritDoc MembershipsGateway.cancelMyMembership} */
  async cancelMyMembership(id: string): Promise<MembershipDetail> {
    const response = await firstValueFrom(
      this.http.post<ApiEnvelope<MembershipDetail>>(
        `${this.baseUrl}/me/memberships/${id}/cancel`,
        {},
      ),
    );
    return response.data;
  }

  /** {@inheritDoc MembershipsGateway.renewMyMembership} */
  async renewMyMembership(id: string, periods: number): Promise<MembershipDetail> {
    const response = await firstValueFrom(
      this.http.post<ApiEnvelope<MembershipDetail>>(
        `${this.baseUrl}/me/memberships/${id}/renew`,
        { periods },
      ),
    );
    return response.data;
  }
}
