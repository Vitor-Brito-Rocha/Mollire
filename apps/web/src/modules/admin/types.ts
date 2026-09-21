export type AdminUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'TENANT';
  created_at: string;
  updated_at: string;
};

// A pending grant of ADMIN, parked for an email that hasn't logged in yet —
// redeemed automatically on that email's first login.
export type AdminInvite = {
  email: string;
  invited_by: string;
  created_at: string;
};

export type AdminsList = {
  admins: AdminUser[];
  pendingInvites: AdminInvite[];
};

export type InviteAdminResponse =
  | { status: 'promoted'; user: AdminUser }
  | { status: 'already_admin'; user: AdminUser }
  | { status: 'invited'; invite: AdminInvite };
