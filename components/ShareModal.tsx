'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Share2, 
  MessageCircle, 
  Twitter, 
  Copy, 
  Download,
  ExternalLink,
  Check
} from 'lucide-react';
import { GoalPack, GoalPackWithStats } from '@/lib/types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalPack: GoalPack | GoalPackWithStats | null;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  goalPack
}) => {
  const [copied, setCopied] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'story' | 'post'>('story');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Set share URL after component mounts (client-side only)
  useEffect(() => {
    if (goalPack?.id) {
      setShareUrl(`${window.location.origin}/share/goalpack/${goalPack.id}`);
    }
  }, [goalPack?.id]);

  const shareData = {
    title: `Check out this goal pack: ${goalPack?.title}`,
    text: goalPack?.description || `Transform your dreams into achievable goals with ${goalPack?.title}`,
    url: shareUrl
  };

  const handleWhatsAppShare = () => {
    if (!shareUrl) return;
    const text = encodeURIComponent(`${shareData.title}\n\n${shareData.text}\n\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleWhatsAppStatusShare = () => {
    if (!shareUrl) return;
    const text = encodeURIComponent(`${shareData.title}\n\n${shareData.text}\n\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTelegramShare = () => {
    if (!shareUrl) return;
    const text = encodeURIComponent(`${shareData.title}\n\n${shareData.text}\n\n${shareUrl}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareData.title)}`, '_blank');
  };

  const handleTwitterShare = () => {
    if (!shareUrl) return;
    const text = encodeURIComponent(`${shareData.title}\n\n${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const generateShareImage = async () => {
    if (!canvasRef.current) return;
    
    setGeneratingImage(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (selectedStyle === 'story') {
      // Instagram Story style (9:16 aspect ratio)
      canvas.width = 1080;
      canvas.height = 1920;
      
      // Create dark gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#1a1a1a');
      gradient.addColorStop(1, '#2d2d2d');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add subtle pattern overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      for (let i = 0; i < canvas.width; i += 40) {
        for (let j = 0; j < canvas.height; j += 40) {
          ctx.fillRect(i, j, 1, 1);
        }
      }

      // Create main content card
      const cardWidth = canvas.width - 80;
      const cardHeight = canvas.height - 200;
      const cardX = 40;
      const cardY = 100;

      // Card background
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

      // Add subtle border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);

      // Add user photo at the top (like Spotify share cards)
      const photoAreaHeight = cardHeight * 0.4;
      const photoAreaY = cardY;
      
      // Load and draw user photo
      const img = new Image();
      img.onload = () => {
        // Calculate aspect ratio to fit properly
        const aspectRatio = img.width / img.height;
        const photoWidth = cardWidth;
        const photoHeight = photoWidth / aspectRatio;
        
        // Center the photo and crop if needed
        const drawX = cardX;
        const drawY = photoAreaY;
        const drawWidth = photoWidth;
        const drawHeight = Math.min(photoHeight, photoAreaHeight);
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        
        // Add gradient overlay for text readability
        const gradient = ctx.createLinearGradient(0, photoAreaY, 0, photoAreaY + photoAreaHeight);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        ctx.fillStyle = gradient;
        ctx.fillRect(cardX, photoAreaY, cardWidth, photoAreaHeight);
      };
      img.src = '/icons/goalpark.png'; // Use a fixed image for the photo area

      // Add motivational background pattern (only in text area)
      ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(cardX + Math.random() * cardWidth, cardY + photoAreaHeight + Math.random() * (cardHeight - photoAreaHeight), 50 + Math.random() * 100, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add goal pack title (positioned over photo or in text area)
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(goalPack?.title || 'Achieve Your Goals', canvas.width / 2, cardY + photoAreaHeight + 100);

      // Add description text
      if (goalPack?.description) {
        ctx.font = '24px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        const words = goalPack.description.split(' ');
        let line = '';
        let y = cardY + photoAreaHeight + 180;
        const maxWidth = cardWidth - 60;
        
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, canvas.width / 2, y);
            line = words[i] + ' ';
            y += 35;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, canvas.width / 2, y);
      }

      // Add progress indicator
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(cardX + 60, cardY + cardHeight - 120, cardWidth - 120, 8);
      
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(cardX + 60, cardY + cardHeight - 120, (cardWidth - 120) * 0.7, 8);

      // Add progress text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Day 3 of Goal Journey', canvas.width / 2, cardY + cardHeight - 80);

      // Add category badge (positioned over photo)
      const categoryText = goalPack?.category || 'Goal';
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(cardX + 60, cardY + 60, 120, 40);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(categoryText.charAt(0).toUpperCase() + categoryText.slice(1), cardX + 80, cardY + 85);

      // Add Adaptonia branding
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🎯 adaptonia', canvas.width / 2, canvas.height - 80);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '18px Arial';
      ctx.fillText('Transform dreams into achievable goals', canvas.width / 2, canvas.height - 50);

    } else {
      // Social media post style (1:1 aspect ratio)
      canvas.width = 1080;
      canvas.height = 1080;
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#3B82F6');
      gradient.addColorStop(1, '#1E40AF');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add content area
      const contentWidth = canvas.width - 100;
      const contentHeight = canvas.height - 200;
      const contentX = 50;
      const contentY = 100;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(contentX, contentY, contentWidth, contentHeight);

      // Add user photo at the top
      const photoAreaHeight = contentHeight * 0.5;
      const photoAreaY = contentY;
      
      // Load and draw user photo
      const img = new Image();
      img.onload = () => {
        // Calculate aspect ratio to fit properly
        const aspectRatio = img.width / img.height;
        const photoWidth = contentWidth;
        const photoHeight = photoWidth / aspectRatio;
        
        // Center the photo and crop if needed
        const drawX = contentX;
        const drawY = photoAreaY;
        const drawWidth = photoWidth;
        const drawHeight = Math.min(photoHeight, photoAreaHeight);
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        
        // Add gradient overlay for text readability
        const gradient = ctx.createLinearGradient(0, photoAreaY, 0, photoAreaY + photoAreaHeight);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        ctx.fillStyle = gradient;
        ctx.fillRect(contentX, photoAreaY, contentWidth, photoAreaHeight);
      };
      img.src = '/icons/goalpark.png'; // Use a fixed image for the photo area

      // Add goal pack title
      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(goalPack?.title || 'Achieve Your Goals', canvas.width / 2, contentY + photoAreaHeight + 60);

      // Add description
      if (goalPack?.description) {
        ctx.font = '16px Arial';
        ctx.fillStyle = '#6B7280';
        
        const words = goalPack.description.split(' ');
        let line = '';
        let y = contentY + photoAreaHeight + 100;
        const maxWidth = contentWidth - 40;
        
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, canvas.width / 2, y);
            line = words[i] + ' ';
            y += 22;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, canvas.width / 2, y);
      }

      // Add category and user type
      ctx.fillStyle = '#3B82F6';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${goalPack?.category || 'Goal'} • For ${goalPack?.targetUserType === 'all' ? 'All Users' : goalPack?.targetUserType}`, canvas.width / 2, contentY + contentHeight - 40);

      // Add call to action
      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('Start Your Journey Today!', canvas.width / 2, contentY + contentHeight - 10);

      // Add Adaptonia branding
      ctx.fillStyle = '#3B82F6';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('🎯 adaptonia', canvas.width / 2, canvas.height - 20);
    }

    setGeneratingImage(false);
  };

  const handleDownloadImage = async () => {
    if (!canvasRef.current) return;
    
    await generateShareImage();
    
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `goalpack-${goalPack?.id}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      onClick: handleWhatsAppShare
    },
    {
      name: 'WhatsApp Status',
      icon: MessageCircle,
      color: 'bg-green-600 hover:bg-green-700',
      onClick: handleWhatsAppStatusShare
    },
    {
      name: 'Telegram',
      icon: MessageCircle,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: handleTelegramShare
    },
    {
      name: 'Twitter/X',
      icon: Twitter,
      color: 'bg-black hover:bg-gray-800',
      onClick: handleTwitterShare
    },
    {
      name: copied ? 'Copied!' : 'Copy Link',
      icon: copied ? Check : Copy,
      color: copied ? 'bg-green-500' : 'bg-gray-500 hover:bg-gray-600',
      onClick: handleCopyLink
    },
    {
      name: 'Download Image',
      icon: Download,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: handleDownloadImage
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && goalPack && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Share2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Share Goal Pack</h2>
                      <p className="text-sm text-gray-500">Spread the word about this amazing goal pack</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Style Selector */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Choose Format:</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedStyle('story')}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedStyle === 'story'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-8 h-12 bg-gray-300 rounded mx-auto mb-2"></div>
                        <span className="text-xs font-medium">Story (9:16)</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setSelectedStyle('post')}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedStyle === 'post'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-10 h-10 bg-gray-300 rounded mx-auto mb-2"></div>
                        <span className="text-xs font-medium">Post (1:1)</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Share Image Preview:</h3>
                  <div className="space-y-3">
                    <div className="relative">
                      <img 
                        src="/icons/goalpark.png" 
                        alt="Goal pack share image" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Goal Pack Preview */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">{goalPack?.title}</h3>
                  {goalPack?.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{goalPack.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="capitalize">{goalPack?.category || 'N/A'}</span>
                    <span>•</span>
                    <span>For {goalPack?.targetUserType || 'N/A'}</span>
                  </div>
                </div>

                {/* Share Options */}
                <div className="grid grid-cols-2 gap-3">
                  {shareOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={option.onClick}
                      disabled={generatingImage || !shareUrl}
                      className={`${option.color} text-white p-4 rounded-lg flex flex-col items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105`}
                    >
                      <option.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{option.name}</span>
                    </button>
                  ))}
                </div>

                {/* Preview Link */}
                <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ExternalLink className="w-4 h-4" />
                    <span>Preview Link:</span>
                  </div>
                  {shareUrl ? (
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm break-all mt-1 block"
                    >
                      {shareUrl}
                    </a>
                  ) : (
                    <div className="text-gray-400 text-sm mt-1">
                      Loading...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Hidden canvas for image generation */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default ShareModal; 
