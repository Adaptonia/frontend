'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Loader2, BookOpen, Video, Headphones, FileText, GraduationCap, File, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { LibraryModalProps, LibraryItemType, CreateLibraryItemRequest } from '@/lib/types';
import { createLibraryItem, updateLibraryItem } from '@/src/services/appwrite/libraryService';
import { useAuth } from '@/context/AuthContext';

const LibraryModal: React.FC<LibraryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = 'create'
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<LibraryItemType>('book');
  const [author, setAuthor] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState<'finance' | 'schedule' | 'career' | 'audio_books' | 'general'>('general');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  // Item types with icons
  const itemTypes = [
    { value: 'book', label: 'Book', icon: <BookOpen size={16} /> },
    { value: 'article', label: 'Article', icon: <FileText size={16} /> },
    { value: 'video', label: 'Video', icon: <Video size={16} /> },
    { value: 'podcast', label: 'Podcast', icon: <Headphones size={16} /> },
    { value: 'course', label: 'Course', icon: <GraduationCap size={16} /> },
    { value: 'document', label: 'Document', icon: <File size={16} /> },
    { value: 'other', label: 'Other', icon: <FileText size={16} /> }
  ];

  // Categories
  const categories = [
    { value: 'general', label: 'General' },
    { value: 'finance', label: 'Finance' },
    { value: 'schedule', label: 'Schedule' },
    { value: 'career', label: 'Career' },
    { value: 'audio_books', label: 'Audio Books' }
  ];

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      // Edit mode - populate form with existing data
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setType(initialData.type);
      setAuthor(initialData.author || '');
      setUrl(initialData.url || '');
      setTags(initialData.tags || '');
      setCategory(initialData.category);
      setRating(initialData.rating || 0);
      setNotes(initialData.notes || '');
      setIsFavorite(initialData.isFavorite || false);
      setIsCompleted(initialData.isCompleted || false);
    } else if (isOpen && !initialData) {
      // Create mode - reset form
      setTitle('');
      setDescription('');
      setType('book');
      setAuthor('');
      setUrl('');
      setTags('');
      setCategory('general');
      setRating(0);
      setNotes('');
      setIsFavorite(false);
      setIsCompleted(false);
    }
    
    setValidationError('');
  }, [isOpen, initialData]);

  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleSave = async () => {
    setValidationError('');
    
    if (!title.trim()) {
      setValidationError('Please enter a title');
      return;
    }

    if (!user?.id) {
      setValidationError('User not authenticated');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const itemData: CreateLibraryItemRequest = {
        title,
        description: description || undefined,
        type,
        author: author || undefined,
        url: url || undefined,
        tags: tags || undefined,
        category,
        rating: rating || 0,
        notes: notes || undefined,
        isFavorite,
        isCompleted,
        dateCompleted: isCompleted ? new Date().toISOString().split('T')[0] : undefined
      };
      
      let result;
      
      if (mode === 'edit' && initialData?.id) {
        result = await updateLibraryItem(initialData.id, itemData);
        toast.success('Library item updated successfully');
      } else {
        result = await createLibraryItem(itemData, user.id);
        toast.success('Library item added successfully');
      }
      
      onClose();
      if (onSave && result) {
        onSave(result);
      }
    } catch (error) {
      console.error('Error saving library item:', error);
      toast.error(`Failed to save library item: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star === rating ? 0 : star)}
            className={`p-1 transition-colors ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            <Star size={20} fill={star <= rating ? 'currentColor' : 'none'} />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating > 0 ? `${rating}/5` : 'No rating'}
        </span>
      </div>
    );
  };

  // Animation variants for the modal
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const slideUpVariants = {
    hidden: { y: "100%" },
    visible: { y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/35 bg-opacity-50"
            onClick={onClose}
          />
          
          {/* Modal container */}
          <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
            <motion.div 
              ref={modalRef}
              variants={slideUpVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-white rounded-t-2xl max-h-[85vh] w-full flex flex-col shadow-2xl overflow-y-auto"
            >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="text-xl font-semibold">
              {mode === 'edit' ? 'Edit Library Item' : 'Add to Library'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Rich Dad Poor Dad"
                className={`w-full p-3 border rounded-lg outline-none transition-colors ${
                  validationError ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {validationError && <p className="text-red-500 text-sm mt-1">{validationError}</p>}
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {itemTypes.map((itemType) => (
                  <button
                    key={itemType.value}
                    type="button"
                    onClick={() => setType(itemType.value as LibraryItemType)}
                    className={`p-3 border rounded-lg flex items-center gap-2 transition-colors ${
                      type === itemType.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {itemType.icon}
                    <span className="text-sm">{itemType.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Author/Creator
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Robert Kiyosaki"
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL/Link
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value as any)}
                    className={`p-3 border rounded-lg flex items-center justify-center transition-colors ${
                      category === cat.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-sm">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              {renderStarRating()}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. finance, investing, wealth"
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description or summary..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personal Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Your thoughts, key takeaways, etc..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Mark as Favorite
                </label>
                <button
                  type="button"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isFavorite ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isFavorite ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Mark as Completed
                </label>
                <button
                  type="button"
                  onClick={() => setIsCompleted(!isCompleted)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isCompleted ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="p-5 border-t">
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full py-3 text-white bg-blue-500 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:bg-blue-300 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {mode === 'edit' ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                mode === 'edit' ? 'Update Item' : 'Add to Library'
              )}
            </button>
          </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LibraryModal; 
