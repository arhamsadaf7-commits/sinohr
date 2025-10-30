import React, { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface PermitRequest {
  request_id: number;
  permit_type: string;
  issued_for: 'VISITOR' | 'PERMANENT' | 'VEHICLE';
  english_name: string;
  iqama_moi_number: string;
  passport_number: string;
  nationality: string;
  vehicle_plate_number?: string;
  port_name: string;
  iqama_image_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submitted_by: string;
  is_public_submission: boolean;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export const SupplierDashboard: React.FC<{ setActivePage?: (page: string) => void }> = ({ setActivePage }) => {
  const { state } = useAuth();
  const [requests, setRequests] = useState<PermitRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('zawil_permit_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast.error('Failed to load permit requests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'Total Requests',
      value: requests.length,
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'Pending',
      value: requests.filter(r => r.status === 'PENDING').length,
      icon: Clock,
      color: 'yellow'
    },
    {
      title: 'Approved',
      value: requests.filter(r => r.status === 'APPROVED').length,
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Rejected',
      value: requests.filter(r => r.status === 'REJECTED').length,
      icon: XCircle,
      color: 'red'
    }
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || styles.PENDING;
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supplier Dashboard</h1>
          <p className="text-gray-600">Welcome, {state.user?.username}</p>
        </div>

        {!zawilPermissions.canRead ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Modules Available</h2>
            <p className="text-gray-600">
              You don't have access to any modules yet. Please contact your administrator.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                const colorClasses = {
                  blue: 'bg-blue-500',
                  yellow: 'bg-yellow-500',
                  green: 'bg-green-500',
                  red: 'bg-red-500'
                };

                return (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]} text-white`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {zawilPermissions.canCreate && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Create New Request</h2>
                    <p className="text-sm text-gray-600">Submit a new Zawil permit request for processing</p>
                  </div>
                  <button
                    onClick={() => window.location.href = '/admin#permit-requests'}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    New Request
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">My Recent Requests</h2>
              {requests.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No requests found</p>
                  {zawilPermissions.canCreate && (
                    <button
                      onClick={() => window.location.href = '/admin#permit-requests'}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Your First Request
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued For</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Port</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {requests.slice(0, 10).map((request) => (
                        <tr key={request.request_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            #{request.request_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {request.english_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {request.permit_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {request.issued_for}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {request.port_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(request.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
