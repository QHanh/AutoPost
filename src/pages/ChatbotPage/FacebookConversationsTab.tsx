// @ts-nocheck
import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  getFacebookPages,
  getFBConversations,
  getFBConversationMessages,
  sendFBTextMessage,
  sendFBImageFromFile,
  type FacebookAccount,
  type FBConversationItem,
  type FBMessageItem,
} from '../../services/facebookService';
import Swal from 'sweetalert2';
import { faqMobileService } from '../../services/faqMobileService';
import { apiGet, apiPut } from '../../services/apiService';

const time = (iso?: string) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const FacebookConversationsTab: React.FC = () => {
  const [pages, setPages] = useState<FacebookAccount[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [selectedPageId, setSelectedPageId] = useState<string>('');

  const [conversations, setConversations] = useState<FBConversationItem[]>([]);
  const [convBefore, setConvBefore] = useState<string | undefined>(undefined);
  const [convAfter, setConvAfter] = useState<string | undefined>(undefined);
  const [convNext, setConvNext] = useState<string | undefined>(undefined);
  const [convPrev, setConvPrev] = useState<string | undefined>(undefined);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [convError, setConvError] = useState<string | null>(null);

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<FBMessageItem[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);

  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Scroll & ordering helpers for messages
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Bot config: pause TTL (minutes) per Page
  const [pauseTTL, setPauseTTL] = useState<string>('');
  const [cfgLoading, setCfgLoading] = useState(false);
  const [cfgSaving, setCfgSaving] = useState(false);
  const [cfgError, setCfgError] = useState<string | null>(null);

  const loadBotConfig = async () => {
    if (!selectedPageId) return;
    setCfgLoading(true);
    setCfgError(null);
    try {
      const res = await apiGet<{ page_id: string; mobile_enabled: boolean; custom_enabled: boolean; pause_ttl_minutes?: number }>(
        `/messenger/bot-config/${selectedPageId}`
      );
      const ttl = typeof res?.pause_ttl_minutes === 'number' ? String(res.pause_ttl_minutes) : '10';
      setPauseTTL(ttl);
    } catch (e: any) {
      setCfgError(e?.message || 'Không tải được cấu hình bot');
    } finally {
      setCfgLoading(false);
    }
  };

  const savePauseTTL = async () => {
    if (!selectedPageId) return;
    const n = Number(pauseTTL);
    if (!Number.isFinite(n) || n < 0) {
      await Swal.fire('Giá trị không hợp lệ', 'TTL phải là số nguyên không âm (phút).', 'warning');
      return;
    }
    setCfgSaving(true);
    try {
      await apiPut(`/messenger/bot-config/${selectedPageId}`, { pause_ttl_minutes: Math.floor(n) });
      await Swal.fire('Đã lưu', 'Đã cập nhật TTL tạm dừng.', 'success');
    } catch (e: any) {
      await Swal.fire('Lỗi', e?.message || 'Không thể lưu TTL', 'error');
    } finally {
      setCfgSaving(false);
    }
  };

  const sortedMessages = useMemo(() => {
    if (!messages) return [];
    try {
      return [...messages].sort((a, b) => {
        const at = new Date(a?.created_time || 0).getTime();
        const bt = new Date(b?.created_time || 0).getTime();
        return at - bt;
      });
    } catch {
      return messages;
    }
  }, [messages]);

  useEffect(() => {
    // Auto scroll to bottom when messages change or switching conversation
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    } else if (messagesEndRef.current) {
      try { messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); } catch {}
    }
  }, [sortedMessages, selectedConversationId]);

  // Add FAQ from a user's message (incoming message)
  const handleAddFaqFromMessage = async (m: FBMessageItem) => {
    const question = (m?.message || '').trim();
    if (!question) {
      await Swal.fire('Không có nội dung', 'Tin nhắn không có nội dung văn bản để tạo FAQ.', 'warning');
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: 'Thêm vào FAQ',
      html: `
        <div class="text-left">
          <label class="block text-sm font-medium mb-1">Câu hỏi</label>
          <textarea id="faq-question" class="swal2-textarea" readonly>${question}</textarea>
          <label class="block text-sm font-medium mb-1">Phân loại</label>
          <input id="faq-classification" class="swal2-input" placeholder="VD: bán hàng, bảo hành" />
          <label class="block text-sm font-medium mb-1">Câu trả lời</label>
          <textarea id="faq-answer" class="swal2-textarea" placeholder="Nhập câu trả lời..."></textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Lưu',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const classification = (document.getElementById('faq-classification') as HTMLInputElement)?.value || '';
        const answer = (document.getElementById('faq-answer') as HTMLTextAreaElement)?.value || '';
        if (!classification.trim() || !answer.trim()) {
          Swal.showValidationMessage('Vui lòng nhập phân loại và câu trả lời');
          return;
        }
        return { classification: classification.trim(), answer: answer.trim() } as { classification: string; answer: string };
      }
    });

    if (!formValues) return;

    try {
      await faqMobileService.addFaq({ classification: formValues.classification, question, answer: formValues.answer });
      await Swal.fire('Thành công', 'Đã thêm câu hỏi vào FAQ', 'success');
    } catch (e: any) {
      await Swal.fire('Lỗi', e?.message || 'Không thể thêm FAQ', 'error');
    }
  };

  // Load pages on mount
  useEffect(() => {
    (async () => {
      setLoadingPages(true);
      setPageError(null);
      try {
        const res = await getFacebookPages();
        setPages(res || []);
        // Preselect first page if exists
        if (res && res.length > 0) {
          setSelectedPageId(res[0].account_id);
        }
      } catch (e: any) {
        setPageError(e?.message || 'Không thể tải danh sách Page');
      } finally {
        setLoadingPages(false);
      }
    })();
  }, []);

  const loadConversations = async (opts?: { before?: string; after?: string }) => {
    if (!selectedPageId) return;
    setLoadingConvs(true);
    setConvError(null);
    setSelectedConversationId(null);
    setMessages([]);
    try {
      // Always use Messenger on UI
      const res = await getFBConversations(selectedPageId, 'messenger', 25, opts?.before, opts?.after);
      const items = res?.data || [];
      setConversations(items);
      const cursors = res?.paging?.cursors || {};
      setConvBefore(cursors.before);
      setConvAfter(cursors.after);
      setConvNext(res?.paging?.next);
      setConvPrev(res?.paging?.previous);
    } catch (e: any) {
      setConvError(e?.message || 'Không thể tải danh sách hội thoại');
    } finally {
      setLoadingConvs(false);
    }
  };

  // reload convs when page changes
  useEffect(() => {
    if (selectedPageId) {
      loadConversations();
      loadBotConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPageId]);

  const loadMessages = async (conversationId: string) => {
    if (!selectedPageId) return;
    setLoadingMsgs(true);
    setMsgError(null);
    try {
      const res = await getFBConversationMessages(selectedPageId, conversationId, 20);
      const items = res?.messages?.data || [];
      setMessages(items);
    } catch (e: any) {
      setMsgError(e?.message || 'Không thể tải tin nhắn');
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleSendText = async () => {
    const text = messageText.trim();
    if (!selectedPageId || !selectedConversationId || !text) return;
    const conv = conversations.find(c => c.id === selectedConversationId);
    const psid = conv?.participants?.data?.find(p => p.id !== selectedPageId)?.id || '';
    if (!psid) {
      await Swal.fire('Lỗi', 'Không xác định được người nhận', 'error');
      return;
    }
    setSending(true);
    try {
      await sendFBTextMessage(selectedPageId, psid, text);
      setMessageText('');
      await loadMessages(selectedConversationId);
    } catch (e: any) {
      await Swal.fire('Lỗi', e?.message || 'Không gửi được tin nhắn', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleSendImageFile = async (fileParam?: File) => {
    const f = fileParam ?? imageFile;
    if (!selectedPageId || !selectedConversationId || !f) return;
    const conv = conversations.find(c => c.id === selectedConversationId);
    const psid = conv?.participants?.data?.find(p => p.id !== selectedPageId)?.id || '';
    if (!psid) {
      await Swal.fire('Lỗi', 'Không xác định được người nhận', 'error');
      return;
    }
    setSending(true);
    try {
      await sendFBImageFromFile(selectedPageId, psid, f, true);
      setImageFile(null);
      if (fileInputRef.current) {
        try { fileInputRef.current.value = ''; } catch {}
      }
      await loadMessages(selectedConversationId);
    } catch (e: any) {
      await Swal.fire('Lỗi', e?.message || 'Không gửi được hình ảnh', 'error');
    } finally {
      setSending(false);
    }
  };

  const selectedPage = useMemo(() => pages.find(p => p.account_id === selectedPageId), [pages, selectedPageId]);
  const selectedConversation = useMemo(() => conversations.find(c => c.id === selectedConversationId) || null, [conversations, selectedConversationId]);
  const selectedPsid = useMemo(() => {
    if (!selectedConversation || !selectedPageId) return '';
    const p = selectedConversation?.participants?.data?.find(p => p.id !== selectedPageId);
    return p?.id || '';
  }, [selectedConversation, selectedPageId]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Page</label>
          <select
            className="border rounded px-3 py-2 min-w-[240px]"
            value={selectedPageId}
            onChange={(e) => setSelectedPageId(e.target.value)}
            disabled={loadingPages}
          >
            {pages.map(p => (
              <option key={p.account_id} value={p.account_id}>
                {p.account_name}
              </option>
            ))}
          </select>
        </div>

        {/* Nền tảng cố định: Messenger (UI không cho chọn) */}

        <div className="mt-6">
          <button
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded border"
            onClick={() => loadConversations()}
            disabled={loadingConvs || !selectedPageId}
          >Làm mới</button>
        </div>

        {selectedPageId && (
          <div className="mt-4 flex items-end gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TTL tự dừng (phút)</label>
              <input
                type="number"
                min={0}
                className="border rounded px-3 py-2 w-40"
                value={pauseTTL}
                onChange={(e) => setPauseTTL(e.target.value)}
                disabled={cfgLoading}
                placeholder="10"
              />
              <div className="text-xs text-gray-500 mt-1">0 = tắt auto-pause</div>
              {cfgError && <div className="text-xs text-red-600 mt-1">{cfgError}</div>}
            </div>
            <button
              className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
              onClick={savePauseTTL}
              disabled={cfgLoading || cfgSaving}
            >{cfgSaving ? 'Đang lưu...' : 'Lưu TTL'}</button>
          </div>
        )}
      </div>

      {pageError && <div className="text-red-600">{pageError}</div>}
      {!loadingPages && pages.length === 0 && (
        <div className="text-gray-600">Chưa có Page nào. Hãy liên kết Facebook trong mục Facebook trước.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Conversations list */}
        <div className="bg-white rounded shadow p-3 md:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Hội thoại</h3>
            <div className="flex gap-2">
              <button
                className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
                onClick={() => loadConversations({ before: convBefore })}
                disabled={!convPrev || loadingConvs}
              >Prev</button>
              <button
                className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
                onClick={() => loadConversations({ after: convAfter })}
                disabled={!convNext || loadingConvs}
              >Next</button>
            </div>
          </div>
          {convError && <div className="text-red-600 mb-2">{convError}</div>}
          {loadingConvs && <div className="text-gray-600">Đang tải hội thoại...</div>}
          {!loadingConvs && (
            <ul className="divide-y">
              {conversations.map(conv => (
                <li
                  key={conv.id}
                  className={`py-2 cursor-pointer ${selectedConversationId === conv.id ? 'bg-blue-50' : ''}`}
                  onClick={() => {
                    setSelectedConversationId(conv.id);
                    loadMessages(conv.id);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {
                          conv?.participants?.data?.find(p => p.id !== selectedPageId)?.name
                          || conv?.participants?.data?.[0]?.name
                          || conv.id
                        }
                      </div>
                      {conv?.snippet && (
                        <div className="text-xs text-gray-600 truncate max-w-[200px]">{conv.snippet}</div>
                      )}
                      <div className="text-[11px] text-gray-400 break-all">{conv.id}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-gray-500">{time(conv.updated_time)}</div>
                      {typeof conv?.unread_count === 'number' && conv.unread_count > 0 && (
                        <span className="mt-1 inline-block bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">{conv.unread_count}</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
              {conversations.length === 0 && <li className="py-2 text-gray-500">Không có hội thoại</li>}
            </ul>
          )}
        </div>

        {/* Messages panel */}
        <div className="bg-white rounded shadow p-3 md:col-span-2 flex flex-col h-[70vh]">
          <h3 className="font-semibold mb-2">Tin nhắn</h3>
          {selectedConversationId ? (
            <>
              {msgError && <div className="text-red-600 mb-2">{msgError}</div>}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto pr-2">
                <ul className="space-y-3">
                  {sortedMessages.map(m => {
                    const isOutgoing = m?.from?.id === selectedPageId;
                    return (
                      <li key={m.id} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-lg px-3 py-2 shadow-sm ${isOutgoing ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                          {m.message && <div className="whitespace-pre-wrap break-words">{m.message}</div>}
                          {Array.isArray(m?.attachments?.data) && m.attachments.data.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {m.attachments.data.map((att: any, idx: number) => {
                                const img = att?.image_data;
                                const preview = img?.preview_url || img?.url;
                                const full = img?.url || preview;
                                if (preview) {
                                  return (
                                    <a key={att?.id || idx} href={full} target="_blank" rel="noreferrer">
                                      <img
                                        src={preview}
                                        alt={att?.name || 'attachment'}
                                        loading="lazy"
                                        className="max-w-full rounded border border-black/10"
                                      />
                                    </a>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          )}
                          <div className={`mt-1 text-[11px] ${isOutgoing ? 'text-blue-100' : 'text-gray-500'}`}>{time(m.created_time)}</div>
                          {!isOutgoing && m?.message && (
                            <div className="mt-1 text-[11px]">
                              <button
                                className="underline text-blue-600 hover:text-blue-700"
                                onClick={() => handleAddFaqFromMessage(m)}
                              >Thêm vào FAQ</button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                  {sortedMessages.length === 0 && !loadingMsgs && (
                    <li className="text-gray-500">Chưa có tin nhắn để hiển thị</li>
                  )}
                </ul>
                <div ref={messagesEndRef} />
              </div>
              {loadingMsgs && <div className="text-gray-600 mt-2">Đang tải tin nhắn...</div>}
              <div className="mt-3 border-t pt-3">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    className="flex-1 border rounded px-3 py-2"
                    placeholder="Nhập tin nhắn..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => { if ((e as any).key === 'Enter' && !(e as any).shiftKey) { e.preventDefault(); handleSendText(); } }}
                    disabled={sending || !selectedPsid}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const f = (e.target.files && e.target.files[0]) ? e.target.files[0] : null;
                      if (f) {
                        setImageFile(f);
                        handleSendImageFile(f);
                      }
                    }}
                    disabled={sending || !selectedPsid}
                  />
                  <button
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded border disabled:opacity-60"
                    onClick={() => { if (fileInputRef.current) fileInputRef.current.click(); }}
                    disabled={sending || !selectedPsid}
                    aria-label="Chọn ảnh"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M4.5 5.25A2.25 2.25 0 016.75 3h10.5A2.25 2.25 0 0119.5 5.25v13.5A2.25 2.25 0 0117.25 21H6.75A2.25 2.25 0 014.5 18.75V5.25zM7.5 8.25a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zM6 18l3.75-5.25 2.25 3 3.75-5.25L18 18H6z" />
                    </svg>
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
                    onClick={handleSendText}
                    disabled={sending || !messageText.trim() || !selectedPsid}
                  >Gửi</button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-600">Chọn một hội thoại để xem tin nhắn</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacebookConversationsTab;
