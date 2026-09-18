import axios from './axios';
import { csrf, Role } from './auth';

export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface Invitation {
  id: number;
  email: string;
  role: Role;
  status: InvitationStatus;
  invited_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string | null;
}

export async function listInvitations(status?: InvitationStatus): Promise<Invitation[]> {
  const response = await axios.get<{ invitations: Invitation[] }>('/api/admin/invitations', {
    params: status ? { status } : undefined,
  });
  return response.data.invitations;
}

/**
 * Invite someone. The token itself never comes back — it exists only in the
 * email — so there is nothing here to copy into a chat message.
 */
export async function inviteUser(email: string, role: Role): Promise<Invitation> {
  await csrf();
  const response = await axios.post<Invitation>('/api/admin/invitations', { email, role });
  return response.data;
}

/**
 * Send the invitation again. Only the hash of the original token was kept, so
 * this issues a new link and the old one stops working.
 */
export async function remindInvitation(id: number): Promise<Invitation> {
  await csrf();
  const response = await axios.post<Invitation>(`/api/admin/invitations/${id}/resend`);
  return response.data;
}

export async function revokeInvitation(id: number): Promise<Invitation> {
  await csrf();
  const response = await axios.delete<Invitation>(`/api/admin/invitations/${id}`);
  return response.data;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  clinician: 'Clinician',
  research_assistant: 'Research assistant',
  data_manager: 'Data manager',
};
