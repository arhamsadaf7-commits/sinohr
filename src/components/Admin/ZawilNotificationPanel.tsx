import React, { useState, useMemo } from 'react';
import { X, Bell, AlertTriangle, CheckCircle, Eye, Mail, Circle, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface ZawilPermit {
  permit_id: number;
  zawil_permit_id: string;
  permit_type: string;
  issued_for: string;
  english_name: string;
  moi_number: string;
  expiry_date: string;
  daysRemaining: number;
  status: 'active' | 'expiring' | 'expired';
}

interface Props {
  permits: ZawilPermit[];
  onClose: () => void;
  onSendToTodo: (permits: ZawilPermit[]) => void;
}

export const ZawilNotificationPanel: React.FC<Props> = ({ permits, onClose, onSendToTodo }) => {
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const expiringPermits = useMemo(() => {
    return permits.filter(p => p.status === 'expiring' && p.daysRemaining > 0);
  }, [permits]);

  const expiredPermits = useMemo(() => {
    return permits.filter(p => p.status === 'expired');
  }, [permits]);

  const filteredExpiring = useMemo(() => {
    if (filter === 'unread') return expiringPermits.filter(p => !readIds.has(p.permit_id));
    if (filter === 'read') return expiringPermits.filter(p => readIds.has(p.permit_id));
    return expiringPermits;
  }, [expiringPermits, filter, readIds]);

  const filteredExpired = useMemo(() => {
    if (filter === 'unread') return expiredPermits.filter(p => !readIds.has(p.permit_id));
    if (filter === 'read') return expiredPermits.filter(p => readIds.has(p.permit_id));
    return expiredPermits;
  }, [expiredPermits, filter, readIds]);

  const unreadCount = permits.length - readIds.size;

  const toggleRead = (permitId: number) => {
    setReadIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(permitId)) {
        newSet.delete(permitId);
      } else {
        newSet.add(permitId);
      }
      return newSet;
    });
  };

  const markAllAsRead = () => {
    setReadIds(new Set(permits.map(p => p.permit_id)));
    toast.success('All notifications marked as read');
  };

  const markAllAsUnread = () => {
    setReadIds(new Set());
    toast.success('All notifications marked as unread');
  };

  const handleSendToTodo = () => {
    onSendToTodo(permits);
    toast.success(`${permits.length} permits added to To Do List`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">🔔 Notifications</h2>
                <p className="text-sm text-gray-600">
                  {unreadCount} unread • {permits.length} total alerts
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({permits.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'read'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Read ({readIds.size})
            </button>
          </div>

          {/* Bulk Actions */}
          <div className="flex gap-2">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
            <button
              onClick={markAllAsUnread}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm"
            >
              <Circle className="w-4 h-4" />
              Mark All Unread
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Expiring Soon Section */}
          {filteredExpiring.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Expiring Soon ({filteredExpiring.length})
              </h3>
              <div className="space-y-2">
                {filteredExpiring.map(permit => (
                  <div
                    key={permit.permit_id}
                    className={`rounded-lg p-4 border transition-all hover:shadow-md ${
                      readIds.has(permit.permit_id)
                        ? 'bg-gray-50 border-gray-200 opacity-75'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Unread Indicator */}
                      {!readIds.has(permit.permit_id) && (
                        <div className="mt-1 flex-shrink-0">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        </div>
                      )}

                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{permit.english_name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          MOI: {permit.moi_number} • Permit: {permit.zawil_permit_id}
                        </p>
                        <p className="text-sm text-yellow-700 mt-1 font-medium">
                          ⏰ Expires in {permit.daysRemaining} days
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(permit.expiry_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => toggleRead(permit.permit_id)}
                          className={`p-2 rounded-lg transition-colors ${
                            readIds.has(permit.permit_id)
                              ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          }`}
                          title={readIds.has(permit.permit_id) ? 'Mark as Unread' : 'Mark as Read'}
                        >
                          {readIds.has(permit.permit_id) ? (
                            <CheckCheck className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expired Section */}
          {filteredExpired.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Expired ({filteredExpired.length})
              </h3>
              <div className="space-y-2">
                {filteredExpired.map(permit => (
                  <div
                    key={permit.permit_id}
                    className={`rounded-lg p-4 border transition-all hover:shadow-md ${
                      readIds.has(permit.permit_id)
                        ? 'bg-gray-50 border-gray-200 opacity-75'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Unread Indicator */}
                      {!readIds.has(permit.permit_id) && (
                        <div className="mt-1 flex-shrink-0">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                      )}

                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{permit.english_name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          MOI: {permit.moi_number} • Permit: {permit.zawil_permit_id}
                        </p>
                        <p className="text-sm text-red-700 mt-1 font-medium">
                          ⚠️ Expired {Math.abs(permit.daysRemaining)} days ago
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(permit.expiry_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => toggleRead(permit.permit_id)}
                          className={`p-2 rounded-lg transition-colors ${
                            readIds.has(permit.permit_id)
                              ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                          title={readIds.has(permit.permit_id) ? 'Mark as Unread' : 'Mark as Read'}
                        >
                          {readIds.has(permit.permit_id) ? (
                            <CheckCheck className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredExpiring.length === 0 && filteredExpired.length === 0 && (
            <div className="text-center py-12">
              {filter === 'all' ? (
                <>
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium">No notifications</p>
                  <p className="text-sm text-gray-500 mt-1">All permits are in good standing</p>
                </>
              ) : filter === 'unread' ? (
                <>
                  <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No unread notifications</p>
                </>
              ) : (
                <>
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No read notifications</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer - Send to Todo */}
        {permits.length > 0 && (
          <div className="p-6 border-t border-gray-200 flex-shrink-0 bg-gray-50">
            <button
              onClick={handleSendToTodo}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Mail className="w-5 h-5" />
              Send All to To Do List ({permits.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
