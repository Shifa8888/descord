// Invite link utilities for generating and managing invite codes

export interface InviteData {
  code: string;
  serverId: string;
  serverName: string;
  channelId?: string;
  channelName?: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  maxUses?: number;
  uses: number;
}

// Generate a random invite code (8 characters, alphanumeric)
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a full invite URL
export function createInviteUrl(code: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/invite/${code}`;
}

// Parse invite code from URL
export function parseInviteFromUrl(): string | null {
  const path = window.location.pathname;
  const match = path.match(/^\/invite\/([A-Za-z0-9]+)$/);
  return match ? match[1] : null;
}

// Validate invite code format
export function isValidInviteCode(code: string): boolean {
  return /^[A-Za-z0-9]{8}$/.test(code);
}

// Storage key for invites
const INVITES_STORAGE_KEY = 'discord_invites';
const JOINED_SERVERS_KEY = 'joined_servers';

// Get all invites from localStorage
export function getStoredInvites(): InviteData[] {
  try {
    const data = localStorage.getItem(INVITES_STORAGE_KEY);
    if (data) {
      return JSON.parse(data).map((invite: any) => ({
        ...invite,
        createdAt: new Date(invite.createdAt),
        expiresAt: invite.expiresAt ? new Date(invite.expiresAt) : undefined,
      }));
    }
  } catch (e) {
    console.error('Failed to load invites:', e);
  }
  return [];
}

// Save invites to localStorage
function saveInvites(invites: InviteData[]): void {
  try {
    localStorage.setItem(INVITES_STORAGE_KEY, JSON.stringify(invites));
  } catch (e) {
    console.error('Failed to save invites:', e);
  }
}

// Create a new invite
export function createInvite(params: {
  serverId: string;
  serverName: string;
  channelId?: string;
  channelName?: string;
  createdBy: string;
  expiresAt?: Date;
  maxUses?: number;
}): InviteData {
  const code = generateInviteCode();
  const invite: InviteData = {
    code,
    serverId: params.serverId,
    serverName: params.serverName,
    channelId: params.channelId,
    channelName: params.channelName,
    createdBy: params.createdBy,
    createdAt: new Date(),
    expiresAt: params.expiresAt,
    maxUses: params.maxUses,
    uses: 0,
  };

  const invites = getStoredInvites();
  invites.push(invite);
  saveInvites(invites);

  return invite;
}

// Get invite by code
export function getInviteByCode(code: string): InviteData | null {
  const invites = getStoredInvites();
  return invites.find(i => i.code === code) || null;
}

// Use an invite (increment uses counter)
export function useInvite(code: string): boolean {
  const invites = getStoredInvites();
  const invite = invites.find(i => i.code === code);

  if (!invite) return false;

  // Check if expired
  if (invite.expiresAt && new Date() > invite.expiresAt) {
    return false;
  }

  // Check if max uses reached
  if (invite.maxUses && invite.uses >= invite.maxUses) {
    return false;
  }

  invite.uses++;
  saveInvites(invites);
  return true;
}

// Get or initialize joined servers list
export function getJoinedServers(): string[] {
  try {
    const data = localStorage.getItem(JOINED_SERVERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

// Join a server via invite
export function joinServerViaInvite(code: string): { success: boolean; serverId?: string; error?: string } {
  const invite = getInviteByCode(code);

  if (!invite) {
    return { success: false, error: 'Invalid invite code' };
  }

  // Check if expired
  if (invite.expiresAt && new Date() > invite.expiresAt) {
    return { success: false, error: 'This invite has expired' };
  }

  // Check if max uses reached
  if (invite.maxUses && invite.uses >= invite.maxUses) {
    return { success: false, error: 'This invite has reached its use limit' };
  }

  // Check if already joined
  const joinedServers = getJoinedServers();
  if (joinedServers.includes(invite.serverId)) {
    return { success: false, error: 'You are already a member of this server' };
  }

  // Use the invite
  useInvite(code);

  // Add to joined servers
  joinedServers.push(invite.serverId);
  try {
    localStorage.setItem(JOINED_SERVERS_KEY, JSON.stringify(joinedServers));
  } catch (e) {
    console.error('Failed to save joined servers:', e);
  }

  return { success: true, serverId: invite.serverId };
}

// Check if user has joined a server
export function hasJoinedServer(serverId: string): boolean {
  const joinedServers = getJoinedServers();
  return joinedServers.includes(serverId);
}

// Delete an invite
export function deleteInvite(code: string): boolean {
  const invites = getStoredInvites();
  const index = invites.findIndex(i => i.code === code);

  if (index === -1) return false;

  invites.splice(index, 1);
  saveInvites(invites);
  return true;
}

// Get invites for a specific server
export function getInvitesForServer(serverId: string): InviteData[] {
  const invites = getStoredInvites();
  return invites.filter(i => i.serverId === serverId);
}