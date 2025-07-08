import React, { useState, useEffect } from 'react';
import { Sparkles, Video, Volume2, Type, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useVideoProgress, VideoProgressDisplay, VideoGallery, ColorPicker, ExpandableTextarea, getApiBaseUrl } from './VideoCreationShared';
import { useApiKeys } from '../../hooks/useApiKeys';
import { usePersistentState } from '../../hooks/useFormPersistence';
export const SingleVoiceMode: React.FC = () => {
  const { savedApiKeys } = useApiKeys();
  const [selectedAiProvider, setSelectedAiProvider] = usePersistentState('aiProvider', 'gemini');

  // Form state
  const [videoTopic, setVideoTopic] = useState(() => sessionStorage.getItem('videoTopic') || '');
  const [scriptLanguage, setScriptLanguage] = usePersistentState('scriptLanguage', 'Tiếng Việt');
  const [videoScript, setVideoScript] = useState(() => sessionStorage.getItem('videoScript') || '');
  const [videoKeywords, setVideoKeywords] = useState(() => sessionStorage.getItem('videoKeywords') || '');
  
  // Video Settings
  const [videoSource, setVideoSource] = usePersistentState('videoSource', 'Pexels');
  const [concatenationMode, setConcatenationMode] = usePersistentState('concatenationMode', 'Nối ngẫu nhiên (Recommend)');
  const [transitionMode, setTransitionMode] = usePersistentState('transitionMode', 'Không có');
  const [aspectRatio, setAspectRatio] = usePersistentState('aspectRatio', 'Dọc 9:16');
  const [maxSegmentDuration, setMaxSegmentDuration] = usePersistentState('maxSegmentDuration', 5);
  const [concurrentVideos, setConcurrentVideos] = usePersistentState('concurrentVideos', 1);

  // Audio Settings
  const [ttsServer, setTtsServer] = usePersistentState('ttsServer', 'azure_tts_v1');
  const [ttsVoice, setTtsVoice] = usePersistentState('ttsVoice', 'vi-VN-HoaiMyNeural');
  const geminiApiKey = savedApiKeys.gemini_api_key;
  const openaiApiKey = savedApiKeys.openai_api_key;
  const [azureRegion, setAzureRegion] = usePersistentState('azureRegion', '');
  const [azureApiKey, setAzureApiKey] = usePersistentState('azureApiKey', ''); 
  const [voiceVolume, setVoiceVolume] = usePersistentState('voiceVolume', 1.0);
  const [voiceSpeed, setVoiceSpeed] = usePersistentState('voiceSpeed', 1.0);
  const [backgroundMusic, setBackgroundMusic] = usePersistentState('backgroundMusic', 'Ngẫu nhiên');
  const [backgroundMusicVolume, setBackgroundMusicVolume] = usePersistentState('backgroundMusicVolume', 0.5);

  // Subtitle Settings
  const [enableSubtitles, setEnableSubtitles] = usePersistentState('enableSubtitles', true);
  const [subtitleProvider, setSubtitleProvider] = usePersistentState('subtitleProvider', 'edge');
  const [subtitleFont, setSubtitleFont] = usePersistentState('subtitleFont', 'DancingScript.ttf');
  const [subtitlePosition, setSubtitlePosition] = usePersistentState('subtitlePosition', 'Dưới (Recommend)');
  const [customSubtitlePosition, setCustomSubtitlePosition] = usePersistentState('customSubtitlePosition', '0.0');
  const [subtitleTextColor, setSubtitleTextColor] = usePersistentState('subtitleTextColor', '#FFFFFF');
  const [showTextColorPicker, setShowTextColorPicker] = usePersistentState('showTextColorPicker', false);
  const [subtitleFontSize, setSubtitleFontSize] = usePersistentState('subtitleFontSize', 80);
  const [subtitleBorderColor, setSubtitleBorderColor] = usePersistentState('subtitleBorderColor', '#000000');
  const [showBorderColorPicker, setShowBorderColorPicker] = usePersistentState('showBorderColorPicker', false);
  const [subtitleBorderWidth, setSubtitleBorderWidth] = usePersistentState('subtitleBorderWidth', 2);
  const [subtitleType, setSubtitleType] = usePersistentState('subtitleType', 'normal');
  // Loading states
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);

  // Video progress tracking
  const { videoProgress, completedVideos, startVideoCreation, stopVideoCreation } = useVideoProgress();

  useEffect(() => {
    sessionStorage.setItem('videoTopic', videoTopic);
    sessionStorage.setItem('videoScript', videoScript);
    sessionStorage.setItem('videoKeywords', videoKeywords);
  }, [videoTopic, videoScript, videoKeywords]);

  useEffect(() => {
    // Set a default AI provider based on available keys
    if (savedApiKeys.gemini_api_key) {
      setSelectedAiProvider('gemini');
    } else if (savedApiKeys.openai_api_key) {
      setSelectedAiProvider('openai');
    }
  }, [savedApiKeys, setSelectedAiProvider]);

  const getVoiceOptions = () => {
    if (ttsServer === 'azure_tts_v1') {
      return [
        { value: 'vi-VN-HoaiMyNeural', label: 'vi-VN-HoaiMyNeural' },
        { value: 'vi-VN-NamMinhNeural', label: 'vi-VN-NamMinhNeural' },
      ];
    } else if (ttsServer === 'azure_tts_v2') {
      return [
        { value: 'en-US-AvaMultilingualNeural-V2', label: 'en-US-AvaMultilingualNeural-V2 (Female)' },
        { value: 'en-US-AndrewMultilingualNeural-V2', label: 'en-US-AndrewMultilingualNeural-V2 (Male)' },
        { value: 'en-US-EmmaMultilingualNeural-V2', label: 'en-US-EmmaMultilingualNeural-V2 (Female)' },
        { value: 'en-US-BrianMultilingualNeural-V2', label: 'en-US-BrianMultilingualNeural-V2 (Male)' },
        { value: 'de-DE-FlorianMultilingualNeural-V2', label: 'de-DE-FlorianMultilingualNeural-V2 (Male)' },
        { value: 'de-DE-SeraphinaMultilingualNeural-V2', label: 'de-DE-SeraphinaMultilingualNeural-V2 (Female)' },
        { value: 'fr-FR-RemyMultilingualNeural-V2', label: 'fr-FR-RemyMultilingualNeural-V2 (Male)' },
        { value: 'fr-FR-VivienneMultilingualNeural-V2', label: 'fr-FR-VivienneMultilingualNeural-V2 (Female)' },
        { value: 'zh-CN-XiaoxiaoMultilingualNeural-V2', label: 'zh-CN-XiaoxiaoMultilingualNeural-V2 (Female)' },
      ];
    } else if (ttsServer === 'gemini') {
      return [
        { value: 'Puck', label: 'Puck - Nam' },
        { value: 'Charon', label: 'Charon - Nam' },
        { value: 'Fenrir', label: 'Fenrir - Nam' },
        { value: 'Orus', label: 'Orus - Nam' },
        { value: 'Enceladus', label: 'Enceladus - Nam' },
        { value: 'Iapetus', label: 'Iapetus - Nam' },
        { value: 'Umbriel', label: 'Umbriel - Nam' },
        { value: 'Algenib', label: 'Algenib - Nam' },
        { value: 'Algieba', label: 'Algieba - Nam' },
        { value: 'Rasalgethi', label: 'Rasalgethi - Nam' },
        { value: 'Alnilam', label: 'Alnilam - Nam' },
        { value: 'Schedar', label: 'Schedar - Nam' },
        { value: 'Pulcherrima', label: 'Pulcherrima - Nam' },
        { value: 'Achird', label: 'Achird - Nam' },
        { value: 'Zubenelgenubi', label: 'Zubenelgenubi - Nam' },
        { value: 'Sadachbia', label: 'Sadachbia - Nam' },
        { value: 'Sadaltager', label: 'Sadaltager - Nam' },
        { value: 'Zephyr', label: 'Zephyr - Nữ' },
        { value: 'Kore', label: 'Kore - Nữ' },
        { value: 'Leda', label: 'Leda - Nữ' },
        { value: 'Aoede', label: 'Aoede - Nữ' },
        { value: 'Callirrhoe', label: 'Callirrhoe - Nữ' },
        { value: 'Autonoe', label: 'Autonoe - Nữ' },
        { value: 'Despina', label: 'Despina - Nữ' },
        { value: 'Erinome', label: 'Erinome - Nữ' },
        { value: 'Laomedeia', label: 'Laomedeia - Nữ' },
        { value: 'Achernar', label: 'Achernar - Nữ' },
        { value: 'Gacrux', label: 'Gacrux - Nữ' },
        { value: 'Vindemiatrix', label: 'Vindemiatrix - Nữ' },
        { value: 'Sulafat', label: 'Sulafat - Nữ' },
      ];
    }
    return [];
  };

  React.useEffect(() => {
    const currentVoiceOptions = getVoiceOptions();
    if (currentVoiceOptions.length > 0 && !currentVoiceOptions.some(option => option.value === ttsVoice)) {
      setTtsVoice(currentVoiceOptions[0].value);
    } else if (currentVoiceOptions.length === 0) {
      setTtsVoice('');
    }
  }, [ttsServer]);

  const handleGenerateScriptAndKeywords = async () => {
    if (!videoTopic.trim()) {
      alert('Vui lòng nhập chủ đề video');
      return;
    }

    setIsGeneratingScript(true);

    try {
      const apiBaseUrl = getApiBaseUrl();
      
      // Generate script
      const scriptResponse = await fetch(`${apiBaseUrl}/api/v1/scripts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_subject: videoTopic,
          video_language: scriptLanguage === 'Tiếng Việt' ? 'Vietnamese' : 'English',
          paragraph_number: 1,
          gemini_key: selectedAiProvider === 'gemini' ? geminiApiKey : null,
          openai_key: selectedAiProvider === 'openai' ? openaiApiKey : null,
          llm_provider: selectedAiProvider
        })
      });

      if (scriptResponse.ok) {
        const scriptData = await scriptResponse.json();
        const generatedScript = scriptData.data.video_script;
        setVideoScript(generatedScript);

        // Generate keywords
        const keywordsResponse = await fetch(`${apiBaseUrl}/api/v1/terms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            video_subject: videoTopic,
            video_script: generatedScript,
            amount: 5,
            gemini_key: selectedAiProvider === 'gemini' ? geminiApiKey : null,
            openai_key: selectedAiProvider === 'openai' ? openaiApiKey : null,
            llm_provider: selectedAiProvider
          })
        });

        if (keywordsResponse.ok) {
          const keywordsData = await keywordsResponse.json();
          const keywords = keywordsData.data.video_terms.join(', ');
          setVideoKeywords(keywords);
        }
      } else {
        alert('Lỗi khi tạo kịch bản');
      }
    } catch (error) {
      console.error('Error generating script and keywords:', error);
      alert('Lỗi kết nối khi tạo kịch bản');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateKeywordsFromScript = async () => {
    if (!videoTopic.trim() || !videoScript.trim()) {
      alert('Vui lòng nhập chủ đề và kịch bản video');
      return;
    }

    setIsGeneratingKeywords(true);

    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/terms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_subject: videoTopic,
          video_script: videoScript,
          amount: 5,
          gemini_key: selectedAiProvider === 'gemini' ? geminiApiKey : null,
          openai_key: selectedAiProvider === 'openai' ? openaiApiKey : null,
          llm_provider: selectedAiProvider
        })
      });

      if (response.ok) {
        const data = await response.json();
        const keywords = data.data.video_terms.join(', ');
        setVideoKeywords(keywords);
      } else {
        alert('Lỗi khi tạo từ khóa');
      }
    } catch (error) {
      console.error('Error generating keywords:', error);
      alert('Lỗi kết nối khi tạo từ khóa');
    } finally {
      setIsGeneratingKeywords(false);
    }
  };

  const handleCreateVideo = async () => {
    if (!videoTopic.trim() || !videoScript.trim() || !videoKeywords.trim()) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const apiBaseUrl = getApiBaseUrl();
      
      // Map UI values to API values
      const aspectRatioMap: { [key: string]: string } = {
        'Dọc 9:16': '9:16',
        'Ngang 16:9': '16:9',
        'Vuông 1:1': '1:1'
      };

      const concatModeMap: { [key: string]: string } = {
        'Nối ngẫu nhiên (Recommend)': 'random',
        'Nối theo thứ tự': 'sequential'
      };

      const transitionMap: { [key: string]: string | null } = {
        'Không có': 'None',
        'Ngẫu nhiên': 'Shuffle',
        'Fade in': 'FadeIn',
        'Fade out': 'FadeOut',
        'Slide in': 'SlideIn',
        'Slide out': 'SlideOut'
      };

      const positionMap: { [key: string]: string } = {
        'top': 'top',
        'center': 'center',
        'bottom': 'bottom',
        'custom': 'custom'
      };

      const requestBody = {
        video_subject: videoTopic,
        video_script: videoScript,
        video_terms: videoKeywords,
        video_aspect: aspectRatioMap[aspectRatio] || '9:16',
        video_concat_mode: concatModeMap[concatenationMode] || 'random',
        video_transition_mode: transitionMap[transitionMode],
        video_clip_duration: maxSegmentDuration,
        video_count: concurrentVideos,
        video_source: videoSource.toLowerCase(),
        video_materials: [{
          provider: videoSource.toLowerCase(),
          url: "",
          duration: 0
        }],
        video_language: scriptLanguage === 'Tiếng Việt' ? 'Vietnamese' : 'English',
        voice_name: ttsVoice,
        voice_volume: voiceVolume,
        tts_server: ttsServer,
        voice_rate: voiceSpeed,
        bgm_type: backgroundMusic === 'Ngẫu nhiên' ? 'random' : backgroundMusic.toLowerCase(),
        bgm_file: "",
        bgm_volume: backgroundMusicVolume,
        subtitle_enabled: enableSubtitles,
        type_subtitle: subtitleType,
        subtitle_provider: subtitleProvider,
        subtitle_position: positionMap[subtitlePosition],
        custom_position: parseFloat(customSubtitlePosition),
        font_name: subtitleFont,
        text_fore_color: subtitleTextColor,
        text_background_color: true,
        font_size: subtitleFontSize,
        stroke_color: subtitleBorderColor,
        stroke_width: subtitleBorderWidth,
        n_threads: 6,
        paragraph_number: 1,
        gemini_key: geminiApiKey,
        openai_key: openaiApiKey,
        speech_key: azureApiKey,
        speech_region: azureRegion
      };

      const response = await fetch(`${apiBaseUrl}/api/v1/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        const taskId = data.data.task_id;
        startVideoCreation(taskId);
      } else {
        alert('Lỗi khi tạo video');
      }
    } catch (error) {
      console.error('Error creating video:', error);
      alert('Lỗi kết nối khi tạo video');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Cài đặt kịch bản video */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 w-12 h-12 rounded-xl flex items-center justify-center">
              <Sparkles className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cài đặt kịch bản video</h2>
              <p className="text-gray-600 text-sm">Tạo nội dung video với AI</p>
            </div>
          </div>

          {/* AI Provider Switch */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tạo nội dung bằng AI
            </label>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setSelectedAiProvider('gemini')}
                disabled={!savedApiKeys.gemini_api_key}
                className={`w-1/2 py-1.5 text-sm font-semibold rounded-md transition-all duration-300 ${
                  selectedAiProvider === 'gemini'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-500 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                ✨ Gemini
              </button>
              <button
                onClick={() => setSelectedAiProvider('openai')}
                disabled={!savedApiKeys.openai_api_key}
                className={`w-1/2 py-1.5 text-sm font-semibold rounded-md transition-all duration-300 ${
                  selectedAiProvider === 'openai'
                    ? 'bg-white text-purple-600 shadow'
                    : 'text-gray-500 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                🧠 OpenAI
              </button>
            </div>
            {!savedApiKeys.gemini_api_key && !savedApiKeys.openai_api_key && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                Bạn cần cấu hình API Key (Gemini hoặc OpenAI) trong trang
                <Link to="/accounts" className="font-bold underline ml-1">Cấu hình </Link>
                 để sử dụng chức năng này.
              </div>
            )}
          </div>

          {/* Chủ Đề Video */}
          <div className="mb-6">
            <label htmlFor="videoTopic" className="block text-sm font-medium text-gray-700 mb-2">
              Chủ Đề Video
            </label>
            <textarea
              id="videoTopic"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
              rows={2}
              placeholder="Nhập chủ đề video của bạn..."
              value={videoTopic}
              onChange={(e) => setVideoTopic(e.target.value)}
            />
          </div>

          {/* Ngôn ngữ cho kịch bản video */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Ngôn ngữ cho kịch bản video
            </label>
            <div className="flex items-center gap-6 mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  name="scriptLanguage"
                  value="Tiếng Việt"
                  checked={scriptLanguage === 'Tiếng Việt'}
                  onChange={(e) => setScriptLanguage(e.target.value)}
                />
                <span className="ml-2 text-gray-700 font-medium">Tiếng Việt</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  name="scriptLanguage"
                  value="Tiếng Anh"
                  checked={scriptLanguage === 'Tiếng Anh'}
                  onChange={(e) => setScriptLanguage(e.target.value)}
                />
                <span className="ml-2 text-gray-700 font-medium">Tiếng Anh</span>
              </label>
            </div>
            <button 
              onClick={handleGenerateScriptAndKeywords}
              disabled={isGeneratingScript}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGeneratingScript ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Đang tạo...
                </>
              ) : (
                'Tạo kịch bản và từ khóa bằng AI từ chủ đề video'
              )}
            </button>
          </div>

          {/* Kịch Bản Video */}
          <div className="mb-6">
            <ExpandableTextarea
              value={videoScript}
              onChange={setVideoScript}
              label="Kịch Bản Video"
              placeholder="Kịch bản video sẽ được tạo ở đây..."
              rows={8}
            />
            <button 
              onClick={handleGenerateKeywordsFromScript}
              disabled={isGeneratingKeywords}
              className="mt-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGeneratingKeywords ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Đang tạo...
                </>
              ) : (
                'Tạo từ khóa bằng AI từ chủ đề và kịch bản video'
              )}
            </button>
          </div>

          {/* Từ Khóa Video */}
          <div>
            <ExpandableTextarea
              value={videoKeywords}
              onChange={setVideoKeywords}
              label="Từ Khóa Video"
              placeholder="Nhập các từ khóa liên quan đến video, cách nhau bởi dấu phẩy..."
              rows={2}
            />
          </div>
        </div>

        {/* Cài đặt video */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-green-100 to-blue-100 w-12 h-12 rounded-xl flex items-center justify-center">
              <Video className="text-green-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cài đặt video</h2>
              <p className="text-gray-600 text-sm">Tùy chỉnh chất lượng và hiệu ứng</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Nguồn Video */}
            <div>
              <label htmlFor="videoSource" className="block text-sm font-medium text-gray-700 mb-2">
                Nguồn Video
              </label>
              <select
                id="videoSource"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={videoSource}
                onChange={(e) => setVideoSource(e.target.value)}
              >
                <option value="Pexels">Pexels</option>
                <option value="Pixabay">Pixabay</option>
                <option value="Tệp cục bộ">Tệp cục bộ</option>
              </select>
            </div>

            {/* Chế Độ Nối Video */}
            <div>
              <label htmlFor="concatenationMode" className="block text-sm font-medium text-gray-700 mb-2">
                Chế Độ Nối Video
              </label>
              <select
                id="concatenationMode"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={concatenationMode}
                onChange={(e) => setConcatenationMode(e.target.value)}
              >
                <option value="Nối ngẫu nhiên (Recommend)">Nối ngẫu nhiên (Recommend)</option>
                <option value="Nối theo thứ tự">Nối theo thứ tự</option>
              </select>
            </div>

            {/* Chế Độ Chuyển Đổi Video */}
            <div>
              <label htmlFor="transitionMode" className="block text-sm font-medium text-gray-700 mb-2">
                Chế Độ Chuyển Đổi Video
              </label>
              <select
                id="transitionMode"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={transitionMode}
                onChange={(e) => setTransitionMode(e.target.value)}
              >
                <option value="Không có">Không có</option>
                <option value="Ngẫu nhiên">Ngẫu nhiên</option>
                <option value="Fade in">Fade in</option>
                <option value="Fade out">Fade out</option>
                <option value="Slide in">Slide in</option>
                <option value="Slide out">Slide out</option>
              </select>
            </div>

            {/* Tỷ Lệ Khung Hình Video */}
            <div>
              <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-700 mb-2">
                Tỷ Lệ Khung Hình Video
              </label>
              <select
                id="aspectRatio"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
              >
                <option value="Dọc 9:16">Dọc 9:16</option>
                <option value="Ngang 16:9">Ngang 16:9</option>
                <option value="Vuông 1:1">Vuông 1:1</option>
              </select>
            </div>

            {/* Thời Lượng Tối Đa Của Đoạn Video */}
            <div>
              <label htmlFor="maxSegmentDuration" className="block text-sm font-medium text-gray-700 mb-2">
                Thời Lượng Tối Đa Của Đoạn Video (giây)
              </label>
              <select
                id="maxSegmentDuration"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={maxSegmentDuration}
                onChange={(e) => setMaxSegmentDuration(Number(e.target.value))}
              >
                {[...Array(9)].map((_, i) => (
                  <option key={i + 2} value={i + 2}>
                    {i + 2}
                  </option>
                ))}
              </select>
            </div>

            {/* Số Video Được Tạo Ra Đồng Thời */}
            <div>
              <label htmlFor="concurrentVideos" className="block text-sm font-medium text-gray-700 mb-2">
                Số Video Được Tạo Ra Đồng Thời
              </label>
              <select
                id="concurrentVideos"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={concurrentVideos}
                onChange={(e) => setConcurrentVideos(Number(e.target.value))}
              >
                {[...Array(5)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Cài đặt phụ đề */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 w-12 h-12 rounded-xl flex items-center justify-center">
              <Type className="text-purple-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cài đặt phụ đề</h2>
              <p className="text-gray-600 text-sm">Tùy chỉnh hiển thị phụ đề</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Bật phụ đề */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableSubtitles"
                checked={enableSubtitles}
                onChange={(e) => setEnableSubtitles(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="enableSubtitles" className="ml-2 text-sm font-medium text-gray-700">
                Bật phụ đề
              </label>
            </div>

            {enableSubtitles && (
              <>
                {/* Nhà cung cấp phụ đề */}
                <div>
                  <label htmlFor="subtitleProvider" className="block text-sm font-medium text-gray-700 mb-2">
                    Cách tạo phụ đề
                  </label>
                  <select
                    id="subtitleProvider"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    value={subtitleProvider}
                    onChange={(e) => setSubtitleProvider(e.target.value)}
                  >
                    <option value="edge">Dự đoán (Free, Nhanh)</option>
                    <option value="whisper_api">Open AI API (Mất phí, Nhanh, Cần Api Key)</option>
                    <option value="whisper_local">Mô hình Local (Free, Chậm)</option>
                  </select>
                </div>

                {subtitleProvider === 'whisper_api' && !savedApiKeys.openai_api_key && (
                  <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    Bạn cần cấu hình <b>OpenAI API Key</b> trong trang
                    <Link to="/accounts" className="font-bold underline ml-1">Cấu hình </Link>
                     để sử dụng chức năng này.
                  </div>
                )}

                {/* Kiểu phụ đề */}
                <div>
                  <label htmlFor="subtitleType" className="block text-sm font-medium text-gray-700 mb-2">
                    Hiệu ứng phụ đề
                  </label>
                  <select
                    id="subtitleType"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    value={subtitleType}
                    onChange={(e) => setSubtitleType(e.target.value)}
                  >
                    <option value="normal">Không có</option>
                    <option value="typewriter">Gõ chữ</option>
                    <option value="word2word">Hiển thị từng chữ</option>
                  </select>
                </div>

                {/* Phông Chữ Phụ Đề */}
                <div>
                  <label htmlFor="subtitleFont" className="block text-sm font-medium text-gray-700 mb-2">
                    Phông Chữ Phụ Đề
                  </label>
                  <select
                    id="subtitleFont"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    value={subtitleFont}
                    onChange={(e) => setSubtitleFont(e.target.value)}
                  >
                    <option value="DancingScript.ttf">Dancing Script</option>
                    <option value="UTM Kabel KT.ttf">UTM Kabel KT</option>
                    <option value="Charm.ttf">Charm</option>
                    <option value="Bangers.ttf">Bangers</option>
                    <option value="BungeeSpice.ttf">BungeeSpice</option>
                    <option value="Lobster.ttf">Lobster</option>
                    <option value="Neonderthaw.ttf">Neonderthaw</option>
                    <option value="ComforterBrush.ttf">Comforter Brush</option>
                    <option value="Charmonman.ttf">Charmonman</option>
                  </select>
                </div>

                {/* Vị trí phụ đề */}
                <div>
                  <label htmlFor="subtitlePosition" className="block text-sm font-medium text-gray-700 mb-2">
                    Vị trí phụ đề
                  </label>
                  <select
                    id="subtitlePosition"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    value={subtitlePosition}
                    onChange={(e) => setSubtitlePosition(e.target.value)}
                  >
                    <option value="top">Trên</option>
                    <option value="center">Giữa</option>
                    <option value="bottom">Dưới (Recommend)</option>
                    <option value="custom">Tùy chỉnh</option>
                  </select>
                </div>

                {/* Tùy chỉnh vị trí */}
                {subtitlePosition === 'Tùy chỉnh' && (
                  <div>
                    <label htmlFor="customSubtitlePosition" className="block text-sm font-medium text-gray-700 mb-2">
                      Vị trí tùy chỉnh (% từ trên xuống)
                    </label>
                    <input
                      type="number"
                      id="customSubtitlePosition"
                      min="0"
                      max="100"
                      value={customSubtitlePosition}
                      onChange={(e) => setCustomSubtitlePosition(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="85"
                    />
                  </div>
                )}

                {/* Màu phụ đề */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Màu phụ đề
                  </label>
                  <ColorPicker
                    color={subtitleTextColor}
                    onChange={setSubtitleTextColor}
                    show={showTextColorPicker}
                    onToggle={() => setShowTextColorPicker(!showTextColorPicker)}
                  />
                </div>

                {/* Cỡ chữ */}
                <div>
                  <label htmlFor="subtitleFontSize" className="block text-sm font-medium text-gray-700 mb-2">
                    Cỡ chữ: {subtitleFontSize}
                  </label>
                  <input
                    type="range"
                    id="subtitleFontSize"
                    min="30"
                    max="100"
                    value={subtitleFontSize}
                    onChange={(e) => setSubtitleFontSize(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>30</span>
                    <span>100</span>
                  </div>
                </div>

                {/* Màu viền phụ đề */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Màu viền phụ đề
                  </label>
                  <ColorPicker
                    color={subtitleBorderColor}
                    onChange={setSubtitleBorderColor}
                    show={showBorderColorPicker}
                    onToggle={() => setShowBorderColorPicker(!showBorderColorPicker)}
                  />
                </div>

                {/* Cỡ viền phụ đề */}
                <div>
                  <label htmlFor="subtitleBorderWidth" className="block text-sm font-medium text-gray-700 mb-2">
                    Cỡ viền phụ đề: {subtitleBorderWidth.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    id="subtitleBorderWidth"
                    min="0.00"
                    max="10.00"
                    step="0.01"
                    value={subtitleBorderWidth}
                    onChange={(e) => setSubtitleBorderWidth(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.00</span>
                    <span>10.00</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Cài đặt âm thanh */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 w-12 h-12 rounded-xl flex items-center justify-center">
              <Volume2 className="text-yellow-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cài đặt âm thanh</h2>
              <p className="text-gray-600 text-sm">Tùy chỉnh giọng đọc và nhạc nền</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Máy Chủ TTS */}
            <div>
              <label htmlFor="ttsServer" className="block text-sm font-medium text-gray-700 mb-2">
                Máy Chủ TTS
              </label>
              <select
                id="ttsServer"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={ttsServer}
                onChange={(e) => setTtsServer(e.target.value)}
              >
                <option value="azure_tts_v1">Azure TTS V1 (Nhanh)</option>
                <option value="azure_tts_v2">Azure TTS V2 (Nhanh, Cần API Key)</option>
                <option value="gemini">Gemini 2.5 Flash TTS (Nhanh, Cần API Key)</option>
              </select>
            </div>
            
            {ttsServer === 'gemini' && !savedApiKeys.gemini_api_key && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                Bạn cần cấu hình <b>Gemini API Key</b> trong trang
                <Link to="/accounts" className="font-bold underline ml-1">Cấu hình </Link>
                 để sử dụng chức năng này.
              </div>
            )}

            {/* Azure TTS V2 specific inputs */}
            {ttsServer === 'azure_tts_v2' && (
              <>
                <div>
                  <label htmlFor="azureRegion" className="block text-sm font-medium text-gray-700 mb-2">
                    Vùng (Region)
                  </label>
                  <input
                    type="text"
                    id="azureRegion"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Ví dụ: westus2"
                    value={azureRegion}
                    onChange={(e) => setAzureRegion(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="azureApiKey" className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    id="azureApiKey"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Nhập API Key của bạn"
                    value={azureApiKey}
                    onChange={(e) => setAzureApiKey(e.target.value)}
                  />
                </div>
              </>
            )}

          
            {/* Giọng Đọc Văn Bản */}
            <div>
              <label htmlFor="ttsVoice" className="block text-sm font-medium text-gray-700 mb-2">
                Giọng Đọc Văn Bản
              </label>
              <select
                id="ttsVoice"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={ttsVoice}
                onChange={(e) => setTtsVoice(e.target.value)}
              >
                {getVoiceOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Âm Lượng Giọng Đọc */}
            <div>
              <label htmlFor="voiceVolume" className="block text-sm font-medium text-gray-700 mb-2">
                Âm Lượng Giọng Đọc
              </label>
              <select
                id="voiceVolume"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={voiceVolume}
                onChange={(e) => setVoiceVolume(Number(e.target.value))}
              >
                {[0.6, 0.8, 1.0, 1.2, 1.5, 2.0, 3.0, 4.0, 5.0].map((vol) => (
                  <option key={vol} value={vol}>
                    {vol.toFixed(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Tốc Độ Giọng Đọc */}
            <div>
              <label htmlFor="voiceSpeed" className="block text-sm font-medium text-gray-700 mb-2">
                Tốc Độ Giọng Đọc
              </label>
              <select
                id="voiceSpeed"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(Number(e.target.value))}
              >
                {[0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.5, 1.8, 2.0].map((speed) => (
                  <option key={speed} value={speed}>
                    {speed.toFixed(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Âm Nhạc Nền */}
            <div>
              <label htmlFor="backgroundMusic" className="block text-sm font-medium text-gray-700 mb-2">
                Âm Nhạc Nền
              </label>
              <select
                id="backgroundMusic"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={backgroundMusic}
                onChange={(e) => setBackgroundMusic(e.target.value)}
              >
                <option value="Ngẫu nhiên">Ngẫu nhiên</option>
                <option value="Không có">Không có</option>
                <option value="Tùy chỉnh">Tùy chỉnh</option>
              </select>
            </div>

            {/* Âm Lượng Nhạc Nền */}
            <div>
              <label htmlFor="backgroundMusicVolume" className="block text-sm font-medium text-gray-700 mb-2">
                Âm Lượng Nhạc Nền: {backgroundMusicVolume.toFixed(1)}
              </label>
              <input
                type="range"
                id="backgroundMusicVolume"
                min="0.1"
                max="1.0"
                step="0.1"
                value={backgroundMusicVolume}
                onChange={(e) => setBackgroundMusicVolume(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.1</span>
                <span>1.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Full Width */}
      <div className="lg:col-span-2 flex justify-center gap-4">
        <button 
          onClick={handleCreateVideo}
          disabled={videoProgress.isCreating}
          className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center gap-2 ${
            videoProgress.isCreating 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:shadow-xl transform hover:-translate-y-1'
          }`}
        >
          {videoProgress.isCreating ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Đang tạo video...
            </>
          ) : (
            'Tạo Video'
          )}
        </button>
      </div>

      {/* Progress Display - Full Width */}
      <div className="lg:col-span-2">
        <VideoProgressDisplay 
          progress={videoProgress} 
          onStop={stopVideoCreation}
        />
      </div>

      {/* Video Gallery - Full Width */}
      <div className="lg:col-span-2">
        <VideoGallery videos={completedVideos} />
      </div>
    </div>
  );
};