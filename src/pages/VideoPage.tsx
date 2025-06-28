import React, { useState } from 'react';
import { Video, Users } from 'lucide-react';
import { SingleVoiceMode } from '../components/VideoCreation/SingleVoiceMode';
import { PodcastMode } from '../components/VideoCreation/PodcastMode';

export const VideoPage: React.FC = () => {
  const [mode, setMode] = useState<'single' | 'podcast'>('single');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Tạo Video
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Chuyên Nghiệp</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tạo video chất lượng cao với AI, tùy chỉnh âm thanh và phụ đề theo ý muốn.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex">
            <button
              onClick={() => setMode('single')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                mode === 'single'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Video size={20} />
              Chế độ 1 giọng
            </button>
            <button
              onClick={() => setMode('podcast')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                mode === 'podcast'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Users size={20} />
              Chế độ Podcast
            </button>
          </div>
        </div>

        {/* Mode Content */}
        {mode === 'single' ? <SingleVoiceMode /> : <PodcastMode />}
      </main>
    </div>
  );
};

export default VideoPage;