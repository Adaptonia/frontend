'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  GraduationCap, 
  Briefcase, 
  Search, 
  Plus,
  ArrowLeft,
  Building,
  MapPin,
  Users
} from 'lucide-react';
import { UserTypeSelectionModalProps, UserType, SchoolSelectionData } from '@/lib/types';
import { searchInstitutions, getInstitutionsByType } from '@/lib/data/nigerian-institutions';

type ModalStep = 'user-type' | 'school-selection';

const UserTypeSelectionModal: React.FC<UserTypeSelectionModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState<ModalStep>('user-type');
  const [selectedUserType, setSelectedUserType] = useState<UserType>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<SchoolSelectionData | null>(null);
  const [showCustomSchool, setShowCustomSchool] = useState(false);
  const [customSchoolName, setCustomSchoolName] = useState('');
  const [filteredInstitutions, setFilteredInstitutions] = useState<SchoolSelectionData[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'university' | 'polytechnic' | 'college'>('all');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('user-type');
      setSelectedUserType(null);
      setSearchQuery('');
      setSelectedSchool(null);
      setShowCustomSchool(false);
      setCustomSchoolName('');
      setSelectedFilter('all');
    }
  }, [isOpen]);

  // Filter institutions based on search and type
  useEffect(() => {
    let institutions = searchInstitutions(searchQuery);
    
    if (selectedFilter !== 'all') {
      institutions = getInstitutionsByType(selectedFilter);
      if (searchQuery) {
        institutions = institutions.filter(inst => 
          inst.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
    }
    
    setFilteredInstitutions(institutions.slice(0, 50)); // Limit to 50 results for performance
  }, [searchQuery, selectedFilter]);

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { type: "spring", damping: 25, stiffness: 300 }
    },
    exit: { scale: 0.8, opacity: 0 }
  };

  const slideVariants = {
    hidden: { x: 300, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 }
  };

  const handleUserTypeSelection = (userType: UserType) => {
    setSelectedUserType(userType);
    
    if (userType === 'non-student') {
      // Complete immediately for non-students
      onComplete(userType);
    } else {
      // Move to school selection for students
      setCurrentStep('school-selection');
    }
  };

  const handleSchoolSelection = (school: SchoolSelectionData) => {
    setSelectedSchool(school);
    setShowCustomSchool(false);
    setCustomSchoolName('');
  };

  const handleCustomSchoolSubmit = () => {
    if (customSchoolName.trim()) {
      onComplete('student', customSchoolName.trim());
    }
  };

  const handleSchoolConfirmation = () => {
    if (selectedSchool) {
      onComplete('student', selectedSchool.name);
    } else if (showCustomSchool && customSchoolName.trim()) {
      handleCustomSchoolSubmit();
    }
  };

  const renderUserTypeStep = () => (
    <motion.div
      variants={slideVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="p-6"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about yourself</h2>
        <p className="text-gray-600">This helps us personalize your experience</p>
      </div>

      {/* User Type Options */}
      <div className="space-y-4 mb-8">
        {/* Student Option */}
        <motion.button
          onClick={() => handleUserTypeSelection('student')}
          className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900">I&apos;m a Student</h3>
              <p className="text-gray-600">Currently enrolled in a higher institution</p>
            </div>
          </div>
        </motion.button>

        {/* Non-Student Option */}
        <motion.button
          onClick={() => handleUserTypeSelection('non-student')}
          className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-200 transition-colors">
              <Briefcase className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900">I&apos;m not a Student</h3>
              <p className="text-gray-600">Working professional or other</p>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Skip Option */}
      <div className="text-center">
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-sm font-medium"
        >
          I&apos;ll do this later
        </button>
      </div>
    </motion.div>
  );

  const renderSchoolSelectionStep = () => (
    <motion.div
      variants={slideVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center mb-4">
          <button
            onClick={() => setCurrentStep('user-type')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Select your institution</h2>
            <p className="text-gray-600">Choose from Nigerian higher institutions</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search for your school..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'All', icon: Building },
            { key: 'university', label: 'Universities', icon: GraduationCap },
            { key: 'polytechnic', label: 'Polytechnics', icon: Building },
            { key: 'college', label: 'Colleges', icon: Users }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedFilter(key as any)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedFilter === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Schools List */}
      <div className="flex-1 overflow-y-auto p-6">
        {!showCustomSchool ? (
          <div className="space-y-2">
            {filteredInstitutions.map((institution, index) => (
              <motion.button
                key={`${institution.name}-${index}`}
                onClick={() => handleSchoolSelection(institution)}
                className={`w-full p-4 text-left border rounded-lg transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 ${
                  selectedSchool?.name === institution.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{institution.name}</h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{institution.location}</span>
                      <span className="mx-2">•</span>
                      <span className="capitalize">{institution.type}</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}

            {/* Add Custom School Option */}
            <motion.button
              onClick={() => setShowCustomSchool(true)}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center text-gray-600 group-hover:text-blue-600">
                <Plus className="w-5 h-5 mr-2" />
                <span className="font-medium">My school is not listed</span>
              </div>
            </motion.button>

            {filteredInstitutions.length === 0 && searchQuery && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No schools found</h3>
                <p className="text-gray-600 mb-4">Try a different search term or add your school manually.</p>
                <button
                  onClick={() => setShowCustomSchool(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add my school
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Custom School Input */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Add your institution</h3>
              <p className="text-gray-600">Enter the name of your school</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution Name
              </label>
              <input
                type="text"
                value={customSchoolName}
                onChange={(e) => setCustomSchoolName(e.target.value)}
                placeholder="e.g., My University Name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCustomSchool(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to list
              </button>
              <button
                onClick={handleCustomSchoolSubmit}
                disabled={!customSchoolName.trim()}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Continue Button */}
      {selectedSchool && !showCustomSchool && (
        <div className="p-6 border-t">
          <motion.button
            onClick={handleSchoolConfirmation}
            className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Continue with {selectedSchool.name}
          </motion.button>
        </div>
      )}
    </motion.div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Modal Content */}
          <AnimatePresence mode="wait">
            {currentStep === 'user-type' ? (
              <motion.div key="user-type">
                {renderUserTypeStep()}
              </motion.div>
            ) : (
              <motion.div key="school-selection" className="h-full">
                {renderSchoolSelectionStep()}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserTypeSelectionModal; 