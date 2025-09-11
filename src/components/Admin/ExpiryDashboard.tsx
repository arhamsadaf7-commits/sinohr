import React, { useState, useEffect } from 'react';
import { useEmployee } from '../../context/EmployeeContext';
import { 
  Calendar, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Search, 
  Filter,
  ChevronDown,
  ChevronUp,
  FileText,
  CreditCard,
  Shield,
  Car
} from 'lucide-react';
import { ExpiryItem, ExpiryStats, DashboardData } from '../../types/auth';

export const ExpiryDashboard: React.FC = () => {
  const { state } = useEmployee();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    generateDashboardData();
  }, [state.documents, state.employees]);

  const generateDashboardData = () => {
    const today = new Date();
    const expiryItems: ExpiryItem[] = [];

    // Process documents
    state.documents.forEach(doc => {
      const employee = state.employees.find(emp => emp.id === doc.employeeId);
      if (!employee) return;

      // Process different document types
      const documentTypes = [
        { type: 'iqama' as const, date: doc.iqamaExpiryDate, number: doc.iqamaNumber },
        { type: 'passport' as const, date: doc.passportExpiryDate, number: doc.passportNumber },
        { type: 'visa' as const, date: doc.visaNumber ? today.toISOString().split('T')[0] : '', number: doc.visaNumber },
        { type: 'insurance' as const, date: doc.insurancePolicyNumber ? today.toISOString().split('T')[0] : '', number: doc.insurancePolicyNumber },
      ];

      documentTypes.forEach(({ type, date, number }) => {
        if (date && number) {
          const expiryDate = new Date(date);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          let status: ExpiryItem['status'];
          if (daysUntilExpiry < 0) status = 'expired';
          else if (daysUntilExpiry <= 15) status = 'expiring-soon';
          else if (daysUntilExpiry <= 30) status = 'expiring-later';
          else status = 'valid';

          expiryItems.push({
            id: `${doc.employeeId}-${type}`,
            employeeId: doc.employeeId,
            employeeName: employee.fullName,
            documentType: type,
            documentNumber: number,
            expiryDate: date,
            daysUntilExpiry,
            status
          });
        }
      });
    });

    // Group by document type
    const groupedData: DashboardData = {
      iqama: { expired: 0, expiringSoon: 0, expiringLater: 0, total: 0, items: [] },
      passport: { expired: 0, expiringSoon: 0, expiringLater: 0, total: 0, items: [] },
      insurance: { expired: 0, expiringSoon: 0, expiringLater: 0, total: 0, items: [] },
      license: { expired: 0, expiringSoon: 0, expiringLater: 0, total: 0, items: [] },
      visa: { expired: 0, expiringSoon: 0, expiringLater: 0, total: 0, items: [] },
    };

    expiryItems.forEach(item => {
      const category = groupedData[item.documentType];
      category.items.push(item);
      category.total++;
      
      switch (item.status) {
        case 'expired':
          category.expired++;
          break;
        case 'expiring-soon':
          category.expiringSoon++;
          break;
        case 'expiring-later':
          category.expiringLater++;
          break;
      }
    });

    setDashboardData(groupedData);
  };

  const toggleCardExpansion = (cardType: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardType)) {
      newExpanded.delete(cardType);
    } else {
      newExpanded.add(cardType);
    }
    setExpandedCards(newExpanded);
  };

  const getFilteredItems = (items: ExpiryItem[]) => {
    return items.filter(item => {
      const matchesSearch = item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.documentNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  };

  const getStatusColor = (status: ExpiryItem['status']) => {
    switch (status) {
      case 'expired': return 'text-red-600 bg-red-50 border-red-200';
      case 'expiring-soon': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'expiring-later': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getStatusIcon = (status: ExpiryItem['status']) => {
    switch (status) {
      case 'expired': return <AlertTriangle className="w-4 h-4" />;
      case 'expiring-soon': return <Clock className="w-4 h-4" />;
      case 'expiring-later': return <Calendar className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'iqama': return <CreditCard className="w-6 h-6" />;
      case 'passport': return <FileText className="w-6 h-6" />;
      case 'insurance': return <Shield className="w-6 h-6" />;
      case 'license': return <Car className="w-6 h-6" />;
      case 'visa': return <FileText className="w-6 h-6" />;
      default: return <FileText className="w-6 h-6" />;
    }
  };

  if (!dashboardData) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const cardTypes = [
    { key: 'iqama', label: 'Iqama', color: 'from-blue-500 to-blue-600' },
    { key: 'passport', label: 'Passport', color: 'from-green-500 to-green-600' },
    { key: 'insurance', label: 'Insurance', color: 'from-purple-500 to-purple-600' },
    { key: 'visa', label: 'Visa', color: 'from-orange-500 to-orange-600' },
    { key: 'license', label: 'License', color: 'from-red-500 to-red-600' },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Expiry Dashboard</h1>
          <p className="text-gray-600">Monitor and manage document expiration dates</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by employee name, ID, or document number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Categories</option>
                <option value="iqama">Iqama</option>
                <option value="passport">Passport</option>
                <option value="insurance">Insurance</option>
                <option value="visa">Visa</option>
                <option value="license">License</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expiry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {cardTypes.map(({ key, label, color }) => {
            const data = dashboardData[key as keyof DashboardData];
            const isExpanded = expandedCards.has(key);
            const filteredItems = getFilteredItems(data.items);
            
            if (selectedCategory !== 'all' && selectedCategory !== key) return null;

            return (
              <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Card Header */}
                <div className={`bg-gradient-to-r ${color} p-6 text-white`}>
                  <div className="flex items-center justify-between mb-4">
                    {getDocumentIcon(key)}
                    <button
                      onClick={() => toggleCardExpansion(key)}
                      className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{label}</h3>
                  <p className="text-sm opacity-90">Total: {data.total} documents</p>
                </div>

                {/* Card Stats */}
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Expired</span>
                      <span className="font-bold text-red-600">{data.expired}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Expiring Soon (0-15 days)</span>
                      <span className="font-bold text-orange-600">{data.expiringSoon}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Expiring Later (16-30 days)</span>
                      <span className="font-bold text-yellow-600">{data.expiringLater}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 max-h-96 overflow-y-auto">
                    {filteredItems.length > 0 ? (
                      <div className="p-4 space-y-3">
                        {filteredItems.map((item) => (
                          <div
                            key={item.id}
                            className={`p-3 rounded-lg border ${getStatusColor(item.status)}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{item.employeeName}</span>
                              {getStatusIcon(item.status)}
                            </div>
                            <div className="text-xs space-y-1">
                              <p>ID: {item.employeeId}</p>
                              <p>Doc: {item.documentNumber}</p>
                              <p>Expires: {new Date(item.expiryDate).toLocaleDateString()}</p>
                              <p className="font-medium">
                                {item.daysUntilExpiry < 0 
                                  ? `Expired ${Math.abs(item.daysUntilExpiry)} days ago`
                                  : `${item.daysUntilExpiry} days remaining`
                                }
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No documents found
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overall Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {Object.values(dashboardData).reduce((sum, data) => sum + data.expired, 0)}
              </div>
              <p className="text-sm text-gray-600">Total Expired</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {Object.values(dashboardData).reduce((sum, data) => sum + data.expiringSoon, 0)}
              </div>
              <p className="text-sm text-gray-600">Expiring Soon</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {Object.values(dashboardData).reduce((sum, data) => sum + data.expiringLater, 0)}
              </div>
              <p className="text-sm text-gray-600">Expiring Later</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {Object.values(dashboardData).reduce((sum, data) => sum + data.total, 0)}
              </div>
              <p className="text-sm text-gray-600">Total Documents</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};