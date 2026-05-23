
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash, Volume2, Send, Smile, Plus, ChevronDown,
  Phone, Video, Pin, Users, Search, Bell, Settings, Mic, MicOff,
  Headphones, X, Menu, ImagePlus, Gift, MessageSquare, Link as LinkIcon, Copy, Check,
} from 'lucide-react';
import { cn } from './utils/cn';
import {
  users, servers, getMessages, autoReplies,
  type UserData, type MessageData, type ServerData, type ChannelData, type Status,
} from './data';
import {
  createInvite, createInviteUrl, parseInviteFromUrl, getInvitesForServer,
  deleteInvite, joinServerViaInvite, hasJoinedServer,
  type InviteData,
} from './utils/invite';

/* ─── Status Badge ─── */
const statusColor: Record<Status, string> = {
  online: 'bg-emerald-500',
  idle: 'bg-amber-400',
  dnd: 'bg-red-500',
  offline: 'bg-gray-500',
};

const StatusDot: React.FC<{ status: Status; size?: number; ring?: boolean }> = ({
  status, size = 12, ring = false,
}) => (
  <span
    className={cn(
      'absolute bottom-0 right-0 rounded-full border-2 border-[#111118] block',
      statusColor[status],
      ring && status === 'online' && 'pulse-online',
    )}
    style={{ width: size, height: size }}
  />
);

/* ─── Avatar ─── */
const Avatar: React.FC<{
  user: UserData; size?: 'xs' | 'sm' | 'md' | 'lg'; showStatus?: boolean;
}> = ({ user, size = 'md', showStatus = true }) => {
  const dims = { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div className="relative flex-shrink-0">
      <div className={cn('rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white', dims[size], user.color)}>
        {user.initials}
      </div>
      {showStatus && <StatusDot status={user.status} size={size === 'lg' ? 14 : size === 'xs' ? 8 : 10} ring={user.status === 'online'} />}
    </div>
  );
};

/* ─── Server Icon ─── */
const ServerBtn: React.FC<{
  server: ServerData; active: boolean; onClick: () => void;
}> = ({ server, active, onClick }) => (
  <div className="relative group flex items-center justify-center my-1">
    {/* pill indicator */}
    <motion.span
      className="absolute left-0 w-1 rounded-r-full bg-white"
      initial={false}
      animate={{ height: active ? 36 : 0, opacity: active ? 1 : 0 }}
      whileHover={{ height: 20, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      className={cn(
        'w-12 h-12 flex items-center justify-center text-xl transition-all duration-300 cursor-pointer',
        active
          ? 'rounded-2xl bg-gradient-to-br ' + server.color
          : 'rounded-[50%] bg-[#232333] hover:rounded-2xl hover:bg-gradient-to-br hover:' + server.color,
      )}
    >
      {server.emoji}
    </motion.button>
    {/* tooltip */}
    <div className="absolute left-16 z-50 px-3 py-1.5 rounded-md bg-[#111118] border border-white/10 text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl">
      {server.name}
      <span className="absolute left-0 top-1/2 -translate-x-[5px] -translate-y-1/2 w-2.5 h-2.5 bg-[#111118] border-l border-b border-white/10 rotate-45" />
    </div>
  </div>
);

/* ─── Channel Item ─── */
const ChannelBtn: React.FC<{
  ch: ChannelData; active: boolean; onClick: () => void;
}> = ({ ch, active, onClick }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ x: 2 }}
    className={cn(
      'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors group',
      active ? 'bg-white/[0.08] text-white' : 'text-[#8e8ea0] hover:bg-white/[0.04] hover:text-[#c0c0d0]',
    )}
  >
    {ch.type === 'text'
      ? <Hash className="w-4 h-4 flex-shrink-0 opacity-60" />
      : <Volume2 className="w-4 h-4 flex-shrink-0 opacity-60" />}
    <span className="truncate flex-1 text-left">{ch.name}</span>
    {ch.unread && ch.unread > 0 && (
      <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
        {ch.unread}
      </span>
    )}
  </motion.button>
);

