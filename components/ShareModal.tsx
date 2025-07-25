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

    // Set canvas size
    canvas.width = 1200;
    canvas.height = 630;

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#3B82F6');
    gradient.addColorStop(1, '#1E40AF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add app logo/name
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎯 Adaptonia', canvas.width / 2, 80);

    // Add goal pack title
    ctx.font = 'bold 36px Arial';
    ctx.fillText(goalPack?.title || '', canvas.width / 2, 160);

    // Add description
    if (goalPack?.description) {
      ctx.font = '20px Arial';
      const words = goalPack.description.split(' ');
      let line = '';
      let y = 220;
      const maxWidth = canvas.width - 100;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, canvas.width / 2, y);
          line = words[i] + ' ';
          y += 30;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, canvas.width / 2, y);
    }

    // Add category and user type
    ctx.font = '18px Arial';
    ctx.fillText(`Category: ${goalPack?.category || 'N/A'} • For: ${goalPack?.targetUserType || 'N/A'}`, canvas.width / 2, 350);

    // Add call to action
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Start Your Journey Today!', canvas.width / 2, 400);

    // Add QR code placeholder
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(canvas.width - 150, canvas.height - 150, 120, 120);
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText('Scan to', canvas.width - 90, canvas.height - 120);
    ctx.fillText('get started', canvas.width - 90, canvas.height - 100);

    // Add website
    ctx.font = '16px Arial';
    ctx.fillText('adaptonia.com', canvas.width / 2, canvas.height - 50);

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