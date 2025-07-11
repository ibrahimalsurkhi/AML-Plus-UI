import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, TemplateType } from '@/services/api';
import { API_CONFIG } from '@/config/api';
import { toast } from 'sonner';

interface TemplateFormData {
  name: string;
  description: string;
}

interface FormErrors {
  name?: string;
  description?: string;
}

export const CreateTemplateContent = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post(API_CONFIG.endpoints.templates.create, {
        name: formData.name,
        description: formData.description,
        templateType: TemplateType.Record
      });

      toast.success('Template created successfully');
      navigate('/'); // Navigate back to dashboard or template list
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="card shadow-md rounded-xl border border-gray-200">
          <div className="card-header">
            <h3 className="card-title">Create New Template</h3>
          </div>
          <div className="card-body">
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label className="form-label text-gray-900 font-normal mb-1">Template Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter template name"
                  className={`form-control bg-white border border-gray-300 rounded-lg px-4 py-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.name ? 'border-red-500' : ''
                  }`}
                />
                {errors.name && (
                  <span className="text-red-500 text-xs mt-1 font-medium">{errors.name}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="description" className="form-label text-gray-900 font-normal mb-1">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter template description"
                  className={`form-control bg-white border border-gray-300 rounded-lg px-4 py-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.description ? 'border-red-500' : ''
                  }`}
                />
                {errors.description && (
                  <span className="text-red-500 text-xs mt-1 font-medium">{errors.description}</span>
                )}
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="submit"
                  className="btn btn-primary rounded-lg px-6 py-2 shadow-sm transition-colors duration-150"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Template'}
                </button>
                <button
                  type="button"
                  className="btn btn-light rounded-lg px-6 py-2 border border-gray-300 transition-colors duration-150"
                  onClick={() => navigate('/templates')}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}; 