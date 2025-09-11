import React, { useState, useRef, useEffect } from 'react';
import { useEmployee } from '../../context/EmployeeContext';
import { Download, Upload, Filter, Search, Plus, Save } from 'lucide-react';

interface Cell {
  value: string;
  formula?: string;
  type: 'text' | 'number' | 'date' | 'formula';
}

interface SpreadsheetData {
  [key: string]: Cell;
}

export const SpreadsheetView: React.FC = () => {
  const { state } = useEmployee();
  const [data, setData] = useState<SpreadsheetData>({});
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [formulaInput, setFormulaInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
  const rows = Array.from({ length: 50 }, (_, i) => i + 1);

  // Initialize with employee data
  useEffect(() => {
    const initialData: SpreadsheetData = {};
    
    // Headers
    const headers = ['Employee ID', 'Full Name', 'Company', 'Job Title', 'Email', 'Phone', 'Department', 'Joining Date'];
    headers.forEach((header, index) => {
      initialData[`${columns[index]}1`] = { value: header, type: 'text' };
    });

    // Employee data
    state.employees.forEach((employee, rowIndex) => {
      const row = rowIndex + 2;
      const company = state.companies.find(c => c.id === employee.companyId);
      const jobInfo = state.jobInfos.find(j => j.employeeId === employee.id);
      
      initialData[`A${row}`] = { value: employee.id, type: 'text' };
      initialData[`B${row}`] = { value: employee.fullName, type: 'text' };
      initialData[`C${row}`] = { value: company?.name || '', type: 'text' };
      initialData[`D${row}`] = { value: jobInfo?.jobTitle || '', type: 'text' };
      initialData[`E${row}`] = { value: employee.email, type: 'text' };
      initialData[`F${row}`] = { value: employee.contactNumber, type: 'text' };
      initialData[`G${row}`] = { value: company?.department || '', type: 'text' };
      initialData[`H${row}`] = { value: jobInfo?.joiningDate || '', type: 'date' };
    });

    setData(initialData);
  }, [state.employees, state.companies, state.jobInfos]);

  const getCellValue = (cellId: string): string => {
    const cell = data[cellId];
    if (!cell) return '';
    
    if (cell.formula) {
      // Simple formula evaluation (for demo purposes)
      if (cell.formula.startsWith('=SUM(')) {
        const range = cell.formula.match(/=SUM\(([A-Z]+\d+):([A-Z]+\d+)\)/);
        if (range) {
          // Calculate sum for the range
          return '0'; // Simplified for demo
        }
      }
      return cell.formula;
    }
    
    return cell.value;
  };

  const handleCellChange = (cellId: string, value: string) => {
    setData(prev => ({
      ...prev,
      [cellId]: {
        ...prev[cellId],
        value,
        type: isNaN(Number(value)) ? 'text' : 'number'
      }
    }));
  };

  const handleCellClick = (cellId: string) => {
    setSelectedCell(cellId);
    const cell = data[cellId];
    setFormulaInput(cell?.formula || cell?.value || '');
  };

  const handleFormulaSubmit = () => {
    if (!selectedCell) return;
    
    const isFormula = formulaInput.startsWith('=');
    setData(prev => ({
      ...prev,
      [selectedCell]: {
        value: isFormula ? '' : formulaInput,
        formula: isFormula ? formulaInput : undefined,
        type: isFormula ? 'formula' : (isNaN(Number(formulaInput)) ? 'text' : 'number')
      }
    }));
  };

  const exportToCSV = () => {
    const csvContent = rows.map(row => 
      columns.map(col => {
        const cellId = `${col}${row}`;
        const value = getCellValue(cellId);
        return `"${value.replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredData = Object.entries(data).filter(([cellId, cell]) =>
    searchTerm === '' || cell.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Excel View</h1>
            <p className="text-gray-600">Spreadsheet interface for employee data management</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search cells..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {/* Formula Bar */}
          <div className="flex items-center gap-3">
            <div className="w-20 text-sm font-medium text-gray-700">
              {selectedCell || 'A1'}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={formulaInput}
                onChange={(e) => setFormulaInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleFormulaSubmit()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Enter value or formula (=SUM(A1:A10))"
              />
              <button
                onClick={handleFormulaSubmit}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Spreadsheet */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="w-12 h-8 border border-gray-300 bg-gray-100 text-xs font-medium text-gray-600"></th>
                  {columns.map(col => (
                    <th key={col} className="w-24 h-8 border border-gray-300 bg-gray-100 text-xs font-medium text-gray-600">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row}>
                    <td className="w-12 h-8 border border-gray-300 bg-gray-100 text-xs font-medium text-gray-600 text-center">
                      {row}
                    </td>
                    {columns.map(col => {
                      const cellId = `${col}${row}`;
                      const cell = data[cellId];
                      const isSelected = selectedCell === cellId;
                      const isHeader = row === 1;
                      
                      return (
                        <td
                          key={cellId}
                          className={`w-24 h-8 border border-gray-300 p-0 ${
                            isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 
                            isHeader ? 'bg-blue-50 font-medium' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleCellClick(cellId)}
                        >
                          <input
                            type="text"
                            value={getCellValue(cellId)}
                            onChange={(e) => handleCellChange(cellId, e.target.value)}
                            className={`w-full h-full px-2 text-xs border-none outline-none bg-transparent ${
                              isHeader ? 'font-medium text-gray-900' : 'text-gray-700'
                            }`}
                            onFocus={() => setSelectedCell(cellId)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Total Rows</p>
            <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Total Columns</p>
            <p className="text-2xl font-bold text-gray-900">{columns.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Filled Cells</p>
            <p className="text-2xl font-bold text-gray-900">{Object.keys(data).length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Selected Cell</p>
            <p className="text-2xl font-bold text-gray-900">{selectedCell || 'None'}</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          onChange={(e) => {
            // Handle file import (simplified for demo)
            console.log('File selected:', e.target.files?.[0]);
          }}
        />
      </div>
    </div>
  );
};