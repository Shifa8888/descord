export type Status = 'online' | 'idle' | 'dnd' | 'offline';

export interface UserData {
  id: string;
  name: string;
  initials: string;
  status: Status;
  activity?: string;
  color: string;
}

export interface MessageData {
  id: string;
  userId: string;
  text: string;
  time: string;
  reactions?: { emoji: string; count: number }[];
}

export interface ChannelData {
  id: string;
  name: string;
  type: 'text' | 'voice';
  unread?: number;
  description?: string;
}

export interface ServerData {
  id: string;
  name: string;
  emoji: string;
  color: string;
  categories: {
    name: string;
    channels: ChannelData[];
  }[];
}

export const users: UserData[] = [
  { id: 'u1', name: 'Alex Chen', initials: 'AC', status: 'online', activity: 'Playing Valorant', color: 'from-violet-500 to-purple-600' },
  { id: 'u2', name: 'Sarah Kim', initials: 'SK', status: 'online', activity: 'Listening to Spotify', color: 'from-pink-500 to-rose-600' },
  { id: 'u3', name: 'Marcus Lee', initials: 'ML', status: 'idle', activity: 'Away', color: 'from-amber-500 to-orange-600' },
  { id: 'u4', name: 'Emma Davis', initials: 'ED', status: 'dnd', activity: 'In a meeting', color: 'from-red-500 to-pink-600' },
  { id: 'u5', name: 'Jake Wilson', initials: 'JW', status: 'online', activity: 'Visual Studio Code', color: 'from-blue-500 to-indigo-600' },
  { id: 'u6', name: 'Mia Zhang', initials: 'MZ', status: 'offline', activity: 'Last seen 3h ago', color: 'from-teal-500 to-emerald-600' },
  { id: 'u7', name: 'Noah Brown', initials: 'NB', status: 'online', activity: 'Watching YouTube', color: 'from-cyan-500 to-blue-600' },
  { id: 'u8', name: 'Lily Park', initials: 'LP', status: 'offline', activity: 'Last seen 1d ago', color: 'from-fuchsia-500 to-purple-600' },
  { id: 'u9', name: 'Ryan Torres', initials: 'RT', status: 'idle', activity: 'Be right back', color: 'from-lime-500 to-green-600' },
];

export const servers: ServerData[] = [
  {
    id: 's1',
    name: 'Gaming Hub',
    emoji: '🎮',
    color: 'from-violet-500 to-purple-600',
    categories: [
      {
        name: 'Information',
        channels: [
          { id: 'c1', name: 'welcome', type: 'text', description: 'Say hello to everyone!' },
          { id: 'c2', name: 'rules', type: 'text', description: 'Server rules & guidelines' },
          { id: 'c3', name: 'announcements', type: 'text', unread: 2, description: 'Important updates' },
        ]
      },
      {
        name: 'General',
        channels: [
          { id: 'c4', name: 'general', type: 'text', unread: 5, description: 'Talk about anything' },
          { id: 'c5', name: 'memes', type: 'text', description: 'Share funny content' },
          { id: 'c6', name: 'off-topic', type: 'text', description: 'Random conversations' },
        ]
      },
      {
        name: 'Voice',
        channels: [
          { id: 'c7', name: 'Lounge', type: 'voice' },
          { id: 'c8', name: 'Gaming', type: 'voice' },
        ]
      }
    ]
  },
  {
    id: 's2',
    name: 'Dev Community',
    emoji: '💻',
    color: 'from-blue-500 to-cyan-600',
    categories: [
      {
        name: 'Development',
        channels: [
          { id: 'c9', name: 'javascript', type: 'text', unread: 8, description: 'JS discussions' },
          { id: 'c10', name: 'react', type: 'text', unread: 3, description: 'React & Next.js' },
          { id: 'c11', name: 'python', type: 'text', description: 'Python talk' },
          { id: 'c12', name: 'code-review', type: 'text', description: 'Get feedback on your code' },
        ]
      },
      {
        name: 'Community',
        channels: [
          { id: 'c13', name: 'showcase', type: 'text', description: 'Show off your projects' },
          { id: 'c14', name: 'help', type: 'text', unread: 1, description: 'Ask for help' },
        ]
      }
    ]
  },
  {
    id: 's3',
    name: 'Music Lounge',
    emoji: '🎵',
    color: 'from-pink-500 to-rose-600',
    categories: [
      {
        name: 'Chat',
        channels: [
          { id: 'c15', name: 'recommendations', type: 'text', description: 'Share music recs' },
          { id: 'c16', name: 'playlists', type: 'text', description: 'Curated playlists' },
        ]
      },
      {
        name: 'Listen Together',
        channels: [
          { id: 'c17', name: 'Music Room', type: 'voice' },
          { id: 'c18', name: 'DJ Booth', type: 'voice' },
        ]
      }
    ]
  },
  {
    id: 's4',
    name: 'Art Studio',
    emoji: '🎨',
    color: 'from-emerald-500 to-teal-600',
    categories: [
      {
        name: 'Gallery',
        channels: [
          { id: 'c19', name: 'digital-art', type: 'text', description: 'Digital artwork' },
          { id: 'c20', name: 'feedback', type: 'text', unread: 4, description: 'Constructive feedback' },
          { id: 'c21', name: 'resources', type: 'text', description: 'Tools & tutorials' },
        ]
      }
    ]
  },
];

export const messagesByChannel: Record<string, MessageData[]> = {
  c4: [
    { id: 'm1', userId: 'u1', text: 'Hey everyone! Just finished a crazy ranked session 🔥', time: '2:15 PM' },
    { id: 'm2', userId: 'u2', text: 'Nice! What rank did you hit?', time: '2:16 PM' },
    { id: 'm3', userId: 'u1', text: 'Finally made it to Diamond! Took me 200 hours lol', time: '2:17 PM', reactions: [{ emoji: '🎉', count: 4 }, { emoji: '🔥', count: 2 }] },
    { id: 'm4', userId: 'u5', text: 'Congrats man! That\'s insane. I\'m still hardstuck Plat 😭', time: '2:18 PM' },
    { id: 'm5', userId: 'u7', text: 'Anyone wanna queue up tonight? I\'ll be on around 9', time: '2:20 PM' },
    { id: 'm6', userId: 'u3', text: 'I\'m down! Just let me finish dinner first', time: '2:22 PM' },
    { id: 'm7', userId: 'u2', text: 'Count me in too! We need a 5 stack 🎮', time: '2:23 PM', reactions: [{ emoji: '👍', count: 3 }] },
    { id: 'm8', userId: 'u1', text: 'Perfect, I\'ll set up the lobby. Drop your usernames if you\'re new', time: '2:25 PM' },
  ],
  c9: [
    { id: 'm9', userId: 'u5', text: 'Has anyone tried the new Bun 2.0 release? The performance improvements are wild', time: '11:30 AM' },
    { id: 'm10', userId: 'u1', text: 'Yeah! The bundler is like 3x faster now. Thinking of migrating our project', time: '11:32 AM', reactions: [{ emoji: '🚀', count: 5 }] },
    { id: 'm11', userId: 'u7', text: 'I switched from webpack to Bun last week. Build times went from 45s to 8s 🤯', time: '11:35 AM' },
    { id: 'm12', userId: 'u2', text: 'That\'s amazing. Does it handle CSS modules well?', time: '11:37 AM' },
    { id: 'm13', userId: 'u5', text: 'Yep, works out of the box. Here\'s the migration guide I followed...', time: '11:40 AM' },
  ],
  c1: [
    { id: 'm14', userId: 'u1', text: 'Welcome to Gaming Hub! 👋 Make sure to check out #rules before posting.', time: '9:00 AM' },
    { id: 'm15', userId: 'u9', text: 'Hey everyone! Just joined, excited to be here! 🎉', time: '10:15 AM', reactions: [{ emoji: '👋', count: 6 }] },
    { id: 'm16', userId: 'u2', text: 'Welcome @Ryan! Feel free to hop into any voice channel anytime', time: '10:18 AM' },
  ],
};

// Provide messages for any channel that doesn't have specific data
export function getMessages(channelId: string): MessageData[] {
  if (messagesByChannel[channelId]) return messagesByChannel[channelId];
  return [
    { id: `default-1-${channelId}`, userId: 'u1', text: 'Welcome to this channel! Start the conversation 💬', time: '12:00 PM' },
    { id: `default-2-${channelId}`, userId: 'u7', text: 'Hey! Looking forward to chatting here 🎉', time: '12:05 PM', reactions: [{ emoji: '👋', count: 2 }] },
  ];
}

export const autoReplies = [
  'That\'s awesome! 🔥',
  'I totally agree with you!',
  'Haha nice one 😂',
  'Let\'s gooo! 🚀',
  'Interesting take, tell me more',
  'Facts! 💯',
  'Couldn\'t have said it better myself',
  'Wait really?? That\'s crazy',
  'Lol same 😆',
  'Big W right there 🏆',
];