/* ─── Category Toggle ─── */
const Category: React.FC<{
  name: string;
  channels: ChannelData[];
  activeChannel: string;
  onSelect: (id: string) => void;
}> = ({ name, channels, activeChannel, onSelect }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1 px-1 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#55556a] hover:text-[#8e8ea0] transition-colors cursor-pointer"
      >
        <ChevronDown className={cn('w-3 h-3 transition-transform', !open && '-rotate-90')} />
        {name}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {channels.map(ch => (
              <ChannelBtn key={ch.id} ch={ch} active={activeChannel === ch.id} onClick={() => onSelect(ch.id)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Message Bubble ─── */
const MessageRow: React.FC<{
  msg: MessageData; user: UserData; isOwn: boolean; delay: number;
}> = ({ msg, user, isOwn, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, delay }}
    className={cn('flex gap-3 px-4 py-1 group hover:bg-white/[0.02] transition-colors', isOwn && 'flex-row-reverse')}
  >
    <Avatar user={user} size="md" showStatus={false} />
    <div className={cn('max-w-[75%] min-w-0', isOwn && 'flex flex-col items-end')}>
      <div className={cn('flex items-baseline gap-2 mb-0.5', isOwn && 'flex-row-reverse')}>
        <span className="font-semibold text-sm" style={{ color: `var(--tw-gradient-from)` }}>
          {/* Use a fixed color per user */}
          <span className={cn(
            user.id === 'u1' ? 'text-violet-400' :
            user.id === 'u2' ? 'text-pink-400' :
            user.id === 'u3' ? 'text-amber-400' :
            user.id === 'u4' ? 'text-red-400' :
            user.id === 'u5' ? 'text-blue-400' :
            user.id === 'u6' ? 'text-teal-400' :
            user.id === 'u7' ? 'text-cyan-400' :
            user.id === 'u8' ? 'text-fuchsia-400' :
            user.id === 'u9' ? 'text-lime-400' :
            'text-gray-300'
          )}>{isOwn ? 'You' : user.name}</span>
        </span>
        <span className="text-[11px] text-[#55556a]">{msg.time}</span>
      </div>
      <div className={cn(
        'px-3.5 py-2 rounded-2xl text-[14.5px] leading-relaxed',
        isOwn
          ? 'bg-gradient-to-r from-[#7c5cfc] to-[#6944e0] text-white rounded-tr-md'
          : 'bg-[#1e1e2e] text-[#e0e0ea] rounded-tl-md',
      )}>
        {msg.text}
      </div>
      {/* Reactions */}
      {msg.reactions && msg.reactions.length > 0 && (
        <div className={cn('flex gap-1 mt-1', isOwn && 'justify-end')}>
          {msg.reactions.map((r, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.06] text-xs cursor-pointer transition-colors"
            >
              <span>{r.emoji}</span>
              <span className="text-[#8e8ea0]">{r.count}</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  </motion.div>
);

/* ─── Typing Indicator ─── */
const TypingIndicator: React.FC<{ user: UserData }> = ({ user }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    className="flex items-center gap-3 px-4 py-1"
  >
    <Avatar user={user} size="sm" showStatus={false} />
    <div className="bg-[#1e1e2e] px-4 py-2.5 rounded-2xl rounded-tl-md flex items-center gap-1">
      <span className="typing-dot w-2 h-2 rounded-full bg-[#8e8ea0]" />
      <span className="typing-dot w-2 h-2 rounded-full bg-[#8e8ea0]" />
      <span className="typing-dot w-2 h-2 rounded-full bg-[#8e8ea0]" />
    </div>
    <span className="text-xs text-[#55556a]">{user.name} is typing...</span>
  </motion.div>
);

/* ─── Member Item ─── */
const MemberItem: React.FC<{ user: UserData }> = ({ user }) => (
  <motion.div
    whileHover={{ x: 3, backgroundColor: 'rgba(255,255,255,0.04)' }}
    className="flex items-center gap-3 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
  >
    <Avatar user={user} size="md" />
    <div className="min-w-0 flex-1">
      <p className={cn('text-sm font-medium truncate', user.status === 'offline' ? 'text-[#55556a]' : 'text-[#e0e0ea]')}>{user.name}</p>
      <p className="text-[11px] text-[#55556a] truncate">{user.activity}</p>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
export default function App() {
  const [serverId, setServerId] = useState('s1');
  const [channelId, setChannelId] = useState('c4');
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [membersOpen, setMembersOpen] = useState(true);
  const [mobileDrawer, setMobileDrawer] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [currentInvite, setCurrentInvite] = useState<InviteData | null>(null);
  const [copied, setCopied] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const server = servers.find(s => s.id === serverId)!;
  const allChannels = server.categories.flatMap(c => c.channels);
  const channel = allChannels.find(c => c.id === channelId) ?? allChannels[0];

  // Load messages on channel change
  useEffect(() => {
    setMessages(getMessages(channelId));
    setTyping(false);
  }, [channelId]);

  // When server changes, auto-select first text channel
  useEffect(() => {
    const srv = servers.find(s => s.id === serverId)!;
    const first = srv.categories.flatMap(c => c.channels).find(c => c.type === 'text');
    if (first) setChannelId(first.id);
  }, [serverId]);

  // Scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const newMsg: MessageData = { id: `msg-${Date.now()}`, userId: 'me', text, time };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    inputRef.current?.focus();

    // Auto-reply
    setTimeout(() => setTyping(true), 800);
    setTimeout(() => {
      setTyping(false);
      const replyUser = users[Math.floor(Math.random() * 5)];
      const replyText = autoReplies[Math.floor(Math.random() * autoReplies.length)];
      const replyTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      setMessages(prev => [...prev, { id: `reply-${Date.now()}`, userId: replyUser.id, text: replyText, time: replyTime }]);
    }, 1800 + Math.random() * 1200);
  }, [input]);

  const onlineMembers = users.filter(u => u.status !== 'offline');
  const offlineMembers = users.filter(u => u.status === 'offline');

  const myUser: UserData = { id: 'me', name: 'You', initials: 'ME', status: 'online', activity: 'Online', color: 'from-violet-500 to-fuchsia-500' };

  // Handle invite link on page load
  useEffect(() => {
    const inviteCode = parseInviteFromUrl();
    if (inviteCode) {
      const result = joinServerViaInvite(inviteCode);
      if (result.success && result.serverId) {
        setJoinSuccess(`Successfully joined ${result.serverId}!`);
        // Clear the URL
        window.history.replaceState(null, '', '/');
        setTimeout(() => setJoinSuccess(null), 5000);
      } else {
        setJoinError(result.error || 'Failed to join');
        setTimeout(() => setJoinError(null), 5000);
      }
    }
  }, []);

  // Generate or get existing invite for current server
  const handleGenerateInvite = useCallback(() => {
    const existingInvites = getInvitesForServer(serverId);
    if (existingInvites.length > 0) {
      setCurrentInvite(existingInvites[0]);
    } else {
      const newInvite = createInvite({
        serverId,
        serverName: server.name,
        channelId,
        channelName: channel.name,
        createdBy: 'me',
      });
      setCurrentInvite(newInvite);
    }
    setInviteModalOpen(true);
    setCopied(false);
  }, [serverId, server.name, channelId, channel.name]);

  // Copy invite link to clipboard
  const handleCopyInvite = useCallback(() => {
    if (currentInvite) {
      const url = createInviteUrl(currentInvite.code);
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [currentInvite]);

  // Delete current invite and generate new one
  const handleRegenerateInvite = useCallback(() => {
    if (currentInvite) {
      deleteInvite(currentInvite.code);
    }
    const newInvite = createInvite({
      serverId,
      serverName: server.name,
      channelId,
      channelName: channel.name,
      createdBy: 'me',
    });
    setCurrentInvite(newInvite);
    setCopied(false);
  }, [serverId, server.name, channelId, channel.name, currentInvite]);

  return (
    <div className="h-full flex bg-[#0b0b10]">

      {/* ── SERVER BAR ── */}
      <aside className="hidden md:flex w-[72px] flex-col items-center py-3 bg-[#0b0b10] flex-shrink-0 overflow-y-auto gap-0.5">
        {/* Home / DM */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7c5cfc] to-[#e84393] flex items-center justify-center mb-1 cursor-pointer"
        >
          <MessageSquare className="w-6 h-6 text-white" />
        </motion.button>
        <div className="w-8 h-0.5 bg-white/10 rounded-full my-1" />
        {servers.map(s => (
          <ServerBtn key={s.id} server={s} active={serverId === s.id} onClick={() => setServerId(s.id)} />
        ))}
        <div className="w-8 h-0.5 bg-white/10 rounded-full my-1" />
        <motion.button
          whileHover={{ scale: 1.1, borderRadius: '1rem' }}
          whileTap={{ scale: 0.92 }}
          className="w-12 h-12 rounded-full bg-[#232333] text-emerald-400 hover:bg-emerald-500 hover:text-white flex items-center justify-center cursor-pointer transition-colors duration-300"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </aside>

      {/* ── CHANNEL SIDEBAR ── */}
      <aside className="hidden md:flex w-60 flex-col bg-[#111118] flex-shrink-0 border-r border-white/[0.04]">
        {/* Server name */}
        <button className="h-12 flex items-center justify-between px-4 border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors cursor-pointer flex-shrink-0">
          <span className="font-bold text-[15px] text-white truncate">{server.name}</span>
          <ChevronDown className="w-4 h-4 text-[#8e8ea0]" />
        </button>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {server.categories.map(cat => (
            <Category
              key={cat.name}
              name={cat.name}
              channels={cat.channels}
              activeChannel={channelId}
              onSelect={setChannelId}
            />
          ))}
        </div>

        {/* User panel */}
        <div className="p-2 bg-[#0b0b10] border-t border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2 p-1.5 rounded-md">
            <Avatar user={myUser} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">CurrentUser</p>
              <p className="text-[11px] text-emerald-400">#0001</p>
            </div>
            <div className="flex items-center gap-0.5">
              <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => setMuted(!muted)} className="p-1.5 rounded hover:bg-white/10 cursor-pointer transition-colors">
                {muted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-[#8e8ea0]" />}
              </motion.button>
              <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => setDeafened(!deafened)} className="p-1.5 rounded hover:bg-white/10 cursor-pointer transition-colors">
                <Headphones className={cn('w-4 h-4', deafened ? 'text-red-400' : 'text-[#8e8ea0]')} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} className="p-1.5 rounded hover:bg-white/10 cursor-pointer transition-colors">
                <Settings className="w-4 h-4 text-[#8e8ea0]" />
              </motion.button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Chat header */}
        <header className="h-12 flex items-center justify-between px-4 border-b border-white/[0.06] bg-[#111118]/80 backdrop-blur-sm flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            {/* Mobile menu */}
            <button onClick={() => setMobileDrawer(true)} className="md:hidden p-1.5 rounded hover:bg-white/10 cursor-pointer mr-1">
              <Menu className="w-5 h-5 text-[#8e8ea0]" />
            </button>
            <Hash className="w-5 h-5 text-[#55556a]" />
            <span className="font-bold text-white text-[15px]">{channel.name}</span>
            {channel.description && (
              <>
                <span className="hidden sm:block w-px h-5 bg-white/10 mx-2" />
                <span className="hidden sm:block text-xs text-[#55556a] truncate max-w-[200px]">{channel.description}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <motion.button whileHover={{ scale: 1.1 }} className="hidden sm:flex p-1.5 rounded hover:bg-white/10 cursor-pointer"><Phone className="w-[18px] h-[18px] text-[#8e8ea0]" /></motion.button>
            <motion.button whileHover={{ scale: 1.1 }} className="hidden sm:flex p-1.5 rounded hover:bg-white/10 cursor-pointer"><Video className="w-[18px] h-[18px] text-[#8e8ea0]" /></motion.button>
            <motion.button whileHover={{ scale: 1.1 }} className="hidden sm:flex p-1.5 rounded hover:bg-white/10 cursor-pointer"><Pin className="w-[18px] h-[18px] text-[#8e8ea0]" /></motion.button>
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => setMembersOpen(!membersOpen)} className="p-1.5 rounded hover:bg-white/10 cursor-pointer">
              <Users className={cn('w-[18px] h-[18px]', membersOpen ? 'text-white' : 'text-[#8e8ea0]')} />
            </motion.button>
            <div className="hidden lg:flex items-center ml-1 bg-[#0b0b10] rounded-md px-2 py-1">
              <Search className="w-4 h-4 text-[#55556a]" />
              <input placeholder="Search" className="bg-transparent text-xs text-white placeholder-[#55556a] w-28 ml-1.5 outline-none" />
            </div>
            <motion.button whileHover={{ scale: 1.1 }} className="p-1.5 rounded hover:bg-white/10 cursor-pointer relative">
              <Bell className="w-[18px] h-[18px] text-[#8e8ea0]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={handleGenerateInvite}
              className="p-1.5 rounded hover:bg-white/10 cursor-pointer"
              title="Create invite link"
            >
              <LinkIcon className="w-[18px] h-[18px] text-[#8e8ea0]" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => window.open('https://wa.me/923289505157', '_blank')}
              className="p-1.5 rounded hover:bg-white/10 cursor-pointer"
              title="Contact on WhatsApp"
            >
              <Phone className="w-[18px] h-[18px] text-green-400" />
            </motion.button>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Messages */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto">
              {/* Welcome banner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 pt-8 pb-4 border-b border-white/[0.04] mb-2"
              >
                <div className="w-[68px] h-[68px] rounded-full bg-gradient-to-br from-[#7c5cfc] to-[#e84393] flex items-center justify-center mb-4">
                  <Hash className="w-9 h-9 text-white" />
                </div>
                <h2 className="text-[28px] font-bold text-white mb-1">Welcome to #{channel.name}!</h2>
                <p className="text-[#55556a] text-sm">
                  {channel.description || `This is the start of the #${channel.name} channel.`}
                </p>
              </motion.div>

              {/* Messages */}
              <div className="py-2">
                {messages.map((msg, i) => {
                  const user = msg.userId === 'me' ? myUser : users.find(u => u.id === msg.userId) || users[0];
                  return (
                    <MessageRow
                      key={msg.id}
                      msg={msg}
                      user={user}
                      isOwn={msg.userId === 'me'}
                      delay={Math.min(i * 0.04, 0.3)}
                    />
                  );
                })}
                <AnimatePresence>
                  {typing && <TypingIndicator user={users[Math.floor(Math.random() * 5)]} />}
                </AnimatePresence>
                <div ref={endRef} className="h-1" />
              </div>
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-1 flex-shrink-0">
              <div className="flex items-end bg-[#1a1a25] rounded-xl border border-white/[0.06] focus-within:border-[#7c5cfc]/40 transition-colors">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-3 text-[#55556a] hover:text-[#8e8ea0] cursor-pointer flex-shrink-0">
                  <Plus className="w-5 h-5" />
                </motion.button>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                  placeholder={`Message #${channel.name}`}
                  rows={1}
                  className="flex-1 bg-transparent text-white placeholder-[#55556a] py-3 text-sm resize-none outline-none max-h-32 leading-relaxed"
                />
                <div className="flex items-center gap-0.5 pr-2 flex-shrink-0">
                  <motion.button whileHover={{ scale: 1.1 }} className="hidden sm:flex p-2 text-[#55556a] hover:text-[#8e8ea0] cursor-pointer"><Gift className="w-5 h-5" /></motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} className="hidden sm:flex p-2 text-[#55556a] hover:text-[#8e8ea0] cursor-pointer"><ImagePlus className="w-5 h-5" /></motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} className="p-2 text-[#55556a] hover:text-[#8e8ea0] cursor-pointer"><Smile className="w-5 h-5" /></motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={sendMessage}
                    className={cn(
                      'p-2 rounded-lg transition-all cursor-pointer ml-0.5',
                      input.trim()
                        ? 'bg-gradient-to-r from-[#7c5cfc] to-[#6944e0] text-white shadow-lg shadow-[#7c5cfc]/20'
                        : 'text-[#55556a]',
                    )}
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* ── MEMBERS SIDEBAR ── */}
          <AnimatePresence>
            {membersOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="hidden lg:flex flex-col bg-[#111118] border-l border-white/[0.04] flex-shrink-0 overflow-hidden"
              >
                <div className="w-60 flex flex-col h-full">
                  {/* Search */}
                  <div className="px-3 pt-4 pb-2 flex-shrink-0">
                    <div className="flex items-center gap-2 bg-[#0b0b10] rounded-md px-2.5 py-1.5">
                      <Search className="w-4 h-4 text-[#55556a]" />
                      <input placeholder="Find members" className="bg-transparent text-xs text-white placeholder-[#55556a] w-full outline-none" />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-2 py-2">
                    {/* Online */}
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#55556a] px-2 mb-1">
                      Online — {onlineMembers.length}
                    </p>
                    {onlineMembers.map(u => <MemberItem key={u.id} user={u} />)}

                    {/* Offline */}
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#55556a] px-2 mb-1 mt-4">
                      Offline — {offlineMembers.length}
                    </p>
                    {offlineMembers.map(u => <MemberItem key={u.id} user={u} />)}
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {mobileDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawer(false)}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed left-0 top-0 bottom-0 w-[300px] bg-[#111118] z-50 md:hidden flex"
            >
              {/* Mini server bar */}
              <div className="w-16 bg-[#0b0b10] flex flex-col items-center py-3 gap-1 overflow-y-auto flex-shrink-0">
                <motion.button whileTap={{ scale: 0.9 }} className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7c5cfc] to-[#e84393] flex items-center justify-center mb-1">
                  <MessageSquare className="w-5 h-5 text-white" />
                </motion.button>
                <div className="w-7 h-0.5 bg-white/10 rounded-full my-0.5" />
                {servers.map(s => (
                  <motion.button
                    key={s.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setServerId(s.id)}
                    className={cn(
                      'w-11 h-11 flex items-center justify-center text-lg transition-all duration-200',
                      serverId === s.id ? 'rounded-2xl bg-gradient-to-br ' + s.color : 'rounded-full bg-[#232333]',
                    )}
                  >
                    {s.emoji}
                  </motion.button>
                ))}
              </div>

              {/* Channels */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="h-12 flex items-center justify-between px-3 border-b border-white/[0.06] flex-shrink-0">
                  <span className="font-bold text-white truncate">{server.name}</span>
                  <button onClick={() => setMobileDrawer(false)} className="p-1.5 rounded hover:bg-white/10 cursor-pointer">
                    <X className="w-5 h-5 text-[#8e8ea0]" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
                  {server.categories.map(cat => (
                    <Category
                      key={cat.name}
                      name={cat.name}
                      channels={cat.channels}
                      activeChannel={channelId}
                      onSelect={id => { setChannelId(id); setMobileDrawer(false); }}
                    />
                  ))}
                </div>
                {/* Members quick view */}
                <div className="px-2 py-2 border-t border-white/[0.06]">
                  <p className="text-[11px] font-semibold uppercase text-[#55556a] px-2 mb-1">Online — {onlineMembers.length}</p>
                  {onlineMembers.slice(0, 4).map(u => (
                    <div key={u.id} className="flex items-center gap-2 px-2 py-1">
                      <Avatar user={u} size="sm" />
                      <span className="text-xs text-[#8e8ea0] truncate">{u.name}</span>
                    </div>
                  ))}
                </div>
                {/* User panel */}
                <div className="p-2 bg-[#0b0b10] border-t border-white/[0.06] flex-shrink-0">
                  <div className="flex items-center gap-2 p-1.5">
                    <Avatar user={myUser} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">CurrentUser</p>
                      <p className="text-[11px] text-emerald-400">Online</p>
                    </div>
                    <Settings className="w-4 h-4 text-[#55556a]" />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── INVITE MODAL ── */}
      <AnimatePresence>
        {inviteModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInviteModalOpen(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md"
            >
              <div className="bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div>
                    <h3 className="text-lg font-bold text-white">Create Invite</h3>
                    <p className="text-xs text-[#55556a] mt-0.5">Invite friends to join {server.name}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setInviteModalOpen(false)}
                    className="p-1 rounded hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-5 h-5 text-[#8e8ea0]" />
                  </motion.button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  {currentInvite ? (
                    <>
                      {/* Invite Link Display */}
                      <div className="bg-[#0b0b10] rounded-lg p-3 border border-white/5">
                        <p className="text-xs text-[#55556a] mb-2">Invite Link</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm text-white font-mono bg-white/5 px-3 py-2 rounded truncate">
                            {createInviteUrl(currentInvite.code)}
                          </code>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCopyInvite}
                            className={cn(
                              'px-3 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-all',
                              copied
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-gradient-to-r from-[#7c5cfc] to-[#6944e0] text-white'
                            )}
                          >
                            {copied ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span className="text-sm">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span className="text-sm">Copy</span>
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>

                      {/* Invite Details */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#0b0b10] rounded-lg p-3 border border-white/5">
                          <p className="text-xs text-[#55556a]">Server</p>
                          <p className="text-sm text-white font-medium mt-0.5">{currentInvite.serverName}</p>
                        </div>
                        <div className="bg-[#0b0b10] rounded-lg p-3 border border-white/5">
                          <p className="text-xs text-[#55556a]">Channel</p>
                          <p className="text-sm text-white font-medium mt-0.5">#{currentInvite.channelName || 'general'}</p>
                        </div>
                        <div className="bg-[#0b0b10] rounded-lg p-3 border border-white/5">
                          <p className="text-xs text-[#55556a]">Invite Code</p>
                          <p className="text-sm text-white font-mono mt-0.5">{currentInvite.code}</p>
                        </div>
                        <div className="bg-[#0b0b10] rounded-lg p-3 border border-white/5">
                          <p className="text-xs text-[#55556a]">Uses</p>
                          <p className="text-sm text-white font-medium mt-0.5">{currentInvite.uses} / ∞</p>
                        </div>
                      </div>

                      {/* Regenerate Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleRegenerateInvite}
                        className="w-full py-2.5 rounded-lg border border-white/10 text-sm text-[#8e8ea0] hover:text-white hover:bg-white/5 cursor-pointer transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Generate New Link
                      </motion.button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-[#55556a]">Generating invite...</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── JOIN SUCCESS NOTIFICATION ── */}
      <AnimatePresence>
        {joinSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-4 left-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3"
          >
            <Check className="w-5 h-5" />
            <span className="font-medium">{joinSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── JOIN ERROR NOTIFICATION ── */}
      <AnimatePresence>
        {joinError && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-4 left-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3"
          >
            <X className="w-5 h-5" />
            <span className="font-medium">{joinError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
