import React, { useEffect, useState } from 'react';
import { RefreshCw, Settings } from 'lucide-react';
import { getAuthHeader } from '../../services/apiService';

const BotPowerTab: React.FC = () => {
  const [mobileBotLoading, setMobileBotLoading] = useState<boolean>(false);
  const [customBotLoading, setCustomBotLoading] = useState<boolean>(false);
  const [mobileBotStatus, setMobileBotStatus] = useState<string>('unknown');
  const [customBotStatus, setCustomBotStatus] = useState<string>('unknown');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [platformCtrl, setPlatformCtrl] = useState<{ [k: string]: boolean }>({ zalo: true, zalo_oa: true, messenger: true });
  const [platformLoading, setPlatformLoading] = useState<boolean>(false);
  const [platformBusy, setPlatformBusy] = useState<string | null>(null);

  const CHAT_BOT_MOBILE_URL = import.meta.env.VITE_CHAT_BOT_MOBILE_URL as string | undefined;
  const CHAT_BOT_CUSTOM_URL = (import.meta.env.VITE_CHAT_BOT_CUSTOM_URL as string | undefined) || 'https://chatbotproduct.quandoiai.vn';

  const getCustomerId = () => {
    try {
      const raw = localStorage.getItem('user_data');
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      return parsed.id || '';
    } catch {
      return '';
    }
  };

  const normalizeStatus = (data: any): string => {
    // Accept multiple response shapes, including wrappers
    try {
      if (typeof data === 'string') return data;
      const payload = data?.data ? data.data : data;
      if (payload && typeof payload === 'object') {
        if (typeof payload.bot_status === 'string') return payload.bot_status;
        if (typeof payload.status === 'string') return payload.status;
        if (typeof payload.is_active === 'boolean') return payload.is_active ? 'active' : 'stopped';
      }
    } catch {}
    return 'unknown';
  };

  const isActiveStatus = (status: string) => ['active', 'running', 'on', 'enabled'].includes(String(status).toLowerCase());

  // Per-platform controls
  const loadPlatformControls = async () => {
    setPlatformLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/chatbot-control/platforms`, {
        headers: {
          ...getAuthHeader(),
        },
      });
      if (!res.ok) throw new Error('Load platform controls failed');
      const data = await res.json().catch(() => ({}));
      setPlatformCtrl({
        zalo: Boolean(data?.zalo ?? true),
        zalo_oa: Boolean(data?.zalo_oa ?? true),
        messenger: Boolean(data?.messenger ?? true),
      });
    } catch (e) {
      // keep defaults
    } finally {
      setPlatformLoading(false);
    }
  };

  const setPlatformEnabled = async (platform: 'zalo' | 'zalo_oa' | 'messenger', enabled: boolean) => {
    setPlatformBusy(platform);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/chatbot-control/platforms`, {
        method: 'PUT',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform, enabled }),
      });
      if (!res.ok) throw new Error('Update platform control failed');
      const data = await res.json().catch(() => ({}));
      setPlatformCtrl({
        zalo: Boolean(data?.zalo ?? platformCtrl.zalo),
        zalo_oa: Boolean(data?.zalo_oa ?? platformCtrl.zalo_oa),
        messenger: Boolean(data?.messenger ?? platformCtrl.messenger),
      });
      setMessage({ type: 'success', text: `${enabled ? 'Đã bật' : 'Đã tắt'} nền tảng ${platform}` });
    } catch (e) {
      setMessage({ type: 'error', text: 'Không thể cập nhật nền tảng' });
    } finally {
      setTimeout(() => setMessage(null), 2000);
      setPlatformBusy(null);
    }
  };

  // Function to update chatbot priority based on current status
  const updateChatbotPriority = async (mobileStatus: string, customStatus: string) => {
    const mobileIsActive = isActiveStatus(mobileStatus);
    const customIsActive = isActiveStatus(customStatus);
    
    try {
      let priority: string;
      
      // Nếu cả 2 bot đang bật thì ưu tiên mobile
      if (mobileIsActive && customIsActive) {
        priority = 'mobile';
      } 
      // Nếu chỉ mobile bật thì ưu tiên mobile
      else if (mobileIsActive && !customIsActive) {
        priority = 'mobile';
      }
      // Nếu chỉ custom bật thì ưu tiên custom
      else if (!mobileIsActive && customIsActive) {
        priority = 'custom';
      }
      // Nếu cả 2 đều tắt thì k bật gì
      else {
        priority = 'null';
      }

      // Gọi API để lưu ưu tiên
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/zalo/chatbot-priority`, {
        method: 'PUT',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority }),
      });
      
      if (res.ok) {
        console.log(`Chatbot priority updated to: ${priority}`);
      }
    } catch (error) {
      console.error('Error updating chatbot priority:', error);
    }
  };

  const loadBotsStatus = async () => {
    const customerId = getCustomerId();
    if (!customerId) return;

    let currentMobileStatus = 'unknown';
    let currentCustomStatus = 'unknown';

    // via backend - Mobile
    setMobileBotLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/chatbot-control/mobile/status`, {
        headers: getAuthHeader(),
      });
      const data = await res.json().catch(() => ({}));
      currentMobileStatus = normalizeStatus(data);
      setMobileBotStatus(currentMobileStatus);
    } catch {
      setMobileBotStatus('unknown');
    } finally {
      setMobileBotLoading(false);
    }

    // via backend - Custom
    setCustomBotLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/chatbot-control/custom/status`, {
        headers: getAuthHeader(),
      });
      const data = await res.json().catch(() => ({}));
      currentCustomStatus = normalizeStatus(data);
      setCustomBotStatus(currentCustomStatus);
    } catch {
      setCustomBotStatus('unknown');
    } finally {
      setCustomBotLoading(false);
    }

    // Cập nhật priority sau khi load xong status
    await updateChatbotPriority(currentMobileStatus, currentCustomStatus);
  };

  const stopMobileBot = async () => {
    const customerId = getCustomerId();
    if (!customerId) return;
    setMobileBotLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/chatbot-control/mobile/stop`, {
        method: 'POST',
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error('Stop mobile bot failed');
      setMessage({ type: 'success', text: 'Đã tạm dừng Chatbot Mobile' });
      await loadBotsStatus();
      // Cập nhật priority sau khi thay đổi trạng thái
      await updateChatbotPriority('stopped', customBotStatus);
    } catch {
      setMessage({ type: 'error', text: 'Không thể tạm dừng Chatbot Mobile' });
    } finally {
      setTimeout(() => setMessage(null), 2000);
      setMobileBotLoading(false);
    }
  };

  const startMobileBot = async () => {
    const customerId = getCustomerId();
    if (!customerId) return;
    setMobileBotLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/chatbot-control/mobile/start`, {
        method: 'POST',
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error('Start mobile bot failed');
      setMessage({ type: 'success', text: 'Đã kích hoạt Chatbot Mobile' });
      await loadBotsStatus();
      // Cập nhật priority sau khi thay đổi trạng thái
      await updateChatbotPriority('active', customBotStatus);
    } catch {
      setMessage({ type: 'error', text: 'Không thể kích hoạt Chatbot Mobile (vui lòng kiểm tra API /customer/start)' });
    } finally {
      setTimeout(() => setMessage(null), 2500);
      setMobileBotLoading(false);
    }
  };

  const controlCustomBot = async (command: 'start' | 'stop') => {
    const customerId = getCustomerId();
    if (!customerId) return;
    setCustomBotLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/chatbot-control/custom`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ command })
      });
      if (!res.ok) throw new Error('Control custom bot failed');
      setMessage({ type: 'success', text: command === 'start' ? 'Đã kích hoạt Chatbot Custom' : 'Đã tạm dừng Chatbot Custom' });
      await loadBotsStatus();
      // Cập nhật priority sau khi thay đổi trạng thái
      const newCustomStatus = command === 'start' ? 'active' : 'stopped';
      await updateChatbotPriority(mobileBotStatus, newCustomStatus);
    } catch {
      setMessage({ type: 'error', text: command === 'start' ? 'Không thể kích hoạt Chatbot Custom' : 'Không thể tạm dừng Chatbot Custom' });
    } finally {
      setTimeout(() => setMessage(null), 2000);
      setCustomBotLoading(false);
    }
  };

  useEffect(() => {
    loadBotsStatus();
    loadPlatformControls();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Bật/Tắt Bot</h2>
          <p className="text-gray-600">Theo dõi trạng thái và điều khiển hoạt động bot</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <Settings className="w-5 h-5 text-indigo-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900">Bật/Tắt theo nền tảng</h3>
            {platformLoading && (
              <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
            )}
            <button onClick={loadPlatformControls} className="ml-auto px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />Làm mới
            </button>
          </div>

          <div className="space-y-4">
            {[
              { key: 'zalo', label: 'Zalo (ZCA)' },
              { key: 'zalo_oa', label: 'Zalo OA' },
              { key: 'messenger', label: 'Messenger' },
            ].map((p) => {
              const key = p.key as 'zalo' | 'zalo_oa' | 'messenger';
              const enabled = Boolean(platformCtrl[key]);
              const busy = platformBusy === key;
              return (
                <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{p.label}</h4>
                    <p className="text-sm text-gray-600">Điều khiển bật/tắt tự động cho nền tảng này</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{enabled ? 'on' : 'off'}</span>
                    <button
                      disabled={busy || enabled}
                      onClick={() => setPlatformEnabled(key, true)}
                      className={`px-3 py-1 rounded border ${busy || enabled ? 'opacity-50 cursor-not-allowed border-gray-300 text-gray-500' : 'border-green-500 text-green-700 hover:bg-green-50'}`}
                    >Bật</button>
                    <button
                      disabled={busy || !enabled}
                      onClick={() => setPlatformEnabled(key, false)}
                      className={`px-3 py-1 rounded border ${busy || !enabled ? 'opacity-50 cursor-not-allowed border-gray-300 text-gray-500' : 'border-red-500 text-red-700 hover:bg-red-50'}`}
                    >Tắt</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <Settings className="w-5 h-5 text-indigo-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900">Trạng thái & Điều khiển</h3>
            {(mobileBotLoading || customBotLoading) && (
              <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
            )}
            <button onClick={loadBotsStatus} className="ml-auto px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />Làm mới
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Chatbot Mobile</h4>
                <p className="text-sm text-gray-600">Nguồn: Backend proxy → {CHAT_BOT_MOBILE_URL || 'Chưa cấu hình (VITE_CHAT_BOT_MOBILE_URL)'}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm ${isActiveStatus(mobileBotStatus) ? 'bg-green-100 text-green-700' : mobileBotStatus === 'stopped' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{mobileBotStatus}</span>
                <button
                  disabled={mobileBotLoading || isActiveStatus(mobileBotStatus)}
                  onClick={startMobileBot}
                  className={`px-3 py-1 rounded border ${mobileBotLoading || isActiveStatus(mobileBotStatus) ? 'opacity-50 cursor-not-allowed border-gray-300 text-gray-500' : 'border-green-500 text-green-700 hover:bg-green-50'}`}
                >Bật</button>
                <button
                  disabled={mobileBotLoading || !isActiveStatus(mobileBotStatus)}
                  onClick={stopMobileBot}
                  className={`px-3 py-1 rounded border ${mobileBotLoading || !isActiveStatus(mobileBotStatus) ? 'opacity-50 cursor-not-allowed border-gray-300 text-gray-500' : 'border-red-500 text-red-700 hover:bg-red-50'}`}
                >Tắt</button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Chatbot Custom</h4>
                <p className="text-sm text-gray-600">Nguồn: Backend proxy → {CHAT_BOT_CUSTOM_URL}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm ${isActiveStatus(customBotStatus) ? 'bg-green-100 text-green-700' : customBotStatus === 'stopped' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{customBotStatus}</span>
                <button
                  disabled={customBotLoading || isActiveStatus(customBotStatus)}
                  onClick={() => controlCustomBot('start')}
                  className={`px-3 py-1 rounded border ${customBotLoading || isActiveStatus(customBotStatus) ? 'opacity-50 cursor-not-allowed border-gray-300 text-gray-500' : 'border-green-500 text-green-700 hover:bg-green-50'}`}
                >Bật</button>
                <button
                  disabled={customBotLoading || !isActiveStatus(customBotStatus)}
                  onClick={() => controlCustomBot('stop')}
                  className={`px-3 py-1 rounded border ${customBotLoading || !isActiveStatus(customBotStatus) ? 'opacity-50 cursor-not-allowed border-gray-300 text-gray-500' : 'border-red-500 text-red-700 hover:bg-red-50'}`}
                >Tắt</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotPowerTab;
