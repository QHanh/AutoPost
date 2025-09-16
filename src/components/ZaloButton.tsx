import React from 'react';
import { useLocation } from 'react-router-dom';
import zaloIcon from '../assets/zalo-icon.png';

export const ZaloButton: React.FC = () => {
  const location = useLocation();
  if (location.pathname.startsWith('/chatbot-tabs')) {
    return null;
  }
  return (
    <a
      href="https://zalo.me/0888822522"
      target="_blank"
      rel="noopener noreferrer"
      className="hidden md:flex fixed bottom-28 right-6 bg-white text-white w-16 h-16 rounded-full shadow-2xl items-center justify-center transform hover:scale-110 transition-transform z-50"
      aria-label="Contact us on Zalo"
    >
      <img src={zaloIcon} alt="Zalo Icon" className="w-full h-full rounded-full" />
    </a>
  );
};