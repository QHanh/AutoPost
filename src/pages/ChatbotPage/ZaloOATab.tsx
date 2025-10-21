import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Bot, RefreshCw, Users, User, XCircle, Send, Search, Image as ImageIcon } from 'lucide-react';
import {
  listOaAccounts,
  getOaLoginUrl,
  getOaRecentChatsOpenApi,
  getOaConversationOpenApi,
  refreshOaToken,
  sendOaTextMessage,
  deleteOaAccount,
  listBlockedUsers,
  createBlockedUser,
  deleteBlockedUser,
  uploadOaImage,
  sendOaImageMessage,
} from '../../services/zaloOAService';
import type { OaAccountItem, OaConversationItem, OaMessageItem } from '../../services/zaloOAService';

interface ZaloOATabProps {
  initialActiveTab?: 'connect' | 'inbox';
}

const ZaloOATab: React.FC<ZaloOATabProps> = ({ initialActiveTab = 'connect' }) => {
  const [active, setActive] = useState<'connect' | 'inbox'>(initialActiveTab);

  // Accounts
  const [accounts, setAccounts] = useState<OaAccountItem[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Conversations
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState<OaConversationItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  // Blocked users map: user_id -> blocked record id
  const [blockedMap, setBlockedMap] = useState<Record<string, string>>({});

  // Messages
  const [selectedConv, setSelectedConv] = useState<OaConversationItem | null>(null);
  const [messages, setMessages] = useState<OaMessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const errMsg = (err: unknown) => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    try { return JSON.stringify(err); } catch { return 'Unknown error'; }
  };

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const res = await listOaAccounts();
      const items = res.data || [];
      setAccounts(items);
      if (!selectedAccountId && items.length > 0) {
        setSelectedAccountId(items[0].id);
      }
    } catch (e) {
      console.error('Load OA accounts error:', e);
    } finally {
      setLoadingAccounts(false);
    }
  }, [selectedAccountId]);

  const loadConversations = useCallback(async (accountId?: string) => {
    const accId = accountId || selectedAccountId;
    if (!accId) return;
    setLoadingConversations(true);
    try {
      // Fetch recent chats from OpenAPI (max 10 per request). Apply client-side search.
      const res = await getOaRecentChatsOpenApi(accId, { offset: 0, count: 10 });
      let items = res.data || [];
      const q = (search || '').trim().toLowerCase();
      if (q) {
        items = items.filter(it =>
          (it.display_name || '').toLowerCase().includes(q) ||
          (it.conversation_id || '').toLowerCase().includes(q)
        );
      }
      setConversations(items);
    } catch (e) {
      console.error('Load OA conversations error:', e);
    } finally {
      setLoadingConversations(false);
    }
  }, [search, selectedAccountId]);

  const loadBlocked = useCallback(async (accountId?: string) => {
    const accId = accountId || selectedAccountId;
    if (!accId) return;
    try {
      const res = await listBlockedUsers(accId);
      const map: Record<string, string> = {};
      for (const it of res.data || []) {
        map[it.blocked_user_id] = it.id;
      }
      setBlockedMap(map);
    } catch (e) {
      console.error('Load blocked users error:', e);
    }
  }, [selectedAccountId]);

  const loadMessages = useCallback(async (conv: OaConversationItem) => {
    if (!selectedAccountId) return;
    setSelectedConv(conv);
    setLoadingMessages(true);
    try {
      // Use Zalo OA OpenAPI conversation endpoint (max 10 messages per request)
      const res = await getOaConversationOpenApi(selectedAccountId, conv.conversation_id, { offset: 0, count: 10 });
      setMessages(res.data || []);
      setTimeout(() => {
        const el = document.querySelector('.oa-messages-container') as HTMLElement | null;
        if (el) el.scrollTop = el.scrollHeight;
      }, 100);
    } catch (e) {
      console.error('Load OA messages error:', e);
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (active === 'inbox' && selectedAccountId) {
      loadConversations(selectedAccountId);
      loadBlocked(selectedAccountId);
    }
  }, [active, selectedAccountId, loadConversations, loadBlocked]);

  const handleConnect = async () => {
    try {
      const url = await getOaLoginUrl();
      // Open Zalo OAuth in a new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e: unknown) {
      alert(errMsg(e) || 'Không lấy được đường dẫn đăng nhập');
    }
  };

  const handleRefreshToken = async (accountId: string) => {
    try {
      await refreshOaToken(accountId);
    } catch (e: unknown) {
      alert(`Lỗi refresh token: ${errMsg(e)}`);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const ok = window.confirm('Bạn có chắc muốn xóa OA này? Hành động này không thể hoàn tác.');
      if (!ok) return;
      await deleteOaAccount(accountId);
      setAccounts(prev => prev.filter(a => a.id !== accountId));
      if (selectedAccountId === accountId) {
        setSelectedAccountId(null);
        setConversations([]);
        setSelectedConv(null);
        setMessages([]);
      }
    } catch (e: unknown) {
      alert(`Xóa OA thất bại: ${errMsg(e)}`);
    }
  };

  // removed ignore toggle per request

  const handleToggleBlocked = async (conv: OaConversationItem) => {
    if (!selectedAccountId) return;
    const userId = conv.conversation_id;
    const blockedId = blockedMap[userId];
    try {
      if (blockedId) {
        await deleteBlockedUser(blockedId);
        setBlockedMap(prev => {
          const cp = { ...prev };
          delete cp[userId];
          return cp;
        });
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, is_blocked: false } : c));
      } else {
        const resp = await createBlockedUser(selectedAccountId, userId);
        const newId = resp?.data?.id;
        setBlockedMap(prev => ({ ...prev, [userId]: newId || 'temp' }));
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, is_blocked: true } : c));
      }
    } catch (e: unknown) {
      alert(`Cập nhật chặn thất bại: ${errMsg(e)}`);
    }
  };

  const handleSend = async () => {
    if (!selectedAccountId || !selectedConv) return;
    const text = composeText.trim();
    if (!text) return;
    try {
      await sendOaTextMessage(selectedAccountId, selectedConv.conversation_id, text);
      setComposeText('');
      // reload messages
      await loadMessages(selectedConv);
    } catch (e: unknown) {
      alert(`Gửi thất bại: ${errMsg(e)}`);
    }
  };

  const handlePickImage = () => {
    if (!selectedConv) return;
    fileInputRef.current?.click();
  };

  const handleImageSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    if (!selectedAccountId || !selectedConv) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('Chỉ hỗ trợ JPG/PNG');
      return;
    }
    if (file.size > 1_000_000) {
      alert('Kích thước ảnh tối đa 1MB');
      return;
    }
    try {
      setUploadingImage(true);
      const up = await uploadOaImage(selectedAccountId, file);
      const attachment_id = up?.data?.attachment_id;
      if (!attachment_id) throw new Error('Không lấy được attachment_id');
      await sendOaImageMessage(selectedAccountId, selectedConv.conversation_id, attachment_id);
      await loadMessages(selectedConv);
    } catch (err: unknown) {
      alert(`Gửi ảnh thất bại: ${errMsg(err)}`);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm h-full">
      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        <button className={`px-3 py-1.5 rounded border text-sm ${active === 'connect' ? 'bg-gray-100 border-gray-300 font-semibold' : 'border-transparent hover:bg-gray-100'}`} onClick={() => setActive('connect')}>
          Kết nối OA
        </button>
        <button className={`px-3 py-1.5 rounded border text-sm ${active === 'inbox' ? 'bg-gray-100 border-gray-300 font-semibold' : 'border-transparent hover:bg-gray-100'}`} onClick={() => setActive('inbox')}>
          Inbox OA
        </button>
      </div>

      {active === 'connect' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700"><Bot size={18}/> Zalo OA</div>
            <button onClick={handleConnect} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Kết nối OA</button>
          </div>

          <div className="bg-gray-50 p-3 rounded border">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw size={16} className={loadingAccounts ? 'animate-spin' : ''} />
              <button onClick={loadAccounts} disabled={loadingAccounts} className="text-sm underline">Làm mới danh sách OA</button>
            </div>
            {accounts.length === 0 ? (
              <div className="text-gray-600">Chưa có OA nào được kết nối.</div>
            ) : (
              <div className="grid gap-2">
                {accounts.map(acc => (
                  <div key={acc.id} className={`p-3 rounded bg-white border flex items-center justify-between ${selectedAccountId === acc.id ? 'ring-2 ring-blue-300' : ''}`}>
                    <div className="flex items-center gap-3">
                      {acc.picture_url ? (
                        <img src={acc.picture_url} alt="oa" className="w-10 h-10 rounded" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-200" />
                      )}
                      <div>
                        <div className="font-semibold">{acc.name || acc.oa_id}</div>
                        <div className="text-xs text-gray-500">{acc.status} · {acc.connected_at || ''}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedAccountId(acc.id)} className="text-sm px-2 py-1 border rounded">Chọn</button>
                      <button onClick={() => handleRefreshToken(acc.id)} className="text-sm px-2 py-1 border rounded">Refresh token</button>
                      <button onClick={() => handleDeleteAccount(acc.id)} className="text-sm px-2 py-1 border rounded border-red-300 text-red-600 hover:bg-red-50">Xóa</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {active === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: conversations */}
          <div className="bg-white rounded border p-3">
            <div className="mb-2 flex items-center gap-2">
              <select value={selectedAccountId || ''} onChange={e => setSelectedAccountId(e.target.value)} className="border rounded px-2 py-1 text-sm flex-1">
                <option value="" disabled>Chọn OA</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name || a.oa_id}</option>)}
              </select>
              <button onClick={() => loadConversations()} className="px-2 py-1 border rounded text-sm"><RefreshCw size={14} className={loadingConversations ? 'animate-spin' : ''}/></button>
            </div>
            <div className="mb-2 relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadConversations()} placeholder="Tìm kiếm..." className="w-full pl-7 pr-2 py-1 border rounded text-sm"/>
            </div>
            <div className="max-h-[70vh] overflow-y-auto divide-y">
              {conversations.map(conv => (
                <div key={conv.id} onClick={() => loadMessages(conv)} className={`p-2 cursor-pointer hover:bg-gray-50 ${selectedConv?.id === conv.id ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-center gap-2">
                    {(conv.type === 'group') ? <Users size={14} className="text-gray-500"/> : <User size={14} className="text-gray-500"/>}
                    <div className="flex-1 truncate font-medium text-sm">{conv.display_name || conv.conversation_id}</div>
                    {((conv.is_ignored) || blockedMap[conv.conversation_id]) && (
                      <span title="Đã chặn/Bỏ qua">
                        <XCircle size={14} className="text-red-500" />
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex gap-2 text-xs text-gray-600">
                    <button onClick={(e) => { e.stopPropagation(); handleToggleBlocked(conv); }} className={`px-2 py-0.5 rounded border ${blockedMap[conv.conversation_id] ? 'bg-red-50 border-red-300 text-red-700' : ''}`}>{blockedMap[conv.conversation_id] ? 'Unblock' : 'Block'}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Middle: messages */}
          <div className="bg-white rounded border p-3 flex flex-col lg:col-span-2">
            <div className="font-semibold mb-2">{selectedConv ? (selectedConv.display_name || selectedConv.conversation_id) : 'Chọn cuộc trò chuyện'}</div>
            <div className="oa-messages-container flex-1 overflow-y-auto border rounded p-2 bg-gray-50">
              {loadingMessages && <div className="text-center text-sm text-gray-500">Đang tải...</div>}
              {!loadingMessages && messages.length === 0 && <div className="text-center text-sm text-gray-500">Chưa có tin nhắn</div>}
              <div className="space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-3 py-2 rounded ${m.direction === 'out' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
                      {m.attachments && m.attachments.type === 'photo' && (
                        <div className="mb-2">
                          <img
                            src={m.attachments.url || m.attachments.thumb || ''}
                            alt={m.attachments.description || 'photo'}
                            className="max-w-full rounded"
                          />
                          {m.attachments.description && (
                            <div className="text-xs mt-1 opacity-80">{m.attachments.description}</div>
                          )}
                        </div>
                      )}
                      {!!(m.text && m.text.trim()) && (
                        <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                      )}
                      <div className="text-[11px] opacity-70 mt-1">{m.timestamp ? new Date(m.timestamp).toLocaleString('vi-VN') : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input value={composeText} onChange={e => setComposeText(e.target.value)} placeholder="Nhập tin nhắn..." className="flex-1 border rounded px-3 py-2 text-sm"/>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleImageSelected} />
              <button onClick={handlePickImage} disabled={!selectedConv || uploadingImage} title="Gửi ảnh" className="px-3 py-2 border rounded inline-flex items-center gap-1 disabled:opacity-60">
                <ImageIcon size={16} />
              </button>
              <button onClick={handleSend} disabled={!selectedConv || !composeText.trim()} className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-60 inline-flex items-center gap-1"><Send size={16}/>Gửi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZaloOATab;
