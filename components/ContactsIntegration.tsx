'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Phone, 
  Mail, 
  X, 
  UserPlus, 
  MessageSquare,
  Check,
  AlertCircle
} from 'lucide-react'

interface Contact {
  id: string
  name: string
  phoneNumbers?: string[]
  emailAddresses?: string[]
  selected?: boolean
}

interface NativeContact {
  name?: string[]
  tel?: string[]
  email?: string[]
}

interface ContactsIntegrationProps {
  isOpen: boolean
  onClose: () => void
  onContactsImported?: (contacts: Contact[]) => void
}

const ContactsIntegration: React.FC<ContactsIntegrationProps> = ({
  isOpen,
  onClose,
  onContactsImported
}) => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'permission' | 'import' | 'select' | 'invite'>('permission')
  const [inviteMessage, setInviteMessage] = useState(
    "Hey! I'm using Adaptonia Finance for team collaboration. Join me: https://adaptonia.app/invite"
  )
  const [sendingInvites, setSendingInvites] = useState(false)

  // Check if Contacts API is supported
  const isContactsAPISupported = () => {
    return 'contacts' in navigator && 'ContactsManager' in window
  }

  // Request contacts permission and import
  const importContacts = async () => {
    if (!isContactsAPISupported()) {
      setError('Contacts API is not supported in this browser. Please use a compatible mobile browser.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Check permission
      const permission = await navigator.permissions.query({ name: 'contacts' as PermissionName })
      
      if (permission.state === 'denied') {
        setError('Contacts permission was denied. Please enable it in your browser settings.')
        setLoading(false)
        return
      }

      // Request contacts access
      const props = ['name', 'tel', 'email']
      const opts = { multiple: true }
      
      const contactList = await (navigator as unknown as { contacts: { select: (props: string[], opts: { multiple: boolean }) => Promise<NativeContact[]> } }).contacts.select(props, opts)
      
      // Transform contacts to our format
      const transformedContacts: Contact[] = contactList.map((contact: NativeContact, index: number) => ({
        id: `contact_${index}`,
        name: contact.name?.[0] || 'Unknown Contact',
        phoneNumbers: contact.tel || [],
        emailAddresses: contact.email || []
      }))

      setContacts(transformedContacts)
      setStep('select')
    } catch (err: unknown) {
      console.error('Error importing contacts:', err)
      setError('Failed to import contacts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Toggle contact selection
  const toggleContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts)
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId)
    } else {
      newSelected.add(contactId)
    }
    setSelectedContacts(newSelected)
  }

  // Send SMS invites
  const sendInvites = async () => {
    if (selectedContacts.size === 0) return

    setSendingInvites(true)
    
    try {
      const selectedContactsList = contacts.filter(c => selectedContacts.has(c.id))
      
      // Check if Web Share API is available for SMS
      if (navigator.share) {
        for (const contact of selectedContactsList) {
          if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            try {
              await navigator.share({
                title: 'Join Adaptonia Finance',
                text: inviteMessage,
                url: 'https://adaptonia.app/invite'
              })
            } catch {
              console.log('Share cancelled or failed for:', contact.name)
            }
          }
        }
      } else {
        // Fallback: Open SMS app with pre-filled message
        for (const contact of selectedContactsList) {
          if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            const phoneNumber = contact.phoneNumbers[0]
            const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(inviteMessage)}`
            window.open(smsUrl, '_blank')
          }
        }
      }

      // Mark as sent and close
      onContactsImported?.(selectedContactsList)
      setStep('invite')
      
    } catch (err) {
      console.error('Error sending invites:', err)
      setError('Failed to send invites. Please try again.')
    } finally {
      setSendingInvites(false)
    }
  }

  // Reset modal state
  const resetModal = () => {
    setContacts([])
    setSelectedContacts(new Set())
    setError(null)
    setStep('permission')
    setLoading(false)
    setSendingInvites(false)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Invite Contacts</h2>
                <p className="text-sm text-gray-500">
                  {step === 'permission' && 'Import contacts to send invites'}
                  {step === 'import' && 'Importing your contacts...'}
                  {step === 'select' && `Select contacts to invite (${contacts.length} found)`}
                  {step === 'invite' && 'Invites sent successfully!'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            {/* Permission Step */}
            {step === 'permission' && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Phone className="w-8 h-8 text-blue-600" />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Access Your Contacts</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    We&lsquo;ll help you invite friends and colleagues to join Adaptonia Finance. 
                    Your contact information stays private and secure.
                  </p>
                </div>

                {!isContactsAPISupported() && (
                  <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
                      Contacts API is not supported in this browser. Please use a compatible mobile browser.
                    </p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={importContacts}
                    disabled={loading || !isContactsAPISupported()}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        <span>Import Contacts</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Select Contacts Step */}
            {step === 'select' && (
              <div className="space-y-4">
                {/* Invite Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invite Message
                  </label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Customize your invite message..."
                  />
                </div>

                {/* Contacts List */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Contacts ({selectedContacts.size} selected)
                  </label>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`flex items-center space-x-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                          selectedContacts.has(contact.id) ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => toggleContact(contact.id)}
                      >
                        <div className={`w-5 h-5 border-2 rounded ${
                          selectedContacts.has(contact.id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        } flex items-center justify-center`}>
                          {selectedContacts.has(contact.id) && (
                            <Check size={12} className="text-white" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{contact.name}</div>
                          <div className="text-sm text-gray-500">
                            {contact.phoneNumbers?.[0] && (
                              <span className="flex items-center space-x-1">
                                <Phone size={12} />
                                <span>{contact.phoneNumbers[0]}</span>
                              </span>
                            )}
                            {contact.emailAddresses?.[0] && (
                              <span className="flex items-center space-x-1">
                                <Mail size={12} />
                                <span>{contact.emailAddresses[0]}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendInvites}
                    disabled={selectedContacts.size === 0 || sendingInvites}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {sendingInvites ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare size={16} />
                        <span>Send Invites ({selectedContacts.size})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Success Step */}
            {step === 'invite' && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Invites Sent!</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Your invites have been sent to {selectedContacts.size} contacts. 
                    They&lsquo;ll receive a link to join Adaptonia Finance.
                  </p>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ContactsIntegration 