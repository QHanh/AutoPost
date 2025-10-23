import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Smartphone, CheckCircle, XCircle, Clock, AlertCircle, Users, User, RefreshCw, MoreVertical, Plus, LogOut, Image } from 'lucide-react';
import { zaloLoginQRStream, getZaloStatus, getZaloConversations, getZaloMessages, QRResponse, ZaloConversation, ZaloMessage, createStaffZalo, listStaffZalo, deleteStaffZalo, updateStaffZalo, logoutZalo, sendZaloTextMessage, sendZaloImageFile, getZaloSessions, ZaloSessionInfo } from '../../services/zaloService';
import { listIgnoredZalo, upsertIgnoredZalo, deleteIgnoredZalo, IgnoredConversation } from '../../services/ignoredZaloService';
import { getMyBotConfig, upsertMyBotConfig, BotConfig } from '../../services/botConfigService';
import MessageActionDropdown from '../../components/MessageActionDropdown';
import { getAuthToken } from '../../services/apiService';

interface ZaloTabProps {
  currentPage?: number;
  currentLimit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  initialActiveTab?: 'login' | 'messages';
}


// WebSocket base URL (same as API base) and protocol resolver
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.161:8000';


const ZaloTab: React.FC<ZaloTabProps> = ({ initialActiveTab }) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [status, setStatus] = useState<string>('idle');
  const [message, setMessage] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(true);
  
  // New state for messages functionality
  const [conversations, setConversations] = useState<ZaloConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ZaloConversation | null>(null);
  const [messages, setMessages] = useState<ZaloMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  // Use initialActiveTab directly instead of state since parent controls the view
  const activeTab = initialActiveTab || 'login';
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [openConvMenu, setOpenConvMenu] = useState<string | null>(null);
  const [isCreatingStaff, setIsCreatingStaff] = useState<boolean>(false);
  const [subTab, setSubTab] = useState<'messages' | 'staff' | 'ignored'>('messages');
  const [isLoadingStaff, setIsLoadingStaff] = useState<boolean>(false);
  const [staffItems, setStaffItems] = useState<Array<{ id: string; zalo_uid: string; name: string; role: string; is_active: boolean; can_control_bot?: boolean; can_manage_orders?: boolean; can_receive_notifications?: boolean }>>([]);
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  const [savingStaffId, setSavingStaffId] = useState<string | null>(null);
  const [isLoadingIgnored, setIsLoadingIgnored] = useState<boolean>(false);
  const [ignoredItems, setIgnoredItems] = useState<IgnoredConversation[]>([]);
  const [isIgnoring, setIsIgnoring] = useState<boolean>(false);
  const [deletingIgnoredId, setDeletingIgnoredId] = useState<string | null>(null);
  // Multi-account support
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ZaloSessionInfo[]>([]);
  // Send message states
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [isSendingImage, setIsSendingImage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // WebSocket refs
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const selectedConvRef = useRef<ZaloConversation | null>(null);
  // Track recently sent items per thread to avoid duplicate self messages via WS
  const recentlySentRef = useRef<Record<string, { text?: string; kind?: 'text' | 'image'; time: number }[]>>({});
  
  // Bot config states
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null);
  const [isLoadingBotConfig, setIsLoadingBotConfig] = useState<boolean>(false);
  const [isSavingBotConfig, setIsSavingBotConfig] = useState<boolean>(false);
  const [stopMinutes, setStopMinutes] = useState<number>(0);

  const addStaffFromConversation = async (conv: ZaloConversation) => {
    try {
      // Chỉ hỗ trợ thêm nhân viên cho chat 1-1 (không phải nhóm)
      if (conv.type === 1 || conv.group_name) {
        alert('Chỉ thêm nhân viên cho chat 1-1, không hỗ trợ nhóm.');
        return;
      }
      const zalo_uid = conv.peer_id || conv.conversation_id;
      const name = conv.d_name || conv.conversation_id || 'Zalo User';
      if (!zalo_uid) {
        alert('Không xác định được Zalo UID của người dùng.');
        return;
      }
      setIsCreatingStaff(true);
      await createStaffZalo({ zalo_uid, name, role: 'staff', permissions: { can_control_bot: true }, owner_account_id: selectedAccountId || undefined });
      alert(`Đã thêm ${name} làm nhân viên thành công`);
      setOpenConvMenu(null);
    } catch (e: any) {
      alert(`người này đã là nhân viên hoặc xảy ra lỗi hệ thống`);
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const loadSessions = async () => {
    try {
      const resp = await getZaloSessions();
      const items = Array.isArray(resp.items) ? resp.items : [];
      setSessions(items);
      // Auto-pick selection if none selected or selected not found
      if (!selectedAccountId || !items.find((s) => String(s.account_id || '') === String(selectedAccountId))) {
        const first = items.find((s) => !!s.account_id)?.account_id || null;
        setSelectedAccountId(first ? String(first) : null);
      }
    } catch (e) {
      // ignore UI-blocking
    }
  };

  const handleSendImageFile = async (fileOverride?: File) => {
    if (!selectedConversation) return;
    const threadId = (selectedConversation as any).thread_id;
    if (!threadId) {
      alert('Không xác định được thread_id cho cuộc trò chuyện này, không thể gửi ảnh.');
      return;
    }
    const fileToSend = fileOverride || newImageFile;
    if (!fileToSend) return;
    try {
      setIsSendingImage(true);
      // Record recently sent image for dedupe window BEFORE awaiting send
      {
        const tid = String(threadId);
        const now = Date.now();
        const windowMs = 4000;
        const arr = (recentlySentRef.current[tid] || []).filter((it) => now - it.time <= windowMs);
        arr.push({ kind: 'image', time: now });
        recentlySentRef.current[tid] = arr;
      }
      await sendZaloImageFile(String(threadId), fileToSend, undefined, selectedAccountId || undefined);
      const href = URL.createObjectURL(fileToSend);
      const optimistic: any = {
        id: `${Date.now()}-imgf-local`,
        is_self: true,
        ts: Date.now(),
        content: { type: 'photo', href },
      };
      setMessages((prev) => {
        const next = [...prev, optimistic as ZaloMessage];
        setTimeout(() => {
          const el = document.querySelector('.messages-container') as HTMLElement | null;
          if (el) el.scrollTop = el.scrollHeight;
        }, 50);
        return next;
      });
      setConversations((prev) => prev.map((c) => {
        const t = (c as any).thread_id;
        if (t && String(t) === String(threadId)) {
          return { ...c, last_content: '[đã gửi ảnh]', last_ts: Date.now() } as any;
        }
        return c;
      }));
      setNewImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      alert(err?.message || 'Gửi ảnh thất bại');
    } finally {
      setIsSendingImage(false);
    }
  };

  // Keep a ref of currently selected conversation for WS event handler
  useEffect(() => {
    selectedConvRef.current = selectedConversation;
  }, [selectedConversation]);

  const loadIgnored = async () => {
    setIsLoadingIgnored(true);
    try {
      const resp = await listIgnoredZalo({ limit: 200, offset: 0, account_id: selectedAccountId || undefined });
      const items = (resp.data || resp.items || []) as IgnoredConversation[];
      setIgnoredItems(items);
    } catch (e) {
      console.error('Error loading ignored conversations:', e);
    } finally {
      setIsLoadingIgnored(false);
    }
  };

  const loadBotConfig = async () => {
    setIsLoadingBotConfig(true);
    try {
      const resp = await getMyBotConfig(selectedAccountId || undefined);
      const config = resp.data;
      if (config) {
        setBotConfig(config);
        setStopMinutes(config.stop_minutes || 10);
      }
    } catch (e: any) {
      // Nếu không tìm thấy config, tạo mặc định
      if (e.message?.includes('404') || e.message?.includes('Không tìm thấy')) {
        setStopMinutes(10);
        setBotConfig(null);
      } else {
        console.error('Error loading bot config:', e);
      }
    } finally {
      setIsLoadingBotConfig(false);
    }
  };

  const saveBotConfig = async () => {
    setIsSavingBotConfig(true);
    try {
      const resp = await upsertMyBotConfig({ stop_minutes: stopMinutes }, selectedAccountId || undefined);
      setBotConfig(resp.data || null);
      alert('Đã lưu cấu hình bot thành công!');
    } catch (e: any) {
      alert(`Lỗi khi lưu cấu hình bot: ${e?.message || e}`);
    } finally {
      setIsSavingBotConfig(false);
    }
  };

  const togglePermission = async (
    id: string,
    field: 'can_control_bot' | 'can_manage_orders' | 'can_receive_notifications',
    checked: boolean
  ) => {
    const prev = staffItems;
    // Optimistic update
    const next = staffItems.map((s) => (s.id === id ? { ...s, [field]: checked } : s));
    setStaffItems(next);
    setSavingStaffId(id);
    try {
      await updateStaffZalo(id, { [field]: checked } as any);
    } catch (e: any) {
      // Revert
      setStaffItems(prev);
      alert(`Cập nhật quyền thất bại: ${e?.message || e}`);
    } finally {
      setSavingStaffId(null);
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!id) return;
    if (!confirm(`Xóa nhân viên "${name}"?`)) return;
    setDeletingStaffId(id);
    try {
      await deleteStaffZalo(id);
      // Refresh list
      await loadStaff();
    } catch (e: any) {
      alert(`Lỗi khi xóa nhân viên: ${e?.message || e}`);
    } finally {
      setDeletingStaffId(null);
    }
  };

  const loadStaff = async () => {
    setIsLoadingStaff(true);
    try {
      const resp = await listStaffZalo({ includeInactive: true, limit: 100, offset: 0, accountId: selectedAccountId || undefined });
      const items = (resp.items || resp.data || []) as any[];
      setStaffItems(items.map((it) => ({
        id: it.id,
        zalo_uid: it.zalo_uid,
        name: it.name,
        role: it.role,
        is_active: it.is_active !== false,
        can_control_bot: it.can_control_bot,
        can_manage_orders: it.can_manage_orders,
        can_receive_notifications: (it.can_receive_notifications ?? it.permissions?.can_receive_notifications),
      })));
    } catch (e) {
      console.error('Error loading staff:', e);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  // Utility: stable color for a given sender name
  const senderColorClasses = [
    'text-rose-700',
    'text-emerald-700',
    'text-indigo-700',
    'text-amber-700',
    'text-fuchsia-700',
    'text-cyan-700',
    'text-lime-700',
    'text-sky-700',
  ];

  const getColorClassForName = (name?: string) => {
    if (!name) return 'text-green-700';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    const idx = Math.abs(hash) % senderColorClasses.length;
    return senderColorClasses[idx];
  };

  // Date helpers: support ISO string or ms (number/string)
  const parseToDate = (v?: number | string): Date | null => {
    if (v === undefined || v === null) return null;
    if (typeof v === 'number') {
      return new Date(v);
    }
    // string: could be ISO or millis as string
    if (/^\d+$/.test(v)) {
      const ms = parseInt(v, 10);
      if (!isNaN(ms)) return new Date(ms);
    }
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDateTime = (v?: number | string): string => {
    const d = parseToDate(v);
    return d ? d.toLocaleString('vi-VN') : '';
  };

  const formatTime = (v?: number | string, fallbackIso?: string): string => {
    const d = parseToDate(v);
    if (d) return d.toLocaleTimeString('vi-VN');
    if (fallbackIso) {
      const d2 = parseToDate(fallbackIso);
      if (d2) return d2.toLocaleTimeString('vi-VN');
    }
    return '';
  };

  // Quote helpers: normalize various formats to human-readable
  const normalizeQuote = (q: any): { text?: string; author?: string; ts?: number | string } => {
    if (!q) return {};
    let obj: any = q;
    if (typeof q === 'string') {
      try {
        const parsed = JSON.parse(q);
        obj = parsed;
      } catch {
        // plain string, treat as the text
        return { text: q };
      }
    }
    if (obj && typeof obj === 'object') {
      const text = typeof obj.msg === 'string' ? obj.msg : undefined;
      const author = typeof obj.fromD === 'string' ? obj.fromD : undefined;
      const ts = obj.ts as number | string | undefined;
      if (text || author || ts) return { text, author, ts };
    }
    return { text: (typeof q === 'string' ? q : undefined) };
  };

  // Content helpers: detect structured content like photo payloads
  type NormalizedContent =
    | { kind: 'text'; text: string }
    | { kind: 'photo'; href?: string; thumb?: string; width?: number | null; height?: number | null; title?: string; description?: string };

  const normalizeContent = (c: unknown): NormalizedContent => {
    // default to text
    if (c === null || c === undefined) return { kind: 'text', text: '' };
    if (typeof c === 'string') {
      // Try to parse JSON that might be a structured content (e.g., photo)
      if (c.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(c);
          if (parsed && parsed.type === 'photo') {
            return {
              kind: 'photo',
              href: parsed.href,
              thumb: parsed.thumb,
              width: parsed.width ?? (parsed.params ? JSON.parse(parsed.params || '{}').width : undefined),
              height: parsed.height ?? (parsed.params ? JSON.parse(parsed.params || '{}').height : undefined),
              title: parsed.title,
              description: parsed.description,
            };
          }
        } catch {
          // fall through to text
        }
      }
      return { kind: 'text', text: c };
    }
    if (typeof c === 'object') {
      const obj: any = c;
      // listener may send object for photos
      if (obj.type === 'photo' || obj.msgType === 'chat.photo') {
        // params may be JSON string
        let width: number | null = null;
        let height: number | null = null;
        try {
          const params = typeof obj.params === 'string' ? JSON.parse(obj.params) : obj.params;
          if (params) {
            width = params.width ?? null;
            height = params.height ?? null;
          }
        } catch {}
        return {
          kind: 'photo',
          href: obj.href,
          thumb: obj.thumb || obj.href,
          width,
          height,
          title: obj.title,
          description: obj.description,
        };
      }
    }
    // Anything else becomes text
    return { kind: 'text', text: String(c) };
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'QRCodeGenerated':
        return <QrCode className="text-blue-500" size={20} />;
      case 'QRCodeScanned':
        return <Smartphone className="text-yellow-500" size={20} />;
      case 'GotLoginInfo':
      case 'SessionSaved':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'QRCodeExpired':
      case 'QRCodeDeclined':
      case 'SessionSaveError':
        return <XCircle className="text-red-500" size={20} />;
      case 'connecting':
        return <Clock className="text-blue-500 animate-spin" size={20} />;
      default:
        return <AlertCircle className="text-gray-500" size={20} />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'QRCodeGenerated':
        return 'Mã QR đã được tạo. Vui lòng quét bằng ứng dụng Zalo.';
      case 'QRCodeScanned':
        return 'Mã QR đã được quét. Vui lòng xác nhận trên điện thoại.';
      case 'GotLoginInfo':
        return 'Đã nhận thông tin đăng nhập. Đang lưu phiên...';
      case 'SessionSaved':
        return 'Đăng nhập thành công! Phiên đã được lưu.';
      case 'QRCodeExpired':
        return 'Mã QR đã hết hạn. Vui lòng tạo mã mới.';
      case 'QRCodeDeclined':
        return 'Đăng nhập bị từ chối. Vui lòng thử lại.';
      case 'SessionSaveError':
        return `Lỗi khi lưu phiên: ${message}`;
      case 'connecting':
        return 'Đang kết nối...';
      case 'idle':
        return 'Nhấn "Tạo mã QR" để bắt đầu đăng nhập Zalo.';
      default:
        return message || 'Trạng thái không xác định.';
    }
  };

  const handleSSEMessage = (data: QRResponse) => {
    setStatus(data.type);
    
    switch (data.type) {
      case 'QRCodeGenerated':
        if (data.data?.image) {
          setQrCode(`data:image/png;base64,${data.data.image}`);
        }
        break;
      case 'SessionSaved':
        setMessage(`UID: ${data.uid}, Session Key: ${data.session_key}`);
        setTimeout(() => {
          setIsConnecting(false);
        }, 3000);
        break;
      case 'SessionSaveError':
        {
          const errMsg = (data.error || '').toLowerCase();
          // Some zca-js internal errors like 'checkUpdate' during getOwnId are benign for our UX.
          const benign = errMsg.includes('checkupdate') || errMsg.includes('logincookie');
          if (benign) {
            setStatus('SessionSaved');
            setMessage('Đăng nhập thành công! (Có cảnh báo nội bộ, bỏ qua)');
            setTimeout(() => {
              setIsConnecting(false);
            }, 3000);
          } else {
            setMessage(data.error || 'Lỗi không xác định');
            setTimeout(() => {
              setIsConnecting(false);
            }, 3000);
          }
          break;
        }
      case 'QRCodeExpired':
      case 'QRCodeDeclined':
        setTimeout(() => {
          setIsConnecting(false);
        }, 3000);
        break;
    }
  };

  const connectToZalo = async () => {
    if (eventSource) {
      eventSource.close();
    }

    setIsConnecting(true);
    setStatus('connecting');
    setQrCode('');
    setMessage('');

    try {
      await zaloLoginQRStream(
        handleSSEMessage,
        (error: Error) => {
          console.error('Error connecting to Zalo:', error);
          setStatus('error');
          setMessage(error.message || 'Lỗi kết nối');
          setIsConnecting(false);
        },
        () => {
          // Stream completed
          console.log('Zalo stream completed');
        }
      );
    } catch (error: any) {
      console.error('Error connecting to Zalo:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Lỗi kết nối');
      setIsConnecting(false);
    }
  };

  const disconnectFromZalo = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    setIsConnecting(false);
    setStatus('idle');
    setQrCode('');
    setMessage('');
  };

  // Đăng xuất khỏi Zalo (qua backend)
  const handleLogout = async () => {
    try {
      await logoutZalo();
      // Reset UI state
      setStatus('idle');
      setQrCode('');
      setMessage('Đã đăng xuất khỏi Zalo');
      setConversations([]);
      setSelectedConversation(null);
      setMessages([]);
    } catch (e: any) {
      alert(`Đăng xuất thất bại: ${e?.message || e}`);
    }
  };

  // Load conversations when user is logged in
  const loadConversations = async () => {
    if (status !== 'SessionSaved') return;
    
    setIsLoadingConversations(true);
    try {
      const data = await getZaloConversations(selectedAccountId || undefined);
      setConversations(data.items || []);
      // Auto-pick first available account if none selected yet
      try {
        if (!selectedAccountId) {
          const firstOwner = (data.items || []).map((it: any) => it?.owner_account_id).filter(Boolean)[0] || null;
          if (firstOwner) setSelectedAccountId(String(firstOwner));
        }
      } catch {}
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Load messages for selected conversation
  const loadMessages = async (conversation: ZaloConversation) => {
    setIsLoadingMessages(true);
    setSelectedConversation(conversation);
    
    try {
      const data = await getZaloMessages(
        conversation.thread_id,
        conversation.peer_id,
        50,
        'asc',
        selectedAccountId || undefined,
      );
      setMessages(data.items || []);
      // Auto-scroll to bottom after messages load
      setTimeout(() => {
        const messagesContainer = document.querySelector('.messages-container');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConversation) return;
    const threadId = (selectedConversation as any).thread_id;
    const text = (newMessageText || '').trim();
    if (!threadId) {
      alert('Không xác định được thread_id cho cuộc trò chuyện này, không thể gửi tin.');
      return;
    }
    if (!text) return;
    try {
      setIsSendingMessage(true);
      // Record recently sent text for dedupe window (e.g., 4s) BEFORE awaiting send
      {
        const tid = String(threadId);
        const now = Date.now();
        const windowMs = 4000;
        const arr = (recentlySentRef.current[tid] || []).filter((it) => now - it.time <= windowMs);
        arr.push({ text, time: now });
        recentlySentRef.current[tid] = arr;
      }
      await sendZaloTextMessage(String(threadId), text, selectedAccountId || undefined);
      // Optimistic append to current messages
      const optimistic: ZaloMessage = {
        id: `${Date.now()}-local`,
        content: text,
        is_self: true,
        ts: Date.now(),
      } as any;
      setMessages((prev) => {
        const next = [...prev, optimistic];
        // Auto scroll to bottom
        setTimeout(() => {
          const el = document.querySelector('.messages-container') as HTMLElement | null;
          if (el) el.scrollTop = el.scrollHeight;
        }, 50);
        return next;
      });
      // Update conversation preview
      setConversations((prev) => prev.map((c) => {
        const t = (c as any).thread_id;
        if (t && String(t) === String(threadId)) {
          return { ...c, last_content: text, last_ts: Date.now() } as any;
        }
        return c;
      }));
      setNewMessageText('');
    } catch (err: any) {
      alert(err?.message || 'Gửi tin nhắn thất bại');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Kiểm tra trạng thái phiên Zalo khi mở tab
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const status = await getZaloStatus();
        if (!mounted) return;
        if (status?.ok && (status.exists === true || status.exists === 'true')) {
          setStatus('SessionSaved');
          setMessage(`Đã kết nối. UID: ${status.account_id || 'N/A'}`);
        } else {
          setStatus('idle');
        }
      } catch (e) {
        // Không chặn UI khi lỗi kiểm tra trạng thái
        setStatus('idle');
      } finally {
        if (mounted) setIsCheckingStatus(false);
      }
    })();
    return () => {
      mounted = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  // Load conversations when status changes to SessionSaved
  useEffect(() => {
    if (status === 'SessionSaved') {
      // Auto-load conversations when logged in; if user is on Messages tab, refresh
      loadConversations();
      loadSessions();
      // Also load ignored list to reflect block/unblock state in menus
      loadIgnored();
      // If user is on Messages tab, list will be shown automatically
    }
  }, [status]);

  // Reload data when switching accounts
  useEffect(() => {
    if (status === 'SessionSaved') {
      loadConversations();
      loadIgnored();
      loadBotConfig();
      if (subTab === 'staff') {
        loadStaff();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId]);

  // Open WebSocket when logged in and keep it alive
  useEffect(() => {
    if (status !== 'SessionSaved') {
      // Close any previous WS when logged out or not ready
      try { wsRef.current?.close(); } catch {}
      wsRef.current = null;
      if (pingIntervalRef.current) {
        try { window.clearInterval(pingIntervalRef.current); } catch {}
        pingIntervalRef.current = null;
      }
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    // Build WS URL from API_BASE_URL
    const host = API_BASE_URL.replace(/^https?:\/\//, '');
    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${host}/api/v1/ws?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // periodic ping to keep alive through proxies
      if (pingIntervalRef.current) {
        try { window.clearInterval(pingIntervalRef.current); } catch {}
      }
      pingIntervalRef.current = window.setInterval(() => {
        try { ws.send(JSON.stringify({ type: 'ping' })); } catch {}
      }, 25000);
    };

    ws.onmessage = (event) => {
      const raw = String(event.data ?? '');
      let payload: any = null;
      try { payload = JSON.parse(raw); } catch { payload = null; }
      if (!payload || typeof payload !== 'object') return;

      if (payload.type === 'zalo_message' && payload.data) {
        const d = payload.data as any;

        // Update conversation preview
        setConversations((prev) => prev.map((c) => {
          const t = (c as any).thread_id;
          if (t && d.thread_id && String(t) === String(d.thread_id)) {
            return { ...c, last_content: d.content, last_ts: d.ts } as any;
          }
          return c;
        }));

        // Append message if viewing the same conversation
        const current = selectedConvRef.current as any;
        if (current && current.thread_id && d.thread_id && String(current.thread_id) === String(d.thread_id)) {
          // Dedupe: if this is a self message and matches a recently sent text, skip appending
          const tid = String(d.thread_id);
          const now = Date.now();
          const windowMs = 4000;
          const arr = (recentlySentRef.current[tid] || []).filter((it) => now - it.time <= windowMs);
          recentlySentRef.current[tid] = arr;
          const isSelfOut = !!d.is_self || String(d.direction || '').toLowerCase() === 'out';
          if (isSelfOut) {
            // If the incoming content is a photo, dedupe against recent image sends
            const normalized = normalizeContent(d.content);
            if (normalized && (normalized as any).kind === 'photo') {
              const idxImg = arr.findIndex((it) => it.kind === 'image');
              if (idxImg >= 0) {
                arr.splice(idxImg, 1);
                recentlySentRef.current[tid] = arr;
                return;
              }
            }
            const idx = arr.findIndex((it) => String(it.text || '').trim() === String(d.content || '').trim());
            if (idx >= 0) {
              // Consume this recent entry to avoid future duplicates and skip append
              arr.splice(idx, 1);
              recentlySentRef.current[tid] = arr;
              return;
            }
          }
          const newMsg: any = {
            id: d.msg_id || `${Date.now()}-${Math.random()}`,
            is_self: !!d.is_self,
            d_name: d.d_name,
            content: d.content,
            ts: d.ts,
          };
          setMessages((prev) => {
            const next = [...prev, newMsg as ZaloMessage];
            // Auto scroll to bottom
            setTimeout(() => {
              const el = document.querySelector('.messages-container') as HTMLElement | null;
              if (el) el.scrollTop = el.scrollHeight;
            }, 50);
            return next;
          });
        }
      }
    };

    ws.onerror = () => {
      // no-op; rely on onclose for cleanup
    };

    ws.onclose = () => {
      if (pingIntervalRef.current) {
        try { window.clearInterval(pingIntervalRef.current); } catch {}
        pingIntervalRef.current = null;
      }
      wsRef.current = null;
      // Optionally implement reconnection after short delay while still logged in
      // Keep it simple for now; next WS will open when user reloads or navigates.
    };

    return () => {
      try { ws.close(); } catch {}
      if (pingIntervalRef.current) {
        try { window.clearInterval(pingIntervalRef.current); } catch {}
        pingIntervalRef.current = null;
      }
      wsRef.current = null;
    };
  }, [status]);

  // When switching to Messages tab and already logged in, load conversations
  useEffect(() => {
    if (activeTab === 'messages' && status === 'SessionSaved') {
      loadConversations();
    }
  }, [activeTab]);

  // Load staff when switching to staff sub-tab
  useEffect(() => {
    if (status === 'SessionSaved' && subTab === 'staff') {
      loadStaff();
    }
  }, [subTab, status]);

  // Load ignored when switching to ignored sub-tab
  useEffect(() => {
    if (status === 'SessionSaved' && subTab === 'ignored') {
      loadIgnored();
    }
  }, [subTab, status]);

  // Load bot config when switching to staff sub-tab
  useEffect(() => {
    if (status === 'SessionSaved' && subTab === 'staff') {
      loadBotConfig();
    }
  }, [subTab, status]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openConvMenu && !(event.target as Element)?.closest('.conversation-menu')) {
        setOpenConvMenu(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openConvMenu]);

  // Determine if current conversation is a group
  const isGroupConversation = !!(selectedConversation && (selectedConversation.type === 1 || selectedConversation.group_name));

  const handleRefresh = async () => {
    await loadConversations();
    if (selectedConversation) {
      await loadMessages(selectedConversation);
    }
    await loadIgnored();
  };

  const addIgnoredFromConversation = async (conv: ZaloConversation) => {
    try {
      // Hỗ trợ cả 1-1 và nhóm
      const thread_id = (conv as any).thread_id;
      if (!thread_id) {
        alert('Không xác định được thread_id để chặn.');
        return;
      }
      setIsIgnoring(true);
      if (!selectedAccountId) { alert('Vui lòng chọn tài khoản để chặn hội thoại.'); return; }
      await upsertIgnoredZalo({ thread_id, name: (conv as any).d_name || undefined, account_id: selectedAccountId });
      setOpenConvMenu(null);
      await loadIgnored();
      alert('Đã thêm vào danh sách không trả lời.');
    } catch (e: any) {
      alert(`Lỗi: ${e?.message || e}`);
    } finally {
      setIsIgnoring(false);
    }
  };

  const unignoreFromConversation = async (conv: ZaloConversation) => {
    try {
      const thread_id = (conv as any).thread_id;
      if (!thread_id) {
        alert('Không xác định được thread_id để gỡ chặn.');
        return;
      }
      const it = ignoredItems.find((x) => x.thread_id === thread_id);
      if (!it) {
        alert('Cuộc trò chuyện này chưa bị chặn.');
        return;
      }
      setDeletingIgnoredId(it.id);
      await deleteIgnoredZalo(it.id);
      await loadIgnored();
      setOpenConvMenu(null);
      alert('Đã bỏ chặn.');
    } catch (e: any) {
      alert(`Lỗi khi bỏ chặn: ${e?.message || e}`);
    } finally {
      setDeletingIgnoredId(null);
    }
  };

  const handleDeleteIgnored = async (id: string) => {
    if (!confirm('Gỡ bỏ khỏi danh sách không trả lời?')) return;
    setDeletingIgnoredId(id);
    try {
      await deleteIgnoredZalo(id);
      await loadIgnored();
    } catch (e: any) {
      alert(`Lỗi khi xóa: ${e?.message || e}`);
    } finally {
      setDeletingIgnoredId(null);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm h-full">

      {activeTab === 'login' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Section */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
              {qrCode ? (
                <div className="space-y-4">
                  <img 
                    src={qrCode} 
                    alt="Zalo QR Code" 
                    className="mx-auto max-w-full h-auto border rounded-lg shadow-sm"
                  />
                  <p className="text-sm text-gray-600">
                    Quét mã QR bằng ứng dụng Zalo trên điện thoại
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <QrCode size={64} className="text-gray-400 mx-auto" />
                  <p className="text-gray-500">
                    Mã QR sẽ hiển thị ở đây
                  </p>
                </div>
              )}
              </div>

            <div className="flex gap-3">
              <button
                onClick={connectToZalo}
                disabled={isConnecting || isCheckingStatus}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {isCheckingStatus ? 'Đang kiểm tra trạng thái...' : (isConnecting ? 'Đang kết nối...' : 'Tạo mã QR')}
              </button>
              
              {isConnecting && (
                <button
                  onClick={disconnectFromZalo}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
              )}
            </div>
          </div>

          {/* Status Section */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Trạng thái kết nối</h3>
              
              <div className="flex items-center space-x-3 mb-3">
                {getStatusIcon()}
                <span className="font-medium text-gray-700 capitalize">
                  {status === 'idle' ? 'Chưa kết nối' : status}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 leading-relaxed">
                {getStatusMessage()}
              </p>
              
              {message && status !== 'SessionSaveError' && (
                <div className="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                  <p className="text-sm text-blue-700">{message}</p>
                </div>
              )}

              {status === 'SessionSaved' && (
                <div className="mt-4">
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <LogOut size={16} /> Đăng xuất Zalo
                  </button>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Hướng dẫn:</h4>
              <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                <li>Nhấn "Tạo mã QR" để bắt đầu</li>
                <li>Mở ứng dụng Zalo trên điện thoại</li>
                <li>Quét mã QR hiển thị trên màn hình</li>
                <li>Xác nhận đăng nhập trên điện thoại</li>
                <li>Chờ hệ thống lưu thông tin phiên</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        status !== 'SessionSaved' ? (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            Vui lòng đăng nhập Zalo trước để xem tin nhắn.
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4">
            {/* Sub-tabs */}
            <div className="mb-4 flex gap-2">
              <button
                className={`px-3 py-1.5 rounded border text-sm ${subTab === 'messages' ? 'bg-white border-gray-300 font-semibold' : 'border-transparent hover:bg-gray-100'}`}
                onClick={() => setSubTab('messages')}
              >Tin nhắn</button>
              <button
                className={`px-3 py-1.5 rounded border text-sm ${subTab === 'staff' ? 'bg-white border-gray-300 font-semibold' : 'border-transparent hover:bg-gray-100'}`}
                onClick={() => setSubTab('staff')}
              >Quản lý nhân viên</button>
              <button
                className={`px-3 py-1.5 rounded border text-sm ${subTab === 'ignored' ? 'bg-white border-gray-300 font-semibold' : 'border-transparent hover:bg-gray-100'}`}
                onClick={() => setSubTab('ignored')}
              >quản lý chatbot cho zalo</button>
            </div>

            {subTab === 'messages' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Account Manager */}
              <div className="lg:col-span-3">
                <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-white border rounded">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">Tài khoản:</label>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={selectedAccountId || ''}
                      onChange={(e) => setSelectedAccountId(e.target.value ? e.target.value : null)}
                    >
                      <option value="">Tất cả</option>
                      {sessions.map((s) => (
                        <option key={s.id} value={s.account_id || ''}>
                          {s.display_name || s.account_id || '(chưa có tên)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={connectToZalo}
                      className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                    >
                      Thêm tài khoản
                    </button>
                    <button
                      onClick={async () => {
                        if (!selectedAccountId) { alert('Chọn tài khoản để đăng xuất.'); return; }
                        try {
                          await logoutZalo(selectedAccountId);
                          await loadSessions();
                          await loadConversations();
                          await loadIgnored();
                        } catch (e: any) {
                          alert(e?.message || 'Đăng xuất tài khoản thất bại');
                        }
                      }}
                      className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50"
                      disabled={!selectedAccountId}
                    >
                      Đăng xuất tài khoản này
                    </button>
                  </div>
                </div>
              </div>
              {/* Conversations List */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800">Cuộc trò chuyện</h4>
                    <button
                      onClick={handleRefresh}
                      disabled={isLoadingConversations || isLoadingMessages}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                      title="Làm mới"
                    >
                      <RefreshCw size={16} className={(isLoadingConversations || isLoadingMessages) ? 'animate-spin' : ''} />
                      Làm mới
                    </button>
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto">
                    {isLoadingConversations ? (
                      <div className="p-4 text-center text-gray-500">
                        <Clock className="animate-spin mx-auto mb-2" size={20} />
                        Đang tải...
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Không có cuộc trò chuyện nào
                      </div>
                    ) : (
                      conversations.map((conv) => (
                        <div
                          key={conv.conversation_id}
                          onClick={() => loadMessages(conv)}
                          className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors relative ${
                            selectedConversation?.conversation_id === conv.conversation_id ? 'bg-blue-50 border-r-4 border-r-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1 pr-8">
                            {(conv.type === 1 || conv.group_name) ? <Users size={16} className="text-gray-500" /> : <User size={16} className="text-gray-500" />}
                            <span
                              className={`font-semibold text-sm truncate ${
                                (conv.type === 1 || conv.group_name) ? 'text-indigo-700' : 'text-teal-700'
                              }`}
                            >
                              {(conv.type === 1 || conv.group_name)
                                ? (conv.group_name || conv.conversation_id || 'Không có tên')
                                : (conv.d_name || conv.conversation_id || 'Không có tên')}
                            </span>
                            {ignoredItems.some(it => it.thread_id === (conv as any).thread_id) && <span title="Đã chặn"><XCircle size={14} className="text-red-500" /></span>}
                          </div>
                          {/* Three-dot menu for actions (always visible) */}
                          <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="p-1 rounded hover:bg-gray-100"
                              title="Thao tác"
                              onClick={() => setOpenConvMenu(openConvMenu === conv.conversation_id ? null : conv.conversation_id)}
                            >
                              <MoreVertical size={16} />
                            </button>
                            {openConvMenu === conv.conversation_id && (
                              <div className="conversation-menu mt-1 w-56 bg-white border border-gray-200 rounded shadow-md absolute right-0 z-10">
                                {/* Only for 1-1 chats: add as staff */}
                                {!(conv.type === 1 || conv.group_name) && (
                                  <button
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-60"
                                    onClick={() => addStaffFromConversation(conv)}
                                    disabled={isCreatingStaff}
                                  >
                                    <Plus size={14} /> Thêm làm nhân viên
                                  </button>
                                )}
                                {(() => {
                                  const t = (conv as any).thread_id;
                                  const isIgnored = !!t && ignoredItems.some((it) => it.thread_id === t);
                                  if (isIgnored) {
                                    return (
                                      <button
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-60"
                                        onClick={() => unignoreFromConversation(conv)}
                                        disabled={deletingIgnoredId !== null}
                                      >
                                        <XCircle size={14} /> Bỏ chặn
                                      </button>
                                    );
                                  }
                                  return (
                                    <button
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-60"
                                      onClick={() => addIgnoredFromConversation(conv)}
                                      disabled={isIgnoring}
                                    >
                                      <XCircle size={14} /> {(conv.type === 1 || conv.group_name) ? 'Không trả lời nhóm này' : 'Không trả lời người này'}
                                    </button>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {(() => {
                              if (!conv.last_content) return 'Không có tin nhắn';
                              const nc = normalizeContent(conv.last_content);
                              if (nc.kind === 'photo') return '[Ảnh]';
                              return nc.text;
                            })()}
                          </p>
                          {(conv.last_created_at || conv.last_ts) && (
                            <p className="text-xs text-gray-400 mt-1">
                              {conv.last_created_at ? formatDateTime(conv.last_created_at) : formatDateTime(conv.last_ts)}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Messages Display */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-800">
                      {selectedConversation
                        ? ((selectedConversation.type === 1 || selectedConversation.group_name)
                            ? (selectedConversation.group_name || selectedConversation.conversation_id)
                            : (selectedConversation.d_name || selectedConversation.conversation_id))
                        : 'Chọn cuộc trò chuyện'}
                    </h4>
                  </div>
                  <div className="messages-container h-[70vh] overflow-y-auto p-4 bg-gray-50">
                  {!selectedConversation ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Chọn một cuộc trò chuyện để xem tin nhắn
                    </div>
                  ) : isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <Clock className="animate-spin mr-2" size={20} />
                      Đang tải tin nhắn...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Không có tin nhắn nào trong cuộc trò chuyện này
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg, index) => (
                        <div
                          key={msg.id || index}
                          className={`flex items-start space-x-2 ${msg.is_self ? 'flex-row-reverse space-x-reverse' : ''}`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.is_self 
                              ? 'bg-blue-500 text-white rounded-br-sm' 
                              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                          }`}>
                            {!msg.is_self && isGroupConversation && msg.d_name && (
                              <div className={`text-xs font-semibold mb-1 ${getColorClassForName(msg.d_name)}`}>
                                {msg.d_name}
                              </div>
                            )}
                            {msg.quote && (() => {
                              const q = normalizeQuote(msg.quote);
                              return (
                                <div className={`text-xs mb-2 p-2 rounded ${
                                  msg.is_self ? 'bg-blue-400 bg-opacity-50' : 'bg-gray-100'
                                }`}>
                                  <div className="flex items-start gap-1">
                                    <span>↳</span>
                                    <div className="min-w-0">
                                      {q.author && (
                                        <div className="font-semibold text-gray-700 truncate">{q.author}</div>
                                      )}
                                      {q.text && (
                                        <div className="text-gray-700 whitespace-pre-wrap break-words">{q.text}</div>
                                      )}
                                      {!q.text && (typeof msg.quote === 'string') && (
                                        <div className="text-gray-700 whitespace-pre-wrap break-words">{msg.quote}</div>
                                      )}
                                      {!q.text && typeof msg.quote !== 'string' && (
                                        <div className="text-gray-500 italic">(trích dẫn)</div>
                                      )}
                                      {q.ts && (
                                        <div className="text-[10px] text-gray-500 mt-1">{formatTime(q.ts)}</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                            {(() => {
                              const nc = normalizeContent(msg.content);
                              if (nc.kind === 'photo') {
                                const src = nc.thumb || nc.href;
                                return (
                                  <div className="space-y-1">
                                    {src && (
                                      <a href={nc.href} target="_blank" rel="noopener noreferrer" className="inline-block">
                                        <img
                                          src={src}
                                          alt={nc.title || 'Ảnh'}
                                          className="rounded-md border border-gray-200 max-w-full h-auto"
                                          style={{ maxHeight: '40vh' }}
                                        />
                                      </a>
                                    )}
                                    {nc.description && (
                                      <div className="text-xs text-gray-600">{nc.description}</div>
                                    )}
                                  </div>
                                );
                              }
                              return (
                                <div className="text-sm">
                                  {nc.text}
                                </div>
                              );
                            })()}
                            <div className={`text-xs mt-1 ${msg.is_self ? 'text-blue-100' : 'text-gray-500'}`}>
                              {!msg.is_self && !isGroupConversation && msg.d_name && `${msg.d_name} • `}
                              {formatTime(msg.ts, msg.created_at)}
                            </div>
                          </div>
                          {!msg.is_self && msg.content && (
                            <MessageActionDropdown
                              messageText={typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                              isVisible={activeDropdown === index}
                              onToggle={() => setActiveDropdown(activeDropdown === index ? null : index)}
                              onClose={() => setActiveDropdown(null)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                  {selectedConversation && (
                    <>
                      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 flex gap-2 items-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.currentTarget.files && e.currentTarget.files[0] ? e.currentTarget.files[0] : null;
                            if (f) {
                              setNewImageFile(f);
                              handleSendImageFile(f);
                            }
                            // reset to allow re-select same file
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                          disabled={isSendingImage}
                          title={isSendingImage ? 'Đang gửi ảnh...' : 'Chọn ảnh từ máy'}
                        >
                          <Image size={18} className="text-gray-600" />
                        </button>
                        <input
                          type="text"
                          placeholder="Nhập tin nhắn..."
                          value={newMessageText}
                          onChange={(e) => setNewMessageText(e.currentTarget.value)}
                          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
                          disabled={isSendingMessage}
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-60"
                          disabled={isSendingMessage || !newMessageText.trim()}
                          title={isSendingMessage ? 'Đang gửi...' : 'Gửi'}
                        >{isSendingMessage ? 'Đang gửi...' : 'Gửi'}</button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
  {subTab === 'ignored' && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">quản lý chatbot cho zalo</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={loadBotConfig}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                      disabled={isLoadingBotConfig}
                    >
                      <RefreshCw size={16} className={isLoadingBotConfig ? 'animate-spin' : ''} />
                      Tải cấu hình
                    </button>
                    <button
                      onClick={loadIgnored}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                      disabled={isLoadingIgnored}
                    >
                      <RefreshCw size={16} className={isLoadingIgnored ? 'animate-spin' : ''} />
                      Làm mới danh sách
                    </button>
                  </div>
                </div>


                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-gray-800">Danh sách không trả lời</h5>
                </div>

                {isLoadingIgnored ? (
                  <div className="p-4 text-center text-gray-500">
                    <Clock className="animate-spin mx-auto mb-2" size={20} />
                    Đang tải...
                  </div>
                ) : ignoredItems.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">Chưa có người bị chặn</div>
                ) : (
                  <ul className="divide-y">
                    {ignoredItems.map((it) => (
                      <li key={it.id} className="py-2 flex items-center justify-between">
                        <div className="font-medium text-gray-800 truncate">{it.name || it.thread_id}</div>
                        <button
                          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                          onClick={() => handleDeleteIgnored(it.id)}
                          disabled={deletingIgnoredId === it.id}
                        >
                          Gỡ chặn
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {subTab === 'staff' && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">Danh sách nhân viên</h4>
                  <button
                    onClick={loadStaff}
                    disabled={isLoadingStaff}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                  >
                    <RefreshCw size={16} className={isLoadingStaff ? 'animate-spin' : ''} />
                    Làm mới
                  </button>
                </div>
                {isLoadingStaff ? (
                  <div className="p-4 text-center text-gray-500">
                    <Clock className="animate-spin mx-auto mb-2" size={20} />
                    Đang tải danh sách nhân viên...
                  </div>
                ) : staffItems.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">Chưa có nhân viên nào</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="py-2 pr-4">Tên</th>
                          {/* <th className="py-2 pr-4">Zalo UID</th> */}
                          <th className="py-2 pr-4">Vai trò</th>
                          <th className="py-2 pr-4">Kích hoạt</th>
                          <th className="py-2 pr-4">Quyền</th>
                          <th className="py-2 pr-4">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffItems.map((s) => (
                          <tr key={s.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 pr-4 font-medium">{s.name}</td>
                            {/* <td className="py-2 pr-4">{s.zalo_uid}</td> */}
                            <td className="py-2 pr-4 capitalize">{s.role}</td>
                            <td className="py-2 pr-4">{s.is_active ? 'Đang hoạt động' : 'Đã vô hiệu'}</td>
                            <td className="py-2 pr-4 text-xs text-gray-700">
                              <div className="flex flex-col gap-1">
                                <label className="inline-flex items-center gap-2 select-none">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300"
                                    checked={!!s.can_control_bot}
                                    onChange={(e) => togglePermission(s.id, 'can_control_bot', e.currentTarget.checked)}
                                    disabled={savingStaffId === s.id}
                                  />
                                  <span>Điều khiển bot</span>
                                </label>
                                <label className="inline-flex items-center gap-2 select-none">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300"
                                    checked={!!s.can_manage_orders}
                                    onChange={(e) => togglePermission(s.id, 'can_manage_orders', e.currentTarget.checked)}
                                    disabled={savingStaffId === s.id}
                                  />
                                  <span>tạo nhóm</span>
                                </label>
                                <label className="inline-flex items-center gap-2 select-none">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300"
                                    checked={!!s.can_receive_notifications}
                                    onChange={(e) => togglePermission(s.id, 'can_receive_notifications', e.currentTarget.checked)}
                                    disabled={savingStaffId === s.id}
                                  />
                                  <span>Nhận thông báo</span>
                                </label>
                                {savingStaffId === s.id && (
                                  <div className="text-[10px] text-gray-500">Đang lưu...</div>
                                )}
                              </div>
                            </td>
                            <td className="py-2 pr-4">
                              <button
                                className="px-2 py-1 text-sm rounded border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-60"
                                onClick={() => handleDeleteStaff(s.id, s.name)}
                                disabled={deletingStaffId === s.id}
                              >
                                {deletingStaffId === s.id ? 'Đang xóa...' : 'Xóa'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Bot config section */}
                <div className="mt-6 rounded border border-gray-200 p-3 bg-gray-50">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-medium text-gray-800">Cấu hình tạm dừng phản hồi</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Đặt số phút bot sẽ không trả lời tin nhắn mới (áp dụng cho tài khoản của bạn).
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-700">Số phút:</label>
                      <input
                        type="number"
                        min={0}
                        value={Number.isFinite(stopMinutes) ? stopMinutes : 0}
                        onChange={(e) => setStopMinutes(Math.max(0, Number(e.currentTarget.value)))}
                        className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                      <button
                        onClick={saveBotConfig}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-60"
                        disabled={isSavingBotConfig}
                      >
                        {isSavingBotConfig ? 'Đang lưu...' : 'Lưu cấu hình'}
                      </button>
                    </div>
                    {botConfig && (
                      <div className="text-xs text-gray-500 mt-2 sm:mt-0">
                        Cập nhật gần nhất: {botConfig.updated_at ? new Date(botConfig.updated_at).toLocaleString('vi-VN') : (botConfig.created_at ? new Date(botConfig.created_at).toLocaleString('vi-VN') : 'Chưa có')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default ZaloTab;
