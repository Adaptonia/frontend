'use client';

import React from 'react';
import { BookOpen, Video, Headphones, FileText, GraduationCap, File, Star, Heart, ExternalLink, Edit3, Trash2, Check } from 'lucide-react';
import { LibraryItem, LibraryItemType } from '@/lib/types';

interface LibraryItemProps {
  item: LibraryItem;
  onEdit: (item: LibraryItem) => void;
  onDelete: (itemId: string) => void;
  onToggleFavorite: (itemId: string) => void;
  onToggleComplete: (itemId: string) => void;
}

const LibraryItemComponent: React.FC<LibraryItemProps> = ({
  item,
  onEdit,
  onDelete,
  onToggleFavorite,
  onToggleComplete
}) => {
  const getTypeIcon = (type: LibraryItemType) => {
    const iconProps = { size: 16, className: "text-gray-600" };
    
    switch (type) {
      case 'book':
        return <BookOpen {...iconProps} />;
      case 'video':
        return <Video {...iconProps} />;
      case 'podcast':
        return <Headphones {...iconProps} />;
      case 'course':
        return <GraduationCap {...iconProps} />;
      case 'document':
        return <File {...iconProps} />;
      case 'article':
        return <FileText {...iconProps} />;
      default:
        return <FileText {...iconProps} />;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={12}
            className={star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className={`bg-white rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${
      item.isCompleted ? 'bg-green-50 border-green-200' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          {/* Type Icon */}
          <div className="mt-1">
            {getTypeIcon(item.type)}
          </div>
          
          {/* Title and Author */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-gray-900 line-clamp-2 ${
              item.isCompleted ? 'line-through text-gray-600' : ''
            }`}>
              {item.title}
            </h3>
            {item.author && (
              <p className="text-sm text-gray-600 mt-1">by {item.author}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 ml-2">
          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item.id);
            }}
            className={`p-2 rounded-full transition-colors ${
              item.isFavorite 
                ? 'text-red-500 hover:bg-red-50' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={16} fill={item.isFavorite ? 'currentColor' : 'none'} />
          </button>

          {/* Complete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(item.id);
            }}
            className={`p-2 rounded-full transition-colors ${
              item.isCompleted 
                ? 'text-green-500 hover:bg-green-50' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title={item.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            <Check size={16} />
          </button>

          {/* Edit Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            title="Edit item"
          >
            <Edit3 size={16} />
          </button>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-2 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Delete item"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {item.description}
        </p>
      )}

      {/* Rating */}
      {item.rating && item.rating > 0 && (
        <div className="flex items-center gap-2 mb-3">
          {renderStars(item.rating)}
          <span className="text-xs text-gray-500">{item.rating}/5</span>
        </div>
      )}

      {/* Tags */}
      {item.tags && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.split(',').map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
            >
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span className="capitalize">{item.type}</span>
          <span className="capitalize">{item.category}</span>
          {item.dateCompleted && (
            <span className="text-green-600">
              Completed {formatDate(item.dateCompleted)}
            </span>
          )}
        </div>

        {/* URL Link */}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-blue-500 hover:text-blue-700 transition-colors"
            title="Open link"
          >
            <ExternalLink size={12} />
            <span>Link</span>
          </a>
        )}
      </div>

      {/* Notes Preview */}
      {item.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-600 line-clamp-2">
            <span className="font-medium">Notes:</span> {item.notes}
          </p>
        </div>
      )}
    </div>
  );
};

export default LibraryItemComponent; 