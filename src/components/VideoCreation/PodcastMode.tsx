import React, { useState, useEffect } from 'react';
import { Video, Volume2, Type, Loader2, Users, Edit3, Trash2, Maximize2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useVideoProgress, VideoProgressDisplay, VideoGallery, ColorPicker, getApiBaseUrl } from './VideoCreationShared';
import { useApiKeys } from '../../hooks/useApiKeys';
import { usePersistentState } from '../../hooks/useFormPersistence';

interface DialogueItem {
  speaker: string;
  content: string;
  id: string;
}

export const PodcastMode: React.FC = () => {
  // Load API keys
  const { savedApiKeys } = useApiKeys();
  // Form state
  const [videoPodcastTopic, setVideoTopic] = useState(() => sessionStorage.getItem('videoPodcastTopic') || '');
  const [videoContent, setVideoContent] = useState(() => sessionStorage.getItem('videoContent') || '');
  // Save form state to session storage
  const [scriptPodcastLanguage, setscriptPodcastLanguage] = usePersistentState('scriptPodcastLanguage', 'Vietnamese');
  const [videoPodcastScript, setVideoScript] = useState(() => sessionStorage.getItem('videoPodcastScript') || '');
  const [videoPodcastKeywords, setVideoKeywords] = useState(() => sessionStorage.getItem('videoPodcastKeywords') || '');
  
  // Dialogue state - now using structured format
  const [dialogueItems, setDialogueItems] = useState<DialogueItem[]>(() => {
    const saved = sessionStorage.getItem('dialogueItems');
    return saved ? JSON.parse(saved) : [];
  });
  const [isDialogueExpanded, setIsDialogueExpanded] = useState(false);
  
  // Podcast specific settings
  const [host1, setHost1] = usePersistentState('host1', 'Mai');
  const [host2, setHost2] = usePersistentState('host2', 'Hoàng');
  const [tone, setTone] = usePersistentState('tone', 'happy');
  
  // Video Settings
  const [videoSource, setVideoSource] = usePersistentState('videoSource', 'pexels');
  const [concatenationModePodcast, setConcatenationModePodcast] = usePersistentState('concatenationModePodcast', 'random');
  const [transitionModePodcast, setTransitionModePodcast] = usePersistentState('transitionModePodcast', 'None');
  const [aspectRatioPodcast, setAspectRatioPodcast] = usePersistentState('aspectRatioPodcast', '9:16');
  const [maxSegmentDurationPodcast, setMaxSegmentDurationPodcast] = usePersistentState('maxSegmentDurationPodcast', 5);
  const [concurrentVideos, setConcurrentVideos] = usePersistentState('concurrentVideos', 1);

  // Audio Settings
  const [host1Gender, setHost1Gender] = usePersistentState('host1Gender', 'Nữ');
  const [voice1, setVoice1] = usePersistentState('voice1', 'Zephyr');
  const [host2Gender, setHost2Gender] = usePersistentState('host2Gender', 'Nam');
  const [voice2, setVoice2] = usePersistentState('voice2', 'Puck');
  const [voiceVolume, setVoiceVolume] = usePersistentState('voiceVolume', 1.0);
  const [voiceSpeed, setVoiceSpeed] = usePersistentState('voiceSpeed', 1.0);
  const [backgroundMusic, setBackgroundMusic] = usePersistentState('backgroundMusic', 'random');
  const [backgroundMusicVolume, setBackgroundMusicVolume] = usePersistentState('backgroundMusicVolume', 0.2);
  const geminiApiKey = savedApiKeys.gemini_api_key;
  // Subtitle Settings
  const [enableSubtitles, setEnableSubtitles] = usePersistentState('enableSubtitles', true);
  const [subtitleProvider, setSubtitleProvider] = usePersistentState('subtitleProvider', 'whisper_api');  
  const [subtitleFont, setSubtitleFont] = usePersistentState('subtitleFont', 'DancingScript.ttf');
  const [subtitlePosition, setSubtitlePosition] = usePersistentState('subtitlePosition', 'bottom');
  const [customSubtitlePosition, setCustomSubtitlePosition] = usePersistentState('customSubtitlePosition', '70');
  const [subtitleTextColor, setSubtitleTextColor] = usePersistentState('subtitleTextColor', '#FFFFFF');
  const [showTextColorPicker, setShowTextColorPicker] = usePersistentState('showTextColorPicker', false);
  const [subtitleFontSize, setSubtitleFontSize] = usePersistentState('subtitleFontSize', 80);
  const [subtitleBorderColor, setSubtitleBorderColor] = usePersistentState('subtitleBorderColor', '#000000');
  const [showBorderColorPicker, setShowBorderColorPicker] = usePersistentState('showBorderColorPicker', false);
  const [subtitleBorderWidth, setSubtitleBorderWidth] = usePersistentState('subtitleBorderWidth', 1.5);
  const openaiApiKey = savedApiKeys.openai_api_key;
  const [subtitleType, setSubtitleType] = usePersistentState('subtitleType', 'normal');
  // Loading states
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isGeneratingDialogueKeywords, setIsGeneratingDialogueKeywords] = useState(false);

  // Video progress tracking
  const { videoProgress, completedVideos, startVideoCreation, stopVideoCreation } = useVideoProgress();

  const getMaleVoices = () => [
    "Puck", "Charon", "Fenrir", "Orus", "Enceladus", "Iapetus", "Umbriel", 
    "Algenib", "Algieba", "Rasalgethi", "Alnilam", "Schedar", "Pulcherrima", 
    "Achird", "Zubenelgenubi", "Sadachbia", "Sadaltager"
  ];

  const getFemaleVoices = () => [
    "Zephyr", "Kore", "Leda", "Aoede", "Callirrhoe", "Autonoe", "Despina", 
    "Erinome", "Laomedeia", "Achernar", "Gacrux", "Vindemiatrix", "Sulafat"
  ];

  useEffect(() => {
    sessionStorage.setItem('videoPodcastTopic', videoPodcastTopic);
    sessionStorage.setItem('videoContent', videoContent);
    sessionStorage.setItem('videoPodcastScript', videoPodcastScript);
    sessionStorage.setItem('videoPodcastKeywords', videoPodcastKeywords);
    sessionStorage.setItem('dialogueItems', JSON.stringify(dialogueItems));
  }, [videoPodcastTopic, videoContent, videoPodcastScript, videoPodcastKeywords, dialogueItems]);

  // Update voice when gender changes
  useEffect(() => {
    if (host1Gender === 'Nam') {
      setVoice1(getMaleVoices()[0]);
    } else {
      setVoice1(getFemaleVoices()[0]);
    }
  }, [host1Gender]);

  useEffect(() => {
    if (host2Gender === 'Nam') {
      setVoice2(getMaleVoices()[0]);
    } else {
      setVoice2(getFemaleVoices()[0]);
    }
  }, [host2Gender]);

  // Parse dialogue from API response
  const parseDialogueFromAPI = (dialogueTTS: string) => {
    const lines = dialogueTTS.split('\n');
    const items: DialogueItem[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and "Read aloud in a warm" line
      if (!trimmedLine || trimmedLine.startsWith('Read aloud in a warm')) {
        continue;
      }
      
      // Check if line contains speaker pattern (Speaker: Content)
      const speakerMatch = trimmedLine.match(/^([^:]+):\s*(.*)$/);
      if (speakerMatch) {
        const [, speaker, content] = speakerMatch;
        if (content.trim()) { // Only add if there's actual content
          items.push({
            id: crypto.randomUUID(),
            speaker: speaker.trim(),
            content: content.trim()
          });
        }
      }
    }
    
    return items;
  };

  // Generate TTS format from dialogue items
  const generateTTSFormat = (items: DialogueItem[]) => {
    const dialogueLines = items.map(item => `${item.speaker}: ${item.content}`);
    return `Read aloud in a warm\n${dialogueLines.join('\n')}`;
  };

  // Generate subtitle format from dialogue items
  const generateSubtitleFormat = (items: DialogueItem[]) => {
    return items.map(item => item.content).join(' ');
  };

  // Update dialogue item content
  const updateDialogueItem = (id: string, newContent: string) => {
    setDialogueItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, content: newContent } : item
      )
    );
  };

  // Remove dialogue item
  const removeDialogueItem = (id: string) => {
    setDialogueItems(prev => prev.filter(item => item.id !== id));
  };

  // Button 1: Generate script, dialogue, and keywords from topic and content
  const handleGenerateAll = async () => {
    if (!videoPodcastTopic.trim() || !videoContent.trim()) {
      alert('Vui lòng nhập chủ đề và nội dung video');
      return;
    }

    setIsGeneratingAll(true);

    try {
      const apiBaseUrl = getApiBaseUrl();
      
      // Step 1: Generate podcast script
      const scriptResponse = await fetch(`${apiBaseUrl}/api/v1/scripts-podcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_subject: videoPodcastTopic,
          video_content: videoContent,
          video_language: scriptPodcastLanguage,
          gemini_key: geminiApiKey,
          openai_key: openaiApiKey
        })
      });

      if (!scriptResponse.ok) {
        throw new Error('Lỗi khi tạo kịch bản podcast');
      }

      const scriptData = await scriptResponse.json();
      const generatedScript = scriptData.data.video_script_podcast;
      setVideoScript(generatedScript);

      // Step 2: Generate dialogue immediately after script
      const dialogueResponse = await fetch(`${apiBaseUrl}/api/v1/dialogues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_content: videoContent,
          video_script: generatedScript,
          video_language: scriptPodcastLanguage,
          host1: host1,
          host2: host2,
          tone: tone,
          gemini_key: geminiApiKey
        })
      });

      if (!dialogueResponse.ok) {
        throw new Error('Lỗi khi tạo hội thoại');
      }

      const dialogueData = await dialogueResponse.json();
      const parsedDialogue = parseDialogueFromAPI(dialogueData.data.video_dialogue_tts);
      setDialogueItems(parsedDialogue);

      // Step 3: Generate keywords
      const keywordsResponse = await fetch(`${apiBaseUrl}/api/v1/terms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_subject: videoPodcastTopic,
          video_script: generatedScript,
          amount: 5,
          gemini_key: geminiApiKey,
          openai_key: openaiApiKey
        })
      });

      if (keywordsResponse.ok) {
        const keywordsData = await keywordsResponse.json();
        const keywords = keywordsData.data.video_terms.join(', ');
        setVideoKeywords(keywords);
      }

    } catch (error) {
      console.error('Error generating all content:', error);
      alert(error instanceof Error ? error.message : 'Lỗi khi tạo nội dung');
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // Button 2: Generate dialogue and keywords from script, content, and topic
  const handleGenerateDialogueAndKeywords = async () => {
    if (!videoPodcastScript.trim() || !videoContent.trim() || !videoPodcastTopic.trim()) {
      alert('Vui lòng nhập kịch bản, nội dung và chủ đề video');
      return;
    }

    setIsGeneratingDialogueKeywords(true);

    try {
      const apiBaseUrl = getApiBaseUrl();
      
      // Generate dialogue
      const dialogueResponse = await fetch(`${apiBaseUrl}/api/v1/dialogues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_content: videoContent,
          video_script: videoPodcastScript,
          video_language: scriptPodcastLanguage,
          host1: host1,
          host2: host2,
          tone: tone,
          gemini_key: geminiApiKey
        })
      });

      if (!dialogueResponse.ok) {
        throw new Error('Lỗi khi tạo hội thoại');
      }

      const dialogueData = await dialogueResponse.json();
      const parsedDialogue = parseDialogueFromAPI(dialogueData.data.video_dialogue_tts);
      setDialogueItems(parsedDialogue);

      // Generate keywords
      const keywordsResponse = await fetch(`${apiBaseUrl}/api/v1/terms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_subject: videoPodcastTopic,
          video_script: videoPodcastScript,
          amount: 5,
          gemini_key: geminiApiKey
        })
      });

      if (keywordsResponse.ok) {
        const keywordsData = await keywordsResponse.json();
        const keywords = keywordsData.data.video_terms.join(', ');
        setVideoKeywords(keywords);
      }

    } catch (error) {
      console.error('Error generating dialogue and keywords:', error);
      alert(error instanceof Error ? error.message : 'Lỗi khi tạo hội thoại và từ khóa');
    } finally {
      setIsGeneratingDialogueKeywords(false);
    }
  };

  const handleCreatePodcastVideo = async () => {
    if (!videoPodcastTopic.trim() || !videoPodcastScript.trim() || !videoPodcastKeywords.trim()) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (dialogueItems.length === 0) {
      alert('Vui lòng tạo hội thoại trước khi tạo video');
      return;
    }

    try {
      const apiBaseUrl = getApiBaseUrl();
      
      // Generate both formats from dialogue items
      const videoDialogueTts = generateTTSFormat(dialogueItems);
      const videoDialogueSubtitle = generateSubtitleFormat(dialogueItems);
      
      const requestBody = {
        video_subject: videoPodcastTopic,
        video_content: videoContent,
        video_script: videoPodcastScript,
        video_dialogue_tts: videoDialogueTts,
        video_dialogue_subtitle: videoDialogueSubtitle,
        video_terms: videoPodcastKeywords,
        video_aspect: aspectRatioPodcast,
        video_concat_mode: concatenationModePodcast,
        video_transition_mode: transitionModePodcast === 'None' ? 'None' : transitionModePodcast,
        video_clip_duration: maxSegmentDurationPodcast,
        video_count: concurrentVideos,
        video_source: videoSource,
        video_materials: [{
          provider: videoSource,
          url: "",
          duration: 0
        }],
        video_language: scriptPodcastLanguage,
        host1: host1,
        host2: host2,
        voice1: voice1,
        voice2: voice2,
        tone: tone,
        voice_volume: voiceVolume,
        voice_rate: voiceSpeed,
        bgm_type: backgroundMusic,
        bgm_file: "",
        bgm_volume: backgroundMusicVolume,
        subtitle_enabled: enableSubtitles,
        subtitle_provider: subtitleProvider,
        subtitle_position: subtitlePosition,
        custom_position: parseFloat(customSubtitlePosition),
        font_name: subtitleFont,
        text_fore_color: subtitleTextColor,
        text_background_color: true,
        type_subtitle: subtitleType,
        font_size: subtitleFontSize,
        stroke_color: subtitleBorderColor,
        stroke_width: subtitleBorderWidth,
        n_threads: 6,
        paragraph_number: 1,
        gemini_key: geminiApiKey,
        openai_key: openaiApiKey
      };

      const response = await fetch(`${apiBaseUrl}/api/v1/video-podcast`, {
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
        alert('Lỗi khi tạo video podcast');
      }
    } catch (error) {
      console.error('Error creating podcast video:', error);
      alert('Lỗi kết nối khi tạo video podcast');
    }
  };

  return (
    <div className="space-y-8">
      {/* Cài đặt kịch bản podcast - Full Width */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 w-12 h-12 rounded-xl flex items-center justify-center">
            <Users className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cài đặt kịch bản Podcast</h2>
            <p className="text-gray-600 text-sm">Tạo nội dung podcast với AI và cài đặt host</p>
          </div>
        </div>

        {!savedApiKeys.gemini_api_key && (
            <div className="mb-6 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                Chức năng này chỉ sử dụng Gemini API. Bạn cần cấu hình <b>Gemini API Key</b> trong trang
                <Link to="/accounts" className="font-bold underline ml-1">Cấu hình </Link>
                để sử dụng.
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side */}
          <div className="space-y-6">
            {/* Chủ Đề Video */}
            <div>
              <label htmlFor="videoTopic" className="block text-sm font-medium text-gray-700 mb-2">
                Chủ Đề Podcast
              </label>
              <textarea
                id="videoTopic"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                rows={2}
                placeholder="Nhập chủ đề video của bạn..."
                value={videoPodcastTopic}
                onChange={(e) => setVideoTopic(e.target.value)}
              />
            </div>

            {/* Nội Dung Podcast */}
            <div>
              <label htmlFor="videoContent" className="block text-sm font-medium text-gray-700 mb-2">
                Nội Dung Podcast
              </label>
              <textarea
                id="videoContent"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                rows={8}
                placeholder="Nhập nội dung chi tiết cho podcast..."
                value={videoContent}
                onChange={(e) => setVideoContent(e.target.value)}
              />
            </div>

            {/* Ngôn ngữ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Ngôn ngữ cho kịch bản video
              </label>
              <div className="flex items-center gap-6 mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    name="scriptPodcastLanguage"
                    value="Vietnamese"
                    checked={scriptPodcastLanguage === 'Vietnamese'}
                    onChange={(e) => setscriptPodcastLanguage(e.target.value)}
                  />
                  <span className="ml-2 text-gray-700 font-medium">Tiếng Việt</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    name="scriptPodcastLanguage"
                    value="English"
                    checked={scriptPodcastLanguage === 'English'}
                    onChange={(e) => setscriptPodcastLanguage(e.target.value)}
                  />
                  <span className="ml-2 text-gray-700 font-medium">Tiếng Anh</span>
                </label>
              </div>
              
              {/* Button 1: Generate all */}
              <button 
                onClick={handleGenerateAll}
                disabled={isGeneratingAll || !geminiApiKey}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {isGeneratingAll ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  'Tạo kịch bản, hội thoại và từ khóa bằng AI từ nội dung và chủ đề Podcast'
                )}
              </button>
            </div>

            {/* Kịch Bản Video */}
            <div>
              <label htmlFor="videoScript" className="block text-sm font-medium text-gray-700 mb-2">
                Kịch Bản Podcast
              </label>
              <textarea
                id="videoScript"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                rows={8}
                placeholder="Kịch bản video sẽ được tạo ở đây..."
                value={videoPodcastScript}
                onChange={(e) => setVideoScript(e.target.value)}
              />
            </div>
          </div>

          {/* Right side */}
          <div className="space-y-6">
            {/* Host Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="host1" className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Người Dẫn Chương Trình
                </label>
                <input
                  type="text"
                  id="host1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={host1}
                  onChange={(e) => setHost1(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="host2" className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Khách Mời
                </label>
                <input
                  type="text"
                  id="host2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={host2}
                  onChange={(e) => setHost2(e.target.value)}
                />
              </div>
            </div>

            {/* Tone */}
            <div>
              <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-2">
                Giọng Điệu
              </label>
              <select
                id="tone"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="happy">Vui vẻ</option>
                <option value="serious">Nghiêm túc</option>
                <option value="casual">Thoải mái</option>
                <option value="professional">Chuyên nghiệp</option>
              </select>
            </div>

            {/* Button 2: Generate dialogue and keywords */}
            <div>
              <button 
                onClick={handleGenerateDialogueAndKeywords}
                disabled={isGeneratingDialogueKeywords || !geminiApiKey}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {isGeneratingDialogueKeywords ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  'Tạo hội thoại, từ khóa bằng AI từ kịch bản, nội dung và chủ đề Podcast'
                )}
              </button>
            </div>

            {/* Dialogue Display */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Edit3 size={16} />
                  Hội Thoại Podcast ({dialogueItems.length} câu)
                </label>
                {dialogueItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsDialogueExpanded(true)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm transition-colors"
                    title="Mở rộng để chỉnh sửa"
                  >
                    <Maximize2 size={14} />
                    Mở rộng
                  </button>
                )}
              </div>
              
              {dialogueItems.length > 0 ? (
                <div className="max-h-96 overflow-y-auto space-y-3 border border-gray-300 rounded-lg p-4 bg-gray-50">
                  {dialogueItems.map((item, index) => (
                    <div key={item.id} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            {item.speaker}
                          </span>
                          <span className="text-xs text-gray-500">Câu {index + 1}</span>
                        </div>
                        <button
                          onClick={() => removeDialogueItem(item.id)}
                          className="text-red-400 hover:text-red-600 transition-colors p-1"
                          title="Xóa câu này"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <textarea
                        value={item.content}
                        onChange={(e) => updateDialogueItem(item.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                        rows={2}
                        placeholder="Nội dung hội thoại..."
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-8 text-center text-gray-500 bg-gray-50">
                  <Edit3 size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Hội thoại sẽ được hiển thị ở đây sau khi tạo</p>
                  <p className="text-xs mt-1">Mỗi câu có thể chỉnh sửa riêng biệt</p>
                </div>
              )}
            </div>

            {/* Từ Khóa Video */}
            <div>
              <label htmlFor="videoKeywords" className="block text-sm font-medium text-gray-700 mb-2">
                Từ Khóa Video
              </label>
              <textarea
                id="videoKeywords"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                rows={2}
                placeholder="Nhập các từ khóa liên quan đến video, cách nhau bởi dấu phẩy..."
                value={videoPodcastKeywords}
                onChange={(e) => setVideoKeywords(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dialogue Expansion Modal */}
      {isDialogueExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit3 size={20} />
                Hội Thoại Podcast ({dialogueItems.length} câu)
              </h3>
              <button
                onClick={() => setIsDialogueExpanded(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                {dialogueItems.map((item, index) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                          {item.speaker}
                        </span>
                        <span className="text-sm text-gray-500">Câu {index + 1}</span>
                      </div>
                      <button
                        onClick={() => removeDialogueItem(item.id)}
                        className="text-red-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                        title="Xóa câu này"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <textarea
                      value={item.content}
                      onChange={(e) => updateDialogueItem(item.id, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Nội dung hội thoại..."
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setIsDialogueExpanded(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Đóng và Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Three boxes in a row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          <div className="space-y-4">
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
                <option value="pexels">Pexels</option>
                <option value="pixabay">Pixabay</option>
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
                value={concatenationModePodcast}
                onChange={(e) => setConcatenationModePodcast(e.target.value)}
              >
                <option value="random">Nối ngẫu nhiên (Khuyến nghị)</option>
                <option value="sequential">Nối theo thứ tự</option>
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
                value={transitionModePodcast}
                onChange={(e) => setTransitionModePodcast(e.target.value)}
              >
                <option value="None">Không có</option>
                <option value="Shuffle">Ngẫu nhiên</option>
                <option value="FadeIn">Fade in</option>
                <option value="FadeOut">Fade out</option>
                <option value="SlideIn">Slide in</option>
                <option value="SlideOut">Slide out</option>
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
                value={aspectRatioPodcast}
                onChange={(e) => setAspectRatioPodcast(e.target.value)}
              >
                <option value="9:16">Dọc 9:16</option>
                <option value="16:9">Ngang 16:9</option>
                <option value="1:1">Vuông 1:1</option>
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
                value={maxSegmentDurationPodcast}
                onChange={(e) => setMaxSegmentDurationPodcast(Number(e.target.value))}
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
            {/* Host 1 Settings */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Giọng Người Dẫn Chương Trình</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới Tính
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={host1Gender}
                    onChange={(e) => setHost1Gender(e.target.value)}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giọng Nói
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={voice1}
                    onChange={(e) => setVoice1(e.target.value)}
                  >
                    {(host1Gender === 'Nam' ? getMaleVoices() : getFemaleVoices()).map(voice => (
                      <option key={voice} value={voice}>{voice}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Host 2 Settings */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Giọng Khách Mời</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới Tính
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={host2Gender}
                    onChange={(e) => setHost2Gender(e.target.value)}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giọng Nói
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={voice2}
                    onChange={(e) => setVoice2(e.target.value)}
                  >
                    {(host2Gender === 'Nam' ? getMaleVoices() : getFemaleVoices()).map(voice => (
                      <option key={voice} value={voice}>{voice}</option>
                    ))}
                  </select>
                </div>
              </div>
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
                Tốc Độ Giọng Đọc (1.0 để tốc độ bình thường)
              </label>
              <select
                id="voiceSpeed"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(Number(e.target.value))}
              >
                <option value="1.0">1.0</option>
                <option value="1.1">1.1</option>
                <option value="1.2">1.2</option>
                <option value="1.3">1.3</option>
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
                <option value="random">Âm Nhạc Nền Ngẫu Nhiên</option>
                <option value="none">Không có</option>
              </select>
            </div>

            {/* Âm Lượng Nhạc Nền */}
            <div>
              <label htmlFor="backgroundMusicVolume" className="block text-sm font-medium text-gray-700 mb-2">
                Âm Lượng Nhạc Nền (0.2 đến điều chỉnh cho 20%, âm nhạc không quá lớn so với giọng nói)
              </label>
              <select
                id="backgroundMusicVolume"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={backgroundMusicVolume}
                onChange={(e) => setBackgroundMusicVolume(Number(e.target.value))}
              >
                <option value="0.2">0.2</option>
                <option value="0.3">0.3</option>
                <option value="0.4">0.4</option>
                <option value="0.5">0.5</option>
              </select>
            </div>
          </div>
        </div>

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
                    <option value="edge">Dự đoán (Free, Nhanh, Độ chính xác thấp với Podcast)</option>
                    <option value="whisper_api">Open AI API (Khuyến nghị, Cần Api Key)</option>
                    <option value="whisper_local">Mô hình Local (Free, Chậm)</option>
                  </select>
                </div>

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
                    <option value="bottom">Dưới (Khuyến nghị)</option>
                    <option value="custom">Tùy chỉnh</option>
                  </select>
                </div>

                {/* Tùy chỉnh vị trí */}
                {subtitlePosition === 'custom' && (
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
                      placeholder="70"
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
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button 
          onClick={handleCreatePodcastVideo}
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
              Đang tạo video podcast...
            </>
          ) : (
            'Tạo Video Podcast'
          )}
        </button>
      </div>

      {/* Progress Display */}
      <VideoProgressDisplay 
        progress={videoProgress} 
        onStop={stopVideoCreation}
      />

      {/* Video Gallery */}
      <VideoGallery videos={completedVideos} />
    </div>
  );
};