import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  User, 
  Anchor, 
  Paperclip, 
  Users, 
  Compass, 
  Search,
  Sparkles
} from 'lucide-react';
import { Message, Voyage, UserRole } from '@/types';

interface MessagesViewProps {
  messages: Message[];
  voyages: Voyage[];
  onSendMessage: (voyageId: string, content: string) => void;
  userRole: UserRole;
  userName: string;
}

export default function MessagesView({ 
  messages, 
  voyages, 
  onSendMessage, 
  userRole, 
  userName 
}: MessagesViewProps) {
  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [typedMessage, setTypedMessage] = useState('');
  const [searchChannel, setSearchChannel] = useState('');
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannelId]);

  const activeMessages = messages.filter(m => m.voyageId === activeChannelId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;
    onSendMessage(activeChannelId, typedMessage);
    setTypedMessage('');
  };

  const channels = [
    { id: 'general', name: '⚓ Port General Advisory', desc: 'Central logistics agency broadcast channel' },
    ...voyages.map(v => ({
      id: v.id,
      name: `🚢 ${v.vesselName} (${v.voyageNumber})`,
      desc: `${v.originPort} to ${v.destinationPort}`
    }))
  ];

  const filteredChannels = channels.filter(ch => 
    ch.name.toLowerCase().includes(searchChannel.toLowerCase()) ||
    ch.desc.toLowerCase().includes(searchChannel.toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex h-[calc(100vh-140px)]">
      
      {/* Channels List */}
      <div className="w-80 border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
              <MessageSquare className="h-4.5 w-4.5 text-[#6C4CE1]" />
              <span>Logistics Channels</span>
            </h4>
            <span className="bg-[#6C4CE1]/10 text-[#6C4CE1] text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border border-[#6C4CE1]/20">
              {channels.length}
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchChannel}
              onChange={(e) => setSearchChannel(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredChannels.map((channel) => {
            const isSelected = channel.id === activeChannelId;
            return (
              <button
                key={channel.id}
                onClick={() => setActiveChannelId(channel.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col space-y-1 cursor-pointer ${
                  isSelected 
                    ? 'bg-[#6C4CE1] border-[#6C4CE1] text-white shadow-md' 
                    : 'bg-transparent border-transparent hover:bg-slate-100 text-slate-700 hover:text-slate-950'
                }`}
              >
                <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                  {channel.name}
                </span>
                <span className={`text-[10px] truncate leading-tight ${isSelected ? 'text-[#F4F7F9]' : 'text-slate-400'}`}>
                  {channel.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* active Message Viewport */}
      <div className="flex-1 flex flex-col justify-between bg-slate-50/40">
        
        {/* Channel Header */}
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div>
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              {channels.find(c => c.id === activeChannelId)?.name.substring(2)}
            </h5>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {channels.find(c => c.id === activeChannelId)?.desc}
            </p>
          </div>
          <div className="flex items-center space-x-1 text-slate-400 text-xs font-mono">
            <Users className="h-4 w-4 text-slate-300" />
            <span className="text-[10px]">All Port Crew Active</span>
          </div>
        </div>

        {/* Message Feeds */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          <div className="text-center py-4 text-[11px] text-slate-400 font-mono border-b border-dashed border-slate-200">
            ⚓ BEGINNING OF SECURE MARITIME CHAT ENCRYPTED DATASTREAM
          </div>

          {activeMessages.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs">
              No correspondence logged. Initiate coordination message by typing below.
            </div>
          ) : (
            activeMessages.map((msg) => {
              const isMe = msg.senderName === userName || msg.senderId === '11111111-1111-1111-1111-111111111111' && userRole === 'PORT_AGENT' || msg.senderId === '22222222-2222-2222-2222-222222222222' && userRole === 'SHIP_AGENT' || msg.senderId === '33333333-3333-3333-3333-333333333333' && userRole === 'PROTECTIVE_AGENT';
              
              const roleColors: Record<UserRole, string> = {
                PORT_AGENT: 'bg-[#6C4CE1]/10 text-[#2D1B69] border border-[#6C4CE1]/20',
                SHIP_AGENT: 'bg-[#6C4CE1]/10 text-[#2D1B69]',
                PROTECTIVE_AGENT: 'bg-purple-100 text-purple-800',
                ADMIN: 'bg-slate-200 text-slate-800'
              };

              return (
                <div key={msg.id} className={`flex flex-col space-y-1.5 max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                  
                  {/* metadata bubble info */}
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                    <span className="font-bold text-slate-700">{msg.senderName}</span>
                    <span className={`px-1 rounded-sm text-[8px] font-bold font-mono uppercase ${roleColors[msg.senderRole]}`}>
                      {msg.senderRole.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-[9px]">{msg.timestamp.split('T')[1] || msg.timestamp}</span>
                  </div>

                  {/* message body */}
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    isMe 
                      ? 'bg-[#6C4CE1] text-white rounded-tr-sm shadow-md' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Message Dispatcher Form */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
          <input
            type="text"
            value={typedMessage}
            onChange={(e) => setTypedMessage(e.target.value)}
            placeholder={`Type dispatch message as ${userName}...`}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-[#6C4CE1] focus:outline-none bg-white text-xs"
          />
          <button
            type="submit"
            className="bg-[#6C4CE1] hover:bg-[#6C4CE1]/90 text-white p-2.5 rounded-xl transition-colors flex items-center justify-center shrink-0 cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

      </div>

    </div>
  );
}
