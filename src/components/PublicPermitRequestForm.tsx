import React, { useState } from 'react';
import { FileText, Upload, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const PublicPermitRequestForm: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    permit_type: '',
    issued_for: 'VISITOR' as 'VISITOR' | 'PERMANENT' | 'VEHICLE',
    english_name: '',
    iqama_moi_number: '',
    passport_number: '',
    nationality: '',
    vehicle_plate_number: '',
    port_name: '',
    iqama_image_url: '',
    submitted_by: ''
  });

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `iqama_images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('permits')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('permits')
        .getPublicUrl(filePath);

      setFormData({ ...formData, iqama_image_url: publicUrl });
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error('Failed to upload image');
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('zawil_permit_requests')
        .insert([{
          ...formData,
          is_public_submission: true,
          status: 'PENDING'
        }]);

      if (error) throw error;

      setSubmitted(true);
      toast.success('Your permit request has been submitted successfully!');
    } catch (error: any) {
      toast.error('Failed to submit request. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Request Submitted!</h1>
          <p className="text-gray-600 mb-8">
            Your permit request has been successfully submitted. Our team will review it shortly and get back to you.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                permit_type: '',
                issued_for: 'VISITOR',
                english_name: '',
                iqama_moi_number: '',
                passport_number: '',
                nationality: '',
                vehicle_plate_number: '',
                port_name: '',
                iqama_image_url: '',
                submitted_by: ''
              });
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Zawil Permit Request</h1>
                <p className="text-blue-100">Submit your permit application</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permit Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.permit_type}
                  onChange={(e) => setFormData({ ...formData, permit_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter permit type"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issued For <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.issued_for}
                  onChange={(e) => setFormData({ ...formData, issued_for: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="VISITOR">Visitor</option>
                  <option value="PERMANENT">Permanent</option>
                  <option value="VEHICLE">Vehicle</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  English Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.english_name}
                  onChange={(e) => setFormData({ ...formData, english_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Full name in English"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IQAMA/MOI Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.iqama_moi_number}
                  onChange={(e) => setFormData({ ...formData, iqama_moi_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter IQAMA or MOI number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passport Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.passport_number}
                  onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter passport number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nationality <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter nationality"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Plate Number
                </label>
                <input
                  type="text"
                  value={formData.vehicle_plate_number}
                  onChange={(e) => setFormData({ ...formData, vehicle_plate_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.port_name}
                  onChange={(e) => setFormData({ ...formData, port_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter port name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Submitted By (Email/Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.submitted_by}
                  onChange={(e) => setFormData({ ...formData, submitted_by: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Your email or name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload IQAMA Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                    id="image-upload"
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {uploadingImage ? 'Uploading...' : 'Click to upload'}
                  </label>
                  <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 10MB</p>
                  {formData.iqama_image_url && (
                    <p className="text-sm text-green-600 mt-2 font-medium">✓ Image uploaded successfully</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> All fields marked with <span className="text-red-500">*</span> are required.
                Your request will be reviewed by our admin team shortly.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Permit Request'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>Need help? Contact support for assistance with your permit request.</p>
        </div>
      </div>
    </div>
  );
};
