import React, { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy, handleFirestoreError, OperationType } from '../firebase';
import { MessageSquare, Mail, Calendar, Tag, Trash2, CheckCircle, Clock, Archive, User, Search, Filter, ChevronRight, AlertCircle, Loader2, Eye } from 'lucide-react';
import { Button } from './ui/Button';

interface SupportMessage {
  id: string;
  name: string;
  email: string;
  category: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  createdAt: any;
}

const getStatusBadge = (status: SupportMessage['status']) => {
  switch (status) {
    case 'new':
      return {
        label: 'New',
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: <AlertCircle className="w-2.5 h-2.5" />
      };
    case 'read':
      return {
        label: 'Read',
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: <Eye className="w-2.5 h-2.5" />
      };
    case 'replied':
      return {
        label: 'Replied',
        className: 'bg-purple-100 text-purple-700 border-purple-200',
        icon: <CheckCircle className="w-2.5 h-2.5" />
      };
    case 'archived':
      return {
        label: 'Archived',
        className: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: <Archive className="w-2.5 h-2.5" />
      };
    default:
      return {
        label: status,
        className: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: <Clock className="w-2.5 h-2.5" />
      };
  }
};

export default function AdminMessages() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'replied' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    const q = query(collection(db, 'support_messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportMessage));
      setMessages(newMessages);
      
      // Keep selected message in sync
      if (selectedMessage) {
        const updated = newMessages.find(m => m.id === selectedMessage.id);
        if (updated) setSelectedMessage(updated);
      }
      
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'support_messages');
    });

    return () => unsubscribe();
  }, [selectedMessage?.id]);

  const handleUpdateStatus = async (id: string, status: SupportMessage['status']) => {
    setActionLoading(id + status);
    try {
      await updateDoc(doc(db, 'support_messages', id), { status });
      setSuccessMessage(`Message marked as ${status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `support_messages/${id}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    setActionLoading(id + 'delete');
    try {
      await deleteDoc(doc(db, 'support_messages', id));
      setSuccessMessage('Message deleted successfully');
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `support_messages/${id}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesFilter = filter === 'all' || msg.status === filter;
    const matchesSearch = 
      msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {successMessage && (
        <div className="fixed top-8 right-8 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/20">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold text-sm">{successMessage}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Messages</h2>
          <p className="text-gray-500 mt-1">Manage and respond to user inquiries</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm overflow-x-auto w-full md:w-auto custom-scrollbar">
          {(['all', 'new', 'read', 'replied', 'archived'] as const).map((f) => (
            <Button
              key={f}
              onClick={() => setFilter(f)}
              variant="unstyled"
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-1 sm:flex-none text-center ${
                filter === f 
                  ? 'bg-emerald-500 text-white shadow-md' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
              showNotification={false}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Messages List */}
        <div className={`lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-col min-h-[600px] max-h-[800px] ${selectedMessage ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((msg) => (
                <Button
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (msg.status === 'new') handleUpdateStatus(msg.id, 'read');
                  }}
                  variant="unstyled"
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-all group relative ${
                    selectedMessage?.id === msg.id ? 'bg-emerald-50/50' : ''
                  }`}
                  showNotification={false}
                >
                  {msg.status === 'new' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                  )}
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm text-gray-900 truncate pr-2">{msg.name}</span>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {msg.createdAt?.toDate?.()?.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-xs text-gray-500 truncate min-w-0 flex-1">{msg.category}</div>
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border shrink-0 ${getStatusBadge(msg.status).className}`}>
                      {getStatusBadge(msg.status).icon}
                      {getStatusBadge(msg.status).label}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {msg.message}
                  </div>
                </Button>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-sm text-gray-400">No messages found</p>
              </div>
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className={`lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-col min-h-[600px] ${!selectedMessage ? 'hidden lg:flex' : 'flex'}`}>
          {selectedMessage ? (
            <div className="flex flex-col h-full">
              <div className="p-4 sm:p-6 border-b border-gray-50 flex items-center justify-between gap-4 bg-gray-50/30">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <Button
                    onClick={() => setSelectedMessage(null)}
                    variant="ghost"
                    showNotification={false}
                    className="p-2 lg:hidden text-gray-500 hover:text-gray-700 bg-white border border-gray-100 shadow-sm rounded-xl shrink-0 min-w-0 h-auto"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </Button>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 font-bold text-lg border border-gray-100 shrink-0">
                    {selectedMessage.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{selectedMessage.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{selectedMessage.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    onClick={() => handleDeleteMessage(selectedMessage.id)}
                    disabled={!!actionLoading}
                    variant="unstyled"
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                    title="Delete Message"
                    showNotification={false}
                  >
                    {actionLoading === selectedMessage.id + 'delete' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-8 space-y-8 flex-1">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                    <Tag className="w-3.5 h-3.5" />
                    {selectedMessage.category}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5" />
                    {selectedMessage.createdAt?.toDate?.()?.toLocaleString()}
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${getStatusBadge(selectedMessage.status).className}`}>
                    {getStatusBadge(selectedMessage.status).icon}
                    {getStatusBadge(selectedMessage.status).label}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-8 text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-100 text-lg shadow-inner">
                  {selectedMessage.message}
                </div>

                <div className="pt-8 border-t border-gray-50 mt-8">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Archive className="w-4 h-4 text-emerald-500" />
                    Quick Actions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Button
                      onClick={() => handleUpdateStatus(selectedMessage.id, 'replied')}
                      disabled={!!actionLoading}
                      variant="primary"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                      showNotification={false}
                    >
                      {actionLoading === selectedMessage.id + 'replied' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Mark as Replied
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus(selectedMessage.id, 'archived')}
                      disabled={!!actionLoading}
                      variant="secondary"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                      showNotification={false}
                    >
                      {actionLoading === selectedMessage.id + 'archived' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Archive className="w-4 h-4" />
                      )}
                      Archive
                    </Button>
                    <a
                      href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.category} Inquiry`}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <Mail className="w-4 h-4" />
                      Reply via Email
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 min-h-[600px]">
              <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-3xl flex items-center justify-center mb-6">
                <Mail className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Select a message</h3>
              <p className="text-gray-500 max-w-xs">
                Choose a message from the list to view its details and take action.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
