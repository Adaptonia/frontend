'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Phone, 
  Mail, 
  X, 
  UserPlus, 
  MessageSquare,
  Check,
  AlertCircle,
  Download,
  Share2,
  Smartphone
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
  
  // PWA-specific states
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Manual contact entry
  const [manualContact, setManualContact] = useState({ name: '', phone: '', email: '' })

  // PWA: Check if app is installable and handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // PWA: Trigger install prompt
  const handleInstallApp = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setIsInstallable(false)
    }
    setDeferredPrompt(null)
  }

  // Check if Contacts API is supported
  const isContactsAPISupported = () => {
    return 'contacts' in navigator && 'ContactsManager' in window
  }

  // PWA: Enhanced Web Share API usage
  const canUseWebShare = () => {
    return 'share' in navigator
  }

  // PWA: Check if running in standalone mode
  const isStandaloneMode = () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
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

  // PWA: Enhanced invite sending with Web Share API and offline support
  const sendInvites = async () => {
    if (selectedContacts.size === 0) return

    setSendingInvites(true)
    
    try {
      const selectedContactsList = contacts.filter(c => selectedContacts.has(c.id))
      
      // PWA: Enhanced Web Share API usage
      if (canUseWebShare()) {
        for (const contact of selectedContactsList) {
          if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            try {
              // Try sharing with more specific data
              await navigator.share({
                title: 'Join Adaptonia Finance',
                text: `Hi ${contact.name}! ${inviteMessage}`,
                url: 'https://adaptonia.app/invite'
              })
              
              // PWA: Store successful share for analytics/tracking
              if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  type: 'INVITE_SENT',
                  data: { contactId: contact.id, method: 'webshare' }
                })
              }
            } catch (shareError) {
              console.log('Share cancelled or failed for:', contact.name)
              // Fallback to SMS if share fails
              await fallbackToSMS(contact)
            }
          }
        }
      } else {
        // Fallback: Enhanced SMS handling for PWA
        for (const contact of selectedContactsList) {
          await fallbackToSMS(contact)
        }
      }

      // PWA: Store invites in IndexedDB for offline sync
      await storeInvitesOffline(selectedContactsList)

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

  // PWA: Fallback SMS function
  const fallbackToSMS = async (contact: Contact) => {
    if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) return

    const phoneNumber = contact.phoneNumbers[0]
    const personalizedMessage = `Hi ${contact.name}! ${inviteMessage}`
    
    // Try different SMS URL schemes for better PWA compatibility
    const smsUrls = [
      `sms:${phoneNumber}?body=${encodeURIComponent(personalizedMessage)}`,
      `sms:${phoneNumber}&body=${encodeURIComponent(personalizedMessage)}`,
      `sms://${phoneNumber}?body=${encodeURIComponent(personalizedMessage)}`
    ]

    // Try each URL scheme
    for (const smsUrl of smsUrls) {
      try {
        window.open(smsUrl, '_blank')
        break
      } catch {
        continue
      }
    }
  }

  // PWA: Store invites offline for background sync
  const storeInvitesOffline = async (invitedContacts: Contact[]) => {
    if (!('indexedDB' in window)) return

    try {
      const dbRequest = indexedDB.open('AdaptoniaContacts', 1)
      
      dbRequest.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('invites')) {
          db.createObjectStore('invites', { keyPath: 'id', autoIncrement: true })
        }
      }

      dbRequest.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction(['invites'], 'readwrite')
        const store = transaction.objectStore('invites')
        
        invitedContacts.forEach(contact => {
          store.add({
            contactId: contact.id,
            contactName: contact.name,
            invitedAt: new Date().toISOString(),
            status: 'sent',
            synced: isOnline
          })
        })
      }
    } catch (error) {
      console.error('Failed to store invites offline:', error)
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

  const addManualContact = () => {
    if (!manualContact.name.trim()) return

    const newContact: Contact = {
      id: `manual_${Date.now()}`,
      name: manualContact.name.trim(),
      phoneNumbers: manualContact.phone.trim() ? [manualContact.phone.trim()] : [],
      emailAddresses: manualContact.email.trim() ? [manualContact.email.trim()] : []
    }

    setContacts(prev => [...prev, newContact])
    setManualContact({ name: '', phone: '', email: '' })
    
    if (contacts.length === 0) {
      setStep('select')
    }
  }

  // File upload for vCard files
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (file.name.endsWith('.vcf') || file.type === 'text/vcard') {
        parseVCardContent(content)
      } else if (file.name.endsWith('.csv')) {
        parseCSVContent(content)
      }
    }
    reader.readAsText(file)
  }

  // Simple vCard parser
  const parseVCardContent = (content: string) => {
    const vcards = content.split('BEGIN:VCARD')
    const newContacts: Contact[] = []

    vcards.forEach((vcard, index) => {
      if (!vcard.trim()) return

      const lines = vcard.split('\n')
      let name = ''
      const phones: string[] = []
      const emails: string[] = []

      lines.forEach(line => {
        if (line.startsWith('FN:')) name = line.substring(3).trim()
        if (line.startsWith('TEL:')) phones.push(line.substring(4).trim())
        if (line.startsWith('EMAIL:')) emails.push(line.substring(6).trim())
      })

      if (name) {
        newContacts.push({
          id: `imported_${Date.now()}_${index}`,
          name,
          phoneNumbers: phones,
          emailAddresses: emails
        })
      }
    })

    setContacts(prev => [...prev, ...newContacts])
    if (newContacts.length > 0) {
      setStep('select')
    }
  }

  // Simple CSV parser (Name, Phone, Email format)
  const parseCSVContent = (content: string) => {
    const lines = content.split('\n')
    const newContacts: Contact[] = []

    lines.forEach((line, index) => {
      if (index === 0) return // Skip header
      const [name, phone, email] = line.split(',').map(s => s.trim().replace(/"/g, ''))
      
      if (name) {
        newContacts.push({
          id: `csv_${Date.now()}_${index}`,
          name,
          phoneNumbers: phone ? [phone] : [],
          emailAddresses: email ? [email] : []
        })
      }
    })

    setContacts(prev => [...prev, ...newContacts])
    if (newContacts.length > 0) {
      setStep('select')
    }
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
          className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
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

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-6">{/* Permission Step */}
            {step === 'permission' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-blue-600" />
                  </div>
                  
                  <h3 className="text-lg font-medium mb-2">Add Contacts to Invite</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Invite friends and colleagues to join Adaptonia Finance. 
                    Choose your preferred method below.
                  </p>
                </div>

                {/* PWA: Offline indicator */}
                {!isOnline && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <span className="text-orange-800 text-sm font-medium">
                        You're offline - contacts will be saved locally and synced when online
                      </span>
                    </div>
                  </div>
                )}

                {/* PWA: Install prompt for better contact access */}
                {isInstallable && !isStandaloneMode() && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-900 mb-1">Install App for Better Experience</h4>
                        <p className="text-sm text-blue-700 mb-3">
                          Install Adaptonia as an app for easier contact sharing and offline access.
                        </p>
                        <button
                          onClick={handleInstallApp}
                          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          <Download size={14} className="inline mr-1" />
                          Install App
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Method 1: Native Contacts API */}
                {isContactsAPISupported() ? (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium">📱 Import from Device</h4>
                      {isStandaloneMode() && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          PWA Enhanced
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Access your device contacts directly
                      {isStandaloneMode() && " with enhanced PWA integration"}
                    </p>
                    <button
                      onClick={importContacts}
                      disabled={loading}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
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
                ) : (
                  <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <h4 className="font-medium text-yellow-800">Device Import Unavailable</h4>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Contact import is only supported on mobile browsers. Use the methods below instead.
                    </p>
                  </div>
                )}

                {/* Method 2: Manual Entry */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium mb-2">✍️ Add Manually</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={manualContact.name}
                      onChange={(e) => setManualContact(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={manualContact.phone}
                      onChange={(e) => setManualContact(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={manualContact.email}
                      onChange={(e) => setManualContact(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={addManualContact}
                      disabled={!manualContact.name.trim()}
                      className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Contact
                    </button>
                  </div>
                </div>

                {/* Method 3: File Upload */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium">📁 Upload File</h4>
                    {canUseWebShare() && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Share Enabled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Support for .vcf (vCard) and .csv files
                    {canUseWebShare() && ". Files can be shared from other apps."}
                  </p>
                  <input
                    type="file"
                    accept=".vcf,.csv,text/vcard,text/csv"
                    onChange={handleFileUpload}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Show added contacts count */}
                {contacts.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-800 font-medium">
                        {contacts.length} contact(s) added
                        {!isOnline && " (saved offline)"}
                      </span>
                      <button
                        onClick={() => setStep('select')}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Continue →
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="Customize your invite message..."
                  />
                </div>

                {/* Contacts List */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Contacts ({selectedContacts.size} selected)
                  </label>
                  <div className="max-h-72 min-h-[200px] overflow-y-auto overscroll-contain border border-gray-200 rounded-lg bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {contacts.map((contact, index) => (
                      <div
                        key={contact.id}
                        className={`flex items-center space-x-3 p-3 cursor-pointer hover:bg-gray-100 transition-colors ${
                          index !== contacts.length - 1 ? 'border-b border-gray-200' : ''
                        } ${
                          selectedContacts.has(contact.id) ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white'
                        }`}
                        onClick={() => toggleContact(contact.id)}
                      >
                        <div className={`w-5 h-5 border-2 rounded ${
                          selectedContacts.has(contact.id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        } flex items-center justify-center flex-shrink-0`}>
                          {selectedContacts.has(contact.id) && (
                            <Check size={12} className="text-white" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{contact.name}</div>
                          <div className="text-sm text-gray-500 space-y-1">
                            {contact.phoneNumbers?.[0] && (
                              <div className="flex items-center space-x-1">
                                <Phone size={12} className="flex-shrink-0" />
                                <span className="truncate">{contact.phoneNumbers[0]}</span>
                              </div>
                            )}
                            {contact.emailAddresses?.[0] && (
                              <div className="flex items-center space-x-1">
                                <Mail size={12} className="flex-shrink-0" />
                                <span className="truncate">{contact.emailAddresses[0]}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {contacts.length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No contacts added yet</p>
                        <button
                          onClick={() => setStep('permission')}
                          className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          ← Go back to add contacts
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Scroll indicator for long lists */}
                  {contacts.length > 5 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Scroll to see all {contacts.length} contacts
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4 border-t">
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
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ContactsIntegration 
