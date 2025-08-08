import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  templateService,
  type Template,
  type ScoreCriteria,
  TemplateStatus,
  type TemplateField,
  FieldType,
  type FieldOption,
  TemplateType,
  type Lookup,
  lookupService,
  type TemplateSection,
  type TemplateFieldsResponse
} from '@/services/api';
import { Container } from '@/components/container';
import { useLayout } from '@/providers';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import '@/styles/material-icons.css'; // Make sure this CSS file exists and is properly configured
import '@/styles/score-slider.css';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <i className={`material-symbols-outlined ${className}`}>{name}</i>
);

const getStatusBadge = (status: TemplateStatus) => {
  const variants = {
    [TemplateStatus.Draft]: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    [TemplateStatus.Active]: 'bg-green-100 text-green-800 hover:bg-green-200',
    [TemplateStatus.Archived]: 'bg-red-100 text-red-800 hover:bg-red-200'
  };

  const labels = {
    [TemplateStatus.Draft]: 'Draft',
    [TemplateStatus.Active]: 'Active',
    [TemplateStatus.Archived]: 'Archived'
  };

  return (
    <Badge className={variants[status] || 'bg-gray-100 text-gray-800 hover:bg-gray-200'}>
      {labels[status] || 'Unknown'}
    </Badge>
  );
};

const sliderStyles = {
  range: `
    height: 2px;
    -webkit-appearance: none;
    margin: 10px 0;
    width: 100%;
  `,
  thumb: `
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    cursor: pointer;
    -webkit-appearance: none;
    margin-top: -9px;
    border: 2px solid #e5e7eb;
  `,
  track: `
    width: 100%;
    height: 2px;
    cursor: pointer;
    background: #e5e7eb;
    border-radius: 1px;
  `
};

const ScoreCriteriaBar = ({
  criteria,
  onChange
}: {
  criteria: ScoreCriteria[];
  onChange?: (criteriaId: number, newScore: number) => void;
}) => {
  const minScore = 0;
  const maxScore = 5;

  // Define sections with their properties
  const sections = [
    { key: 'Low', color: '#def5f1', textColor: '#047857', range: [0, 1.8] },
    { key: 'Medium', color: '#fff5e5', textColor: '#d97706', range: [1.8, 3] },
    { key: 'High', color: '#fde8e8', textColor: '#dc2626', range: [3, 5] }
  ];

  // State for slider boundaries
  const [boundaries, setBoundaries] = useState([1.8, 3.0]);
  const [isDragging, setIsDragging] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Store modified criteria scores separately to track changes
  const [editedScores, setEditedScores] = useState<Record<number, number>>({});

  // Initialize boundaries and edited scores on mount or when criteria changes
  useEffect(() => {
    // Skip initialization if we're currently updating to prevent jumps
    if (isUpdating) {
      return;
    }

    // Find criteria with keys matching sections
    const lowCriteria = criteria.find((c) => c.key.toLowerCase().includes('low'));
    const mediumCriteria = criteria.find((c) => c.key.toLowerCase().includes('medium'));

    // Use server values if available, otherwise use defaults
    const initialBoundaries = [
      lowCriteria ? lowCriteria.score : sections[0].range[1],
      mediumCriteria ? mediumCriteria.score : sections[1].range[1]
    ];

    setBoundaries(initialBoundaries);

    // Initialize edited scores with original values
    const initialScores: Record<number, number> = {};
    criteria.forEach((c) => {
      initialScores[c.id] = c.score;
    });
    setEditedScores(initialScores);
  }, [criteria, isUpdating]);

  const getValueFromEvent = (e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
    if (!sliderRef.current) return null;

    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const offsetX = clientX - rect.left;
    const percentage = Math.min(Math.max(offsetX / rect.width, 0), 1);
    return percentage * maxScore;
  };

  const updateBoundary = (index: number, newValue: number) => {
    // Don't update if not in edit mode
    if (!isEditMode) return;

    const newBoundaries = [...boundaries];

    // Ensure the new value is within valid range and doesn't cross other boundaries
    if (index === 0) {
      newBoundaries[0] = Math.min(Math.max(newValue, minScore + 0.1), newBoundaries[1] - 0.1);
    } else if (index === 1) {
      newBoundaries[1] = Math.min(Math.max(newValue, newBoundaries[0] + 0.1), maxScore - 0.1);
    }

    setBoundaries(newBoundaries);
    setHasChanges(true);
  };

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    // Only allow dragging the first two boundaries (low and medium)
    if (!isEditMode || index === 2) return;

    e.preventDefault();
    setIsDragging(index);

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const newValue = getValueFromEvent(e);
      if (newValue !== null) {
        updateBoundary(index, newValue);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    // Only allow dragging the first two boundaries (low and medium)
    if (!isEditMode || index === 2) return;

    e.preventDefault();
    setIsDragging(index);

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const newValue = getValueFromEvent(e);
      if (newValue !== null) {
        updateBoundary(index, newValue);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(null);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleEnableEdit = () => {
    setIsEditMode(true);
    // Reset edited scores to current criteria values
    const currentScores: Record<number, number> = {};
    criteria.forEach((c) => {
      currentScores[c.id] = c.score;
    });
    setEditedScores(currentScores);
    toast({
      description: 'You can now drag the sliders to adjust score boundaries'
    });
  };

  // Get score section (low, medium, high) based on score value
  const getSection = (score: number): number => {
    if (score <= boundaries[0]) return 0; // Low
    if (score <= boundaries[1]) return 1; // Medium
    return 2; // High
  };

  const handleSave = () => {
    if (!onChange || !hasChanges) {
      return;
    }

    // Set updating flag to prevent boundaries from resetting during updates
    setIsUpdating(true);

    // Calculate section ranges based on current boundaries
    const lowRange = [0, boundaries[0]];
    const mediumRange = [boundaries[0], boundaries[1]];
    const highRange = [boundaries[1], maxScore];

    // Find criteria in each section
    const lowCriteria = criteria.filter((c) => c.key.toLowerCase().includes('low'));
    const mediumCriteria = criteria.filter((c) => c.key.toLowerCase().includes('medium'));
    const highCriteria = criteria.filter((c) => c.key.toLowerCase().includes('high'));

    // Calculate scores based on actual slider positions
    const updateCriteriaScores = () => {
      // Process each criteria based on its key
      lowCriteria.forEach((c) => {
        if (c && onChange) {
          // For low criteria, use first boundary value
          const targetScore = Number(boundaries[0]);

          setTimeout(
            () => {
              onChange(c.id, targetScore);
            },
            200 * criteria.indexOf(c)
          );
        }
      });

      mediumCriteria.forEach((c) => {
        if (c && onChange) {
          // For medium criteria, use second boundary value
          const targetScore = Number(boundaries[1]);

          setTimeout(
            () => {
              onChange(c.id, targetScore);
            },
            200 * criteria.indexOf(c)
          );
        }
      });

      highCriteria.forEach((c) => {
        if (c && onChange) {
          // For high criteria, use max score
          const targetScore = Number(maxScore);

          setTimeout(
            () => {
              onChange(c.id, targetScore);
            },
            200 * criteria.indexOf(c)
          );
        }
      });
    };

    // Update all criteria
    updateCriteriaScores();

    // Use a timeout to ensure all updates have time to process before resetting states
    setTimeout(
      () => {
        setHasChanges(false);
        setIsEditMode(false);
        setIsUpdating(false);
        toast({
          title: 'Success',
          description: 'Score criteria updated successfully'
        });
      },
      (criteria.length + 1) * 200
    );
  };

  const handleCancel = () => {
    // Reset to default section boundaries
    setBoundaries([sections[0].range[1], sections[1].range[1]]);
    setHasChanges(false);
    setIsEditMode(false);
    toast({
      description: 'Changes cancelled'
    });
  };

  return (
    <div className="w-full space-y-6 px-4">
      {/* Section labels with values */}
      <div className="grid grid-cols-3 gap-4">
        {sections.map((section, index) => (
          <div key={section.key} className="flex flex-col items-center">
            <div className="text-sm font-semibold mb-1" style={{ color: section.textColor }}>
              {section.key}
            </div>
            <div className="text-xs text-gray-500">
              {index === 0
                ? `(${minScore.toFixed(2)}-${boundaries[0].toFixed(2)})`
                : index === 1
                  ? `(${boundaries[0].toFixed(2)}-${boundaries[1].toFixed(2)})`
                  : `(${boundaries[1].toFixed(2)}-${maxScore.toFixed(2)})`}
            </div>
          </div>
        ))}
      </div>

      {/* Slider container */}
      <div className="relative h-12" ref={sliderRef}>
        {/* Background sections */}
        <div className="absolute inset-0 flex rounded-full overflow-hidden shadow-sm">
          {/* Low section */}
          <div
            className="h-full"
            style={{
              background: sections[0].color,
              width: `${(boundaries[0] / maxScore) * 100}%`,
              borderRight: '2px solid white'
            }}
          />
          {/* Medium section */}
          <div
            className="h-full"
            style={{
              background: sections[1].color,
              width: `${((boundaries[1] - boundaries[0]) / maxScore) * 100}%`,
              borderRight: '2px solid white'
            }}
          />
          {/* High section */}
          <div
            className="h-full"
            style={{
              background: sections[2].color,
              width: `${((maxScore - boundaries[1]) / maxScore) * 100}%`
            }}
          />
        </div>

        {/* Thumbs */}
        {[...boundaries, maxScore].map((value, idx) => (
          <div
            key={`thumb-${idx}`}
            className={`absolute top-0 bottom-0 ${isEditMode && idx !== 2 ? 'cursor-grab active:cursor-grabbing' : ''}`}
            style={{
              left: `${(value / maxScore) * 100}%`,
              transform: 'translateX(-50%)',
              width: '32px', // Wider touch target
              zIndex: isDragging === idx ? 50 : 20
            }}
            onMouseDown={(e) => handleMouseDown(idx, e)}
            onTouchStart={(e) => handleTouchStart(idx, e)}
          >
            <div className="relative h-full flex items-center justify-center">
              {/* Value tooltip */}
              <div
                className={`absolute -top-8 left-1/2 transform -translate-x-1/2 
                         bg-white px-2 py-1 rounded-md shadow-md text-sm font-medium
                         whitespace-nowrap select-none`}
              >
                {value.toFixed(2)}
              </div>

              {/* Thumb */}
              <div
                className={`w-8 h-8 rounded-full bg-white shadow-md border-2 
                         flex items-center justify-center transition-colors duration-200
                         ${isEditMode && idx !== 2 ? 'border-gray-200 hover:border-gray-300' : 'border-gray-300'}`}
              >
                <div className="thumb-dot"></div>
              </div>
            </div>
          </div>
        ))}

        {/* Score labels */}
        <div className="absolute -bottom-6 left-0 text-sm text-gray-500 font-medium">
          {minScore.toFixed(2)}
        </div>
        <div className="absolute -bottom-6 right-0 text-sm text-gray-500 font-medium">
          {maxScore.toFixed(2)}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-4">
        {!isEditMode ? (
          <Button onClick={handleEnableEdit} className="gap-2" size="sm">
            <Icon name="edit" className="text-base" />
            Update
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleCancel} className="gap-2" size="sm">
              <Icon name="close" className="text-base" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges} className="gap-2" size="sm">
              <Icon name="save" className="text-base" />
              Save
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

const StatusIcon = ({ status }: { status: TemplateStatus }) => {
  const icons = {
    [TemplateStatus.Draft]: 'edit_note',
    [TemplateStatus.Active]: 'check_circle',
    [TemplateStatus.Archived]: 'archive'
  };

  const colors = {
    [TemplateStatus.Draft]: 'text-yellow-500',
    [TemplateStatus.Active]: 'text-green-500',
    [TemplateStatus.Archived]: 'text-red-500'
  };

  return <Icon name={icons[status]} className={colors[status]} />;
};

const InfoCard = ({
  label,
  value,
  icon,
  valueIcon
}: {
  label: string;
  value: string | number;
  icon: string;
  valueIcon?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongText = typeof value === 'string' && value.length > 150;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`rounded-lg p-3 bg-primary/5 mt-1`}>
            <Icon name={icon} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h6 className="text-sm font-normal text-gray-500 mb-2 flex items-center gap-2">
              {label}
            </h6>
            <div className="space-y-2">
              <div
                className={`text-gray-900 flex items-start gap-2 ${isLongText ? 'text-base' : 'text-xl font-semibold'}`}
              >
                <div className={`${!isExpanded && isLongText ? 'line-clamp-3' : ''}`}>{value}</div>
                {valueIcon && (
                  <Icon name={valueIcon} className="text-gray-400 text-base mt-1 flex-shrink-0" />
                )}
              </div>
              {isLongText && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80 -ml-2 h-8"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <Icon name={isExpanded ? 'expand_less' : 'expand_more'} className="mr-1" />
                  {isExpanded ? 'Show less' : 'Read more'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ScoreCriteriaFormData {
  key: string;
  bgColor: string;
  color: string;
  score: number;
}

const defaultFormData: ScoreCriteriaFormData = {
  key: '',
  bgColor: '#f3f4f6',
  color: '#111827',
  score: 0
};

const ScoreCriteriaDialog = ({
  open,
  onOpenChange,
  onSubmit,
  initialData
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ScoreCriteriaFormData) => void;
  initialData?: ScoreCriteriaFormData;
}) => {
  const [formData, setFormData] = useState<ScoreCriteriaFormData>(initialData || defaultFormData);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{initialData ? 'Edit Score Criteria' : 'Add Score Criteria'}</DialogTitle>
        <DialogHeader>
          <DialogDescription>
            {initialData
              ? 'Update the score criteria details below.'
              : 'Fill in the details for the new score criteria.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="Enter key (e.g. High, Medium, Low)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="score">Score</Label>
              <Input
                id="score"
                type="number"
                min={0}
                max={5}
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                placeholder="Enter score (0-5)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bgColor">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="bgColor"
                    type="color"
                    value={formData.bgColor}
                    onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                    className="w-12 p-1 h-9"
                  />
                  <Input
                    value={formData.bgColor}
                    onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                    placeholder="#f3f4f6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 p-1 h-9"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#111827"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">{initialData ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const FieldTypeMap = {
  [FieldType.Text]: 'Text',
  [FieldType.Dropdown]: 'Dropdown',
  [FieldType.Radio]: 'Radio',
  [FieldType.Checkbox]: 'Checkbox',
  [FieldType.Date]: 'Date',
  [FieldType.Number]: 'Number',
  [FieldType.TextArea]: 'Text Area',
  [FieldType.Lookup]: 'Lookup'
};

const TemplateFieldDialog = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  templateType
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<TemplateField>) => void;
  initialData?: TemplateField;
  templateType: TemplateType;
}) => {
  const defaultField: Partial<TemplateField> = {
    label: '',
    fieldType: FieldType.Text,
    weight: 0,
    isRequired: false,
    placeholder: '',
    displayOrder: 1,
    lookupId: null,
    readOnly: false
  };

  const [formData, setFormData] = useState<Partial<TemplateField>>(initialData || defaultField);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lookups, setLookups] = useState<Lookup[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(defaultField);
    }
    setErrors({});
  }, [initialData, open]);

  // Fetch lookups when dialog opens and field type is Lookup
  useEffect(() => {
    if (open && formData.fieldType === FieldType.Lookup) {
      fetchLookups();
    }
  }, [open, formData.fieldType]);

  const fetchLookups = async () => {
    try {
      setLoadingLookups(true);
      const response = await lookupService.getLookups({ pageNumber: 1, pageSize: 100 });
      setLookups(response.items);
    } catch (err) {
      console.error('Error fetching lookups:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch lookups',
        variant: 'destructive'
      });
    } finally {
      setLoadingLookups(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    if (!formData.label?.trim()) {
      newErrors.label = 'Label is required';
    }

    if (formData.fieldType === undefined) {
      newErrors.fieldType = 'Field type is required';
    }

    // Validate lookupId is required for Lookup field type
    if (formData.fieldType === FieldType.Lookup && (!formData.lookupId || formData.lookupId <= 0)) {
      newErrors.lookupId = 'Lookup selection is required';
    }

    if (
      templateType === TemplateType.Record &&
      (formData.weight === undefined || formData.weight < 0)
    ) {
      newErrors.weight = 'Weight must be greater than or equal to 0';
    }

    // Validate min/max values if provided
    if (
      formData.minLength !== null &&
      formData.maxLength !== null &&
      formData.minLength !== undefined &&
      formData.maxLength !== undefined &&
      formData.minLength > formData.maxLength
    ) {
      newErrors.minLength = 'Min length cannot be greater than max length';
    }

    if (
      formData.minValue !== null &&
      formData.maxValue !== null &&
      formData.minValue !== undefined &&
      formData.maxValue !== undefined &&
      formData.minValue > formData.maxValue
    ) {
      newErrors.minValue = 'Min value cannot be greater than max value';
    }

    if (
      formData.minDate &&
      formData.maxDate &&
      new Date(formData.minDate) > new Date(formData.maxDate)
    ) {
      newErrors.minDate = 'Min date cannot be after max date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogTitle>{initialData ? 'Edit Field' : 'Add Field'}</DialogTitle>
        <DialogHeader className="mb-4">
          <DialogDescription>
            {initialData
              ? 'Update the field details below.'
              : 'Configure the details for the new field.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label" className="flex items-center">
                Label <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="label"
                value={formData.label || ''}
                onChange={(e) => {
                  setFormData({ ...formData, label: e.target.value });
                  if (errors.label) {
                    setErrors({ ...errors, label: '' });
                  }
                }}
                placeholder="Enter field label"
                className={errors.label ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.label && <p className="text-red-500 text-sm mt-1">{errors.label}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fieldType" className="flex items-center">
                Field Type <span className="text-red-500 ml-1">*</span>
              </Label>
              <select
                id="fieldType"
                value={formData.fieldType}
                onChange={(e) => {
                  const newFieldType = Number(e.target.value);
                  setFormData({
                    ...formData,
                    fieldType: newFieldType,
                    // Reset lookupId when field type changes (unless it's still Lookup)
                    lookupId: newFieldType === FieldType.Lookup ? formData.lookupId : null
                  });
                  if (errors.fieldType) {
                    setErrors({ ...errors, fieldType: '' });
                  }
                }}
                className={`flex h-10 w-full rounded-md border ${errors.fieldType ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 ${errors.fieldType ? 'focus-visible:ring-red-500' : 'focus-visible:ring-ring'} focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {Object.entries(FieldTypeMap).map(([value, label]) => (
                  <option key={`field-type-${value}`} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.fieldType && <p className="text-red-500 text-sm mt-1">{errors.fieldType}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeholder">Placeholder</Label>
              <Input
                id="placeholder"
                value={formData.placeholder || ''}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                placeholder="Enter placeholder text"
              />
            </div>

            {/* Lookup selection for Lookup field type */}
            {formData.fieldType === FieldType.Lookup && (
              <div className="space-y-2">
                <Label htmlFor="lookupId" className="flex items-center">
                  Lookup <span className="text-red-500 ml-1">*</span>
                </Label>
                <select
                  id="lookupId"
                  value={formData.lookupId || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, lookupId: Number(e.target.value) });
                    if (errors.lookupId) {
                      setErrors({ ...errors, lookupId: '' });
                    }
                  }}
                  className={`flex h-10 w-full rounded-md border ${errors.lookupId ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 ${errors.lookupId ? 'focus-visible:ring-red-500' : 'focus-visible:ring-ring'} focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                  disabled={loadingLookups}
                >
                  <option value="">Select a lookup</option>
                  {lookups.map((lookup) => (
                    <option key={lookup.id} value={lookup.id}>
                      {lookup.name} {lookup.isShared ? '(Shared)' : ''}
                    </option>
                  ))}
                </select>
                {loadingLookups && <p className="text-sm text-gray-500">Loading lookups...</p>}
                {errors.lookupId && <p className="text-red-500 text-sm mt-1">{errors.lookupId}</p>}
              </div>
            )}

            {/* Weight input, only for Record templates */}
            {templateType === TemplateType.Record && (
              <div className="space-y-2">
                <Label htmlFor="weight" className="flex items-center">
                  Weight <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="weight"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.weight || 0}
                  onChange={(e) => {
                    setFormData({ ...formData, weight: Number(e.target.value) });
                    if (errors.weight) {
                      setErrors({ ...errors, weight: '' });
                    }
                  }}
                  placeholder="Enter weight"
                  className={errors.weight ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                id="isRequired"
                type="checkbox"
                checked={formData.isRequired || false}
                onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isRequired">Required Field</Label>
            </div>

            {/* Read-only option for dropdown fields */}
            {formData.fieldType === FieldType.Dropdown && (
              <div className="flex items-center space-x-2">
                <input
                  id="readOnly"
                  type="checkbox"
                  checked={formData.readOnly || false}
                  onChange={(e) => setFormData({ ...formData, readOnly: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="readOnly">Read-only Options (managed externally)</Label>
              </div>
            )}

            {/* Additional validation fields based on field type */}
            {(formData.fieldType === FieldType.Text ||
              formData.fieldType === FieldType.TextArea) && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minLength">Min Length</Label>
                  <Input
                    id="minLength"
                    type="number"
                    min={0}
                    value={formData.minLength || ''}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : null;
                      setFormData({ ...formData, minLength: value });
                      if (errors.minLength) {
                        setErrors({ ...errors, minLength: '' });
                      }
                    }}
                    placeholder="Min length"
                    className={errors.minLength ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.minLength && (
                    <p className="text-red-500 text-sm mt-1">{errors.minLength}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLength">Max Length</Label>
                  <Input
                    id="maxLength"
                    type="number"
                    min={0}
                    value={formData.maxLength || ''}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : null;
                      setFormData({ ...formData, maxLength: value });
                    }}
                    placeholder="Max length"
                  />
                </div>
              </div>
            )}

            {formData.fieldType === FieldType.Number && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minValue">Min Value</Label>
                  <Input
                    id="minValue"
                    type="number"
                    value={formData.minValue || ''}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : null;
                      setFormData({ ...formData, minValue: value });
                      if (errors.minValue) {
                        setErrors({ ...errors, minValue: '' });
                      }
                    }}
                    placeholder="Min value"
                    className={errors.minValue ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.minValue && (
                    <p className="text-red-500 text-sm mt-1">{errors.minValue}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxValue">Max Value</Label>
                  <Input
                    id="maxValue"
                    type="number"
                    value={formData.maxValue || ''}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : null;
                      setFormData({ ...formData, maxValue: value });
                    }}
                    placeholder="Max value"
                  />
                </div>
              </div>
            )}

            {formData.fieldType === FieldType.Date && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minDate">Min Date</Label>
                  <Input
                    id="minDate"
                    type="date"
                    value={formData.minDate || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, minDate: e.target.value || null });
                      if (errors.minDate) {
                        setErrors({ ...errors, minDate: '' });
                      }
                    }}
                    className={errors.minDate ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.minDate && <p className="text-red-500 text-sm mt-1">{errors.minDate}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDate">Max Date</Label>
                  <Input
                    id="maxDate"
                    type="date"
                    value={formData.maxDate || ''}
                    onChange={(e) => setFormData({ ...formData, maxDate: e.target.value || null })}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </span>
              ) : initialData ? (
                'Update'
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const OptionForm = ({
  onSubmit,
  initialData,
  scoreCriteria,
  onCancel,
  isCheckboxField,
  templateType
}: {
  onSubmit: (data: Omit<FieldOption, 'id' | 'fieldId'>) => void;
  initialData?: FieldOption;
  scoreCriteria: ScoreCriteria[];
  onCancel: () => void;
  isCheckboxField?: boolean;
  templateType: TemplateType;
}) => {
  const defaultOption: Omit<FieldOption, 'id' | 'fieldId'> = {
    label: '',
    scoreCriteriaId: scoreCriteria.length > 0 ? scoreCriteria[0].id : 0,
    displayOrder: 1
  };

  const [formData, setFormData] = useState<Omit<FieldOption, 'id' | 'fieldId'>>(
    initialData || defaultOption
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        label: initialData.label,
        scoreCriteriaId: initialData.scoreCriteriaId,
        displayOrder: initialData.displayOrder
      });
    } else {
      // Only set default scoreCriteriaId if there are score criteria available
      setFormData({
        label: '',
        scoreCriteriaId: scoreCriteria.length > 0 ? scoreCriteria[0].id : 0,
        displayOrder: 1
      });
    }
    setErrors({});
  }, [initialData, scoreCriteria]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isCheckboxField && !formData.label?.trim()) {
      newErrors.label = 'Label is required';
    }

    // Validate score criteria for Record templates
    if (
      templateType === TemplateType.Record &&
      (formData.scoreCriteriaId === 0 || formData.scoreCriteriaId === null)
    ) {
      newErrors.scoreCriteria = 'Please select a valid score criteria.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // For checkbox fields, only update the score criteria
    if (isCheckboxField && initialData) {
      onSubmit({
        ...initialData,
        scoreCriteriaId:
          templateType === TemplateType.Record ? formData.scoreCriteriaId : (null as any)
      });
    } else {
      // Check if we have valid score criteria for Record templates
      if (
        templateType === TemplateType.Record &&
        (formData.scoreCriteriaId === 0 || formData.scoreCriteriaId === null)
      ) {
        setErrors({ scoreCriteria: 'Please select a valid score criteria.' });
        return;
      }

      // Prepare the submission data
      const submissionData: Omit<FieldOption, 'id' | 'fieldId'> = {
        label: formData.label,
        displayOrder: formData.displayOrder,
        scoreCriteriaId: formData.scoreCriteriaId
      };

      // Only include scoreCriteriaId if it's valid (greater than 0) and template type is Record
      if (templateType === TemplateType.Record) {
        if (formData.scoreCriteriaId > 0) {
          onSubmit(submissionData);
        } else {
          // For Record templates with invalid scoreCriteriaId, show error
          setErrors({ scoreCriteria: 'Please select a valid score criteria.' });
          return;
        }
      } else {
        // For non-Record templates, don't include scoreCriteriaId
        const { scoreCriteriaId, ...dataWithoutScoreCriteria } = submissionData;
        onSubmit(dataWithoutScoreCriteria as any);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isCheckboxField && (
        <div className="space-y-2">
          <Label htmlFor="label" className="flex items-center">
            Label <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="label"
            value={formData.label}
            onChange={(e) => {
              setFormData({ ...formData, label: e.target.value });
              if (errors.label) {
                setErrors({ ...errors, label: '' });
              }
            }}
            placeholder="Enter option label"
            className={errors.label ? 'border-red-500 focus-visible:ring-red-500' : ''}
            disabled={isCheckboxField}
          />
          {errors.label && <p className="text-red-500 text-sm mt-1">{errors.label}</p>}
        </div>
      )}

      {templateType === TemplateType.Record && (
        <>
          <Label htmlFor="scoreCriteriaId">Score Criteria</Label>
          {scoreCriteria.length === 0 ? (
            <div className="text-red-500 text-sm">
              No score criteria available. Please create score criteria first.
            </div>
          ) : (
            <select
              id="scoreCriteriaId"
              value={formData.scoreCriteriaId}
              onChange={(e) =>
                setFormData({ ...formData, scoreCriteriaId: Number(e.target.value) })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {scoreCriteria.map((criteria) => (
                <option key={`criteria-${criteria.id}`} value={criteria.id}>
                  {criteria.key} (Score: {criteria.score.toFixed(2)})
                </option>
              ))}
            </select>
          )}
          {errors.scoreCriteria && (
            <p className="text-red-500 text-sm mt-1">{errors.scoreCriteria}</p>
          )}
        </>
      )}

      {!isCheckboxField && (
        <div className="space-y-2">
          <Label htmlFor="displayOrder">Display Order</Label>
          <Input
            id="displayOrder"
            type="number"
            min={1}
            value={formData.displayOrder}
            onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
            placeholder="Enter display order"
            disabled={isCheckboxField}
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={templateType === TemplateType.Record && scoreCriteria.length === 0}
        >
          {isCheckboxField ? 'Update Score' : initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};

const FieldOptionsDialog = ({
  open,
  onOpenChange,
  field,
  options,
  scoreCriteria,
  onCreateOption,
  onUpdateOption,
  onDeleteOption,
  templateType
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: TemplateField | null;
  options: FieldOption[];
  scoreCriteria: ScoreCriteria[];
  onCreateOption: (option: Omit<FieldOption, 'id' | 'fieldId'>) => void;
  onUpdateOption: (optionId: number, option: Omit<FieldOption, 'id' | 'fieldId'>) => void;
  onDeleteOption: (option: FieldOption) => void;
  templateType: TemplateType;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedOption, setSelectedOption] = useState<FieldOption | null>(null);
  const isCheckboxField = field?.fieldType === FieldType.Checkbox;
  const isReadOnlyField = field?.readOnly || field?.fieldType === FieldType.Lookup;

  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setSelectedOption(null);
    }
  }, [open]);

  const handleCreateClick = () => {
    if (isCheckboxField) {
      toast({
        title: 'Not Allowed',
        description:
          'Cannot create new options for checkbox fields. Only score updates are allowed.',
        variant: 'destructive'
      });
      return;
    }
    if (isReadOnlyField) {
      toast({
        title: 'Not Allowed',
        description:
          field?.fieldType === FieldType.Lookup
            ? 'Cannot create new options for lookup fields. Options are managed through the lookup service.'
            : 'Cannot create new options for read-only dropdown fields. Options are managed externally.',
        variant: 'destructive'
      });
      return;
    }
    setSelectedOption(null);
    setIsEditing(true);
  };

  const handleEditClick = (option: FieldOption) => {
    setSelectedOption(option);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedOption(null);
  };

  const handleFormSubmit = (data: Omit<FieldOption, 'id' | 'fieldId'>) => {
    if (selectedOption && selectedOption.id) {
      onUpdateOption(selectedOption.id, data);
    } else {
      onCreateOption(data);
    }
    setIsEditing(false);
    setSelectedOption(null);
  };

  const handleDeleteClick = (option: FieldOption) => {
    if (isCheckboxField) {
      toast({
        title: 'Not Allowed',
        description: 'Cannot delete options for checkbox fields. Only score updates are allowed.',
        variant: 'destructive'
      });
      return;
    }
    if (isReadOnlyField) {
      toast({
        title: 'Not Allowed',
        description:
          field?.fieldType === FieldType.Lookup
            ? 'Cannot delete options for lookup fields. Options are managed through the lookup service.'
            : 'Cannot delete options for read-only dropdown fields. Options are managed externally.',
        variant: 'destructive'
      });
      return;
    }
    onDeleteOption(option);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-6">
        <DialogTitle>Field Options</DialogTitle>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-primary/10">
              <Icon
                name={
                  field?.fieldType === FieldType.Dropdown
                    ? 'arrow_drop_down_circle'
                    : field?.fieldType === FieldType.Radio
                      ? 'radio_button_checked'
                      : field?.fieldType === FieldType.Checkbox
                        ? 'check_box'
                        : field?.fieldType === FieldType.Lookup
                          ? 'list'
                          : 'list'
                }
                className="text-primary text-xl"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {field?.label || 'Field Options'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {isCheckboxField
                  ? 'Update score criteria for checkbox field'
                  : 'Define selectable options'}
              </p>
            </div>
          </div>
        </div>

        {isEditing ? (
          <OptionForm
            initialData={selectedOption || undefined}
            onSubmit={handleFormSubmit}
            scoreCriteria={scoreCriteria}
            onCancel={handleCancelEdit}
            isCheckboxField={isCheckboxField}
            templateType={templateType}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                {isCheckboxField ? 'Checkbox Score Criteria' : 'Available Options'}
              </h3>
              {!isCheckboxField && !isReadOnlyField && (
                <Button size="sm" onClick={handleCreateClick}>
                  <Icon name="add" className="mr-1" />
                  Add Option
                </Button>
              )}
            </div>

            {options.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <Icon name="list" className="mx-auto text-gray-400 text-3xl mb-2" />
                <p className="text-gray-600">
                  {isCheckboxField
                    ? 'No score criteria defined for this checkbox field yet.'
                    : isReadOnlyField
                      ? field?.fieldType === FieldType.Lookup
                        ? 'Lookup options are managed through the lookup service.'
                        : 'Read-only dropdown options are managed externally.'
                      : 'No options defined for this field yet.'}
                </p>
                {!isCheckboxField && !isReadOnlyField && (
                  <Button variant="outline" size="sm" className="mt-4" onClick={handleCreateClick}>
                    Add Your First Option
                  </Button>
                )}
              </div>
            ) : (
              <div className="border rounded-md">
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky top-0 bg-white z-10">Label</TableHead>
                        {templateType === TemplateType.Record && (
                          <TableHead className="sticky top-0 bg-white z-10">
                            Score Criteria
                          </TableHead>
                        )}
                        <TableHead className="sticky top-0 bg-white z-10">Order</TableHead>
                        <TableHead className="sticky top-0 bg-white z-10 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {options
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((option) => {
                          const criteria = scoreCriteria.find(
                            (c) => c.id === option.scoreCriteriaId
                          );
                          return (
                            <TableRow key={option.id}>
                              <TableCell className="font-medium">{option.label}</TableCell>
                              {templateType === TemplateType.Record && (
                                <TableCell>
                                  {criteria ? (
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        style={{
                                          backgroundColor: criteria.bgColor,
                                          color: criteria.color
                                        }}
                                      >
                                        {criteria.key}
                                      </Badge>
                                      <span className="text-sm text-gray-500">
                                        ({criteria.score.toFixed(2)})
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">Not assigned</span>
                                  )}
                                </TableCell>
                              )}
                              <TableCell>{option.displayOrder}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditClick(option)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Icon name="edit" className="text-gray-500" />
                                  </Button>
                                  {!isCheckboxField && !isReadOnlyField && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteClick(option)}
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Icon name="delete" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface ScoreCriteriaRange {
  id?: number;
  fieldId?: number;
  minValue: number;
  maxValue: number;
  scoreCriteriaId: number;
  displayOrder: number;
}

const ScoreCriteriaRangeForm = ({
  onSubmit,
  initialData,
  scoreCriteria,
  onCancel,
  existingRanges = [],
  templateId,
  fieldId
}: {
  onSubmit: (data: Omit<ScoreCriteriaRange, 'id' | 'fieldId'>) => void;
  initialData?: ScoreCriteriaRange;
  scoreCriteria: ScoreCriteria[];
  onCancel: () => void;
  existingRanges?: ScoreCriteriaRange[];
  templateId?: string;
  fieldId?: number;
}) => {
  const defaultRange: Omit<ScoreCriteriaRange, 'id' | 'fieldId'> = {
    minValue: 0,
    maxValue: 0,
    scoreCriteriaId: scoreCriteria.length > 0 ? scoreCriteria[0].id : 0,
    displayOrder: 1
  };

  const [formData, setFormData] = useState<Omit<ScoreCriteriaRange, 'id' | 'fieldId'>>(
    initialData || defaultRange
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverRanges, setServerRanges] = useState<ScoreCriteriaRange[]>(existingRanges);

  useEffect(() => {
    if (initialData) {
      setFormData({
        minValue: initialData.minValue,
        maxValue: initialData.maxValue,
        scoreCriteriaId: initialData.scoreCriteriaId,
        displayOrder: initialData.displayOrder
      });
    } else {
      // Only set default scoreCriteriaId if there are score criteria available
      setFormData({
        minValue: 0,
        maxValue: 0,
        scoreCriteriaId: scoreCriteria.length > 0 ? scoreCriteria[0].id : 0,
        displayOrder: 1
      });
    }
    setErrors({});
  }, [initialData, scoreCriteria]);

  // Fetch latest ranges from server when form is opened for creating new range
  useEffect(() => {
    const fetchLatestRanges = async () => {
      if (!initialData && templateId && fieldId) {
        try {
          const ranges = await templateService.getTemplateScoreCriteriaRanges(templateId, fieldId);
          setServerRanges(ranges);
        } catch (err) {
          console.error('Error fetching ranges:', err);
        }
      }
    };
    fetchLatestRanges();
  }, [initialData, templateId, fieldId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check if min and max values are the same
    if (formData.minValue === formData.maxValue) {
      newErrors.range = 'Minimum and maximum values cannot be the same';
    }

    // Check if min is greater than max
    if (formData.minValue > formData.maxValue) {
      newErrors.range = 'Minimum value cannot be greater than maximum value';
    }

    // Check if score criteria is valid
    if (formData.scoreCriteriaId === 0 || formData.scoreCriteriaId === null) {
      newErrors.scoreCriteria = 'Please select a valid score criteria.';
    }

    // Use serverRanges for validation when creating new range, otherwise use existingRanges
    const rangesToCheck = !initialData ? serverRanges : existingRanges;

    // Check for overlapping ranges and boundary conditions
    const hasOverlap = rangesToCheck.some((existingRange) => {
      // Skip the current range if we're editing
      if (initialData && existingRange.id === initialData.id) {
        return false;
      }

      // Check if the new range starts at the end of an existing range
      if (formData.minValue === existingRange.maxValue) {
        return true;
      }

      // Check if the new range ends at the start of an existing range
      if (formData.maxValue === existingRange.minValue) {
        return true;
      }

      // Check if the new range overlaps with any existing range
      return (
        // New range starts within an existing range
        (formData.minValue > existingRange.minValue &&
          formData.minValue < existingRange.maxValue) ||
        // New range ends within an existing range
        (formData.maxValue > existingRange.minValue &&
          formData.maxValue < existingRange.maxValue) ||
        // New range completely encompasses an existing range
        (formData.minValue <= existingRange.minValue && formData.maxValue >= existingRange.maxValue)
      );
    });

    if (hasOverlap) {
      newErrors.range =
        'This range overlaps with or connects to an existing range. Ranges must be distinct and non-adjacent.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check if we have valid score criteria
    if (formData.scoreCriteriaId === 0 || formData.scoreCriteriaId === null) {
      setErrors({ scoreCriteria: 'Please select a valid score criteria.' });
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minValue">Minimum Value</Label>
          <Input
            id="minValue"
            type="number"
            value={formData.minValue}
            onChange={(e) => {
              setFormData({ ...formData, minValue: Number(e.target.value) });
              if (errors.range) {
                setErrors({ ...errors, range: '' });
              }
            }}
            placeholder="Enter minimum value"
            className={errors.range ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxValue">Maximum Value</Label>
          <Input
            id="maxValue"
            type="number"
            value={formData.maxValue}
            onChange={(e) => {
              setFormData({ ...formData, maxValue: Number(e.target.value) });
              if (errors.range) {
                setErrors({ ...errors, range: '' });
              }
            }}
            placeholder="Enter maximum value"
            className={errors.range ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
        </div>
      </div>

      {errors.range && <p className="text-red-500 text-sm mt-1">{errors.range}</p>}

      <div className="space-y-2">
        <Label htmlFor="scoreCriteriaId">Score Criteria</Label>
        {scoreCriteria.length === 0 ? (
          <div className="text-red-500 text-sm">
            No score criteria available. Please create score criteria first.
          </div>
        ) : (
          <select
            id="scoreCriteriaId"
            value={formData.scoreCriteriaId}
            onChange={(e) => setFormData({ ...formData, scoreCriteriaId: Number(e.target.value) })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {scoreCriteria.map((criteria) => (
              <option key={`criteria-${criteria.id}`} value={criteria.id}>
                {criteria.key} (Score: {criteria.score.toFixed(2)})
              </option>
            ))}
          </select>
        )}
        {errors.scoreCriteria && (
          <p className="text-red-500 text-sm mt-1">{errors.scoreCriteria}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={scoreCriteria.length === 0}>
          {initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};

const SectionDialog = ({
  open,
  onOpenChange,
  onSubmit,
  initialData
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<TemplateSection, 'id' | 'fields'>) => void;
  initialData?: TemplateSection;
}) => {
  const [formData, setFormData] = useState<Omit<TemplateSection, 'id' | 'fields'>>({
    title: '',
    displayOrder: 1
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        displayOrder: initialData.displayOrder
      });
    } else {
      setFormData({
        title: '',
        displayOrder: 1
      });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogTitle>{initialData ? 'Edit Section' : 'Add Section'}</DialogTitle>
        <DialogHeader className="mb-4">
          <DialogDescription>
            {initialData
              ? 'Update the section details below.'
              : 'Configure the details for the new section.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center">
                Title <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter section title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                min={1}
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                placeholder="Enter display order"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{initialData ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ScoreCriteriaRangeDialog = ({
  open,
  onOpenChange,
  field,
  ranges,
  scoreCriteria,
  onCreateRange,
  onUpdateRange,
  onDeleteRange,
  templateId,
  fieldId
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: TemplateField | null;
  ranges: ScoreCriteriaRange[];
  scoreCriteria: ScoreCriteria[];
  onCreateRange: (range: Omit<ScoreCriteriaRange, 'id' | 'fieldId'>) => void;
  onUpdateRange: (rangeId: number, range: Omit<ScoreCriteriaRange, 'id' | 'fieldId'>) => void;
  onDeleteRange: (range: ScoreCriteriaRange) => void;
  templateId?: string;
  fieldId?: number;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRange, setSelectedRange] = useState<ScoreCriteriaRange | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rangeToDelete, setRangeToDelete] = useState<ScoreCriteriaRange | null>(null);
  const [localRanges, setLocalRanges] = useState<ScoreCriteriaRange[]>(ranges);

  // Update local ranges when ranges prop changes
  useEffect(() => {
    setLocalRanges(ranges);
  }, [ranges]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setSelectedRange(null);
      setDeleteDialogOpen(false);
      setRangeToDelete(null);
    }
  }, [open]);

  const handleCreateClick = () => {
    setSelectedRange(null);
    setIsEditing(true);
  };

  const handleEditClick = (range: ScoreCriteriaRange) => {
    setSelectedRange(range);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedRange(null);
  };

  const handleFormSubmit = async (data: Omit<ScoreCriteriaRange, 'id' | 'fieldId'>) => {
    try {
      if (selectedRange && selectedRange.id) {
        await onUpdateRange(selectedRange.id, data);
      } else {
        await onCreateRange(data);
      }
      setIsEditing(false);
      setSelectedRange(null);
    } catch (error) {
      // Error is handled by the parent component
      console.error('Error submitting range:', error);
    }
  };

  const confirmDeleteRange = (range: ScoreCriteriaRange) => {
    setRangeToDelete(range);
    setDeleteDialogOpen(true);
  };

  const handleDeleteRange = async () => {
    if (rangeToDelete && rangeToDelete.id) {
      try {
        await onDeleteRange(rangeToDelete);
        setDeleteDialogOpen(false);
        setRangeToDelete(null);
      } catch (error) {
        // Error is handled by the parent component
        console.error('Error deleting range:', error);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl p-6">
          <DialogTitle>Score Criteria Ranges</DialogTitle>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-primary/10">
                <Icon name="numbers" className="text-primary text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {field?.label || 'Number Field Ranges'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Define value ranges with score criteria
                </p>
              </div>
            </div>
          </div>

          {isEditing ? (
            <ScoreCriteriaRangeForm
              initialData={selectedRange || undefined}
              onSubmit={handleFormSubmit}
              scoreCriteria={scoreCriteria}
              onCancel={handleCancelEdit}
              existingRanges={localRanges}
              templateId={templateId}
              fieldId={fieldId}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Available Ranges</h3>
                <Button size="sm" onClick={handleCreateClick}>
                  <Icon name="add" className="mr-1" />
                  Add Range
                </Button>
              </div>

              {localRanges.length === 0 ? ( // Use localRanges instead of ranges prop
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <Icon name="numbers" className="mx-auto text-gray-400 text-3xl mb-2" />
                  <p className="text-gray-600">No ranges defined for this field yet.</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={handleCreateClick}>
                    Add Your First Range
                  </Button>
                </div>
              ) : (
                <div className="border rounded-md divide-y">
                  {localRanges // Use localRanges instead of ranges prop
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((range) => {
                      const criteria = scoreCriteria.find((c) => c.id === range.scoreCriteriaId);
                      return (
                        <div
                          key={range.id}
                          className="p-4 hover:bg-gray-50/50 transition-colors duration-150"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">
                                    {range.minValue} - {range.maxValue}
                                  </span>
                                  {criteria && (
                                    <Badge
                                      style={{
                                        backgroundColor: criteria.bgColor,
                                        color: criteria.color
                                      }}
                                    >
                                      {criteria.key} ({criteria.score.toFixed(2)})
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  Display Order: {range.displayOrder}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(range)}
                                className="h-8 w-8 p-0"
                              >
                                <Icon name="edit" className="text-gray-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDeleteRange(range)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Icon name="delete" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogTitle className="text-xl">Delete Range</DialogTitle>
          <DialogHeader className="mb-4">
            <DialogDescription className="mt-2">
              Are you sure you want to delete this range?
            </DialogDescription>
          </DialogHeader>

          {rangeToDelete && (
            <div className="py-4 space-y-4">
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-red-100 p-3 flex-shrink-0">
                    <Icon name="numbers" className="text-red-600 text-xl" />
                  </div>
                  <div>
                    <h4 className="font-medium text-lg text-gray-900">
                      {rangeToDelete.minValue} - {rangeToDelete.maxValue}
                    </h4>
                    {scoreCriteria.some((c) => c.id === rangeToDelete.scoreCriteriaId) && (
                      <div className="mt-2">
                        <Badge
                          style={{
                            backgroundColor: scoreCriteria.find(
                              (c) => c.id === rangeToDelete.scoreCriteriaId
                            )?.bgColor,
                            color: scoreCriteria.find((c) => c.id === rangeToDelete.scoreCriteriaId)
                              ?.color
                          }}
                        >
                          {scoreCriteria.find((c) => c.id === rangeToDelete.scoreCriteriaId)?.key} (
                          {scoreCriteria
                            .find((c) => c.id === rangeToDelete.scoreCriteriaId)
                            ?.score.toFixed(2)}
                          )
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 gap-3">
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteRange}>
              Delete Range
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const TemplateDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentLayout } = useLayout();
  const [template, setTemplate] = useState<Template | null>(null);
  const [scoreCriteria, setScoreCriteria] = useState<ScoreCriteria[]>([]);
  const [templateSections, setTemplateSections] = useState<TemplateSection[]>([]);
  const [fieldsWithoutSection, setFieldsWithoutSection] = useState<TemplateField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<TemplateField | null>(null);
  const [editingWeight, setEditingWeight] = useState<{ id: number; value: number } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<TemplateField | null>(null);

  // Field Options states
  const [fieldOptions, setFieldOptions] = useState<FieldOption[]>([]);
  const [optionsDialogOpen, setOptionsDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<FieldOption | null>(null);
  const [optionFieldId, setOptionFieldId] = useState<number | null>(null);
  const [deleteOptionDialogOpen, setDeleteOptionDialogOpen] = useState(false);
  const [optionToDelete, setOptionToDelete] = useState<FieldOption | null>(null);
  const [scoreCriteriaRanges, setScoreCriteriaRanges] = useState<ScoreCriteriaRange[]>([]);
  const [rangesDialogOpen, setRangesDialogOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<ScoreCriteriaRange | null>(null);
  const [rangeFieldId, setRangeFieldId] = useState<number | null>(null);
  const [deleteRangeDialogOpen, setDeleteRangeDialogOpen] = useState(false);
  const [rangeToDelete, setRangeToDelete] = useState<ScoreCriteriaRange | null>(null);

  // Section management states
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<TemplateSection | null>(null);
  const [deleteSectionDialogOpen, setDeleteSectionDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<TemplateSection | null>(null);
  const [fieldSectionId, setFieldSectionId] = useState<number | null>(null);

  // Collapse states
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [isPersonalInfoCollapsed, setIsPersonalInfoCollapsed] = useState(false);
  const [isFieldsWithoutSectionCollapsed, setIsFieldsWithoutSectionCollapsed] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTemplateDetails(id);
      fetchScoreCriteria(id);
      fetchTemplateFields(id);
    }
  }, [id]);

  const fetchTemplateDetails = async (templateId: string) => {
    try {
      setLoading(true);
      const data = await templateService.getTemplateById(templateId);
      setTemplate(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch template details');
      console.error('Error fetching template details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchScoreCriteria = async (templateId: string) => {
    try {
      const data = await templateService.getTemplateScoreCriteria(templateId);
      setScoreCriteria(data);
    } catch (err) {
      console.error('Error fetching score criteria:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch score criteria',
        variant: 'destructive'
      });
    }
  };

  // Helper function to get all fields from sections and fields without section
  const getAllTemplateFields = (): TemplateField[] => {
    const sectionFields = templateSections.flatMap((section) => section.fields);
    return [...sectionFields, ...fieldsWithoutSection];
  };

  const fetchTemplateFields = async (templateId: string) => {
    try {
      const data = await templateService.getTemplateFields(templateId);
      setTemplateSections(data.sections);
      setFieldsWithoutSection(data.fieldsWithoutSection);
    } catch (err) {
      console.error('Error fetching template fields:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch template fields',
        variant: 'destructive'
      });
    }
  };

  const handleScoreChange = async (criteriaId: number, newScore: number) => {
    if (!id) return;

    try {
      const criteriaToUpdate = scoreCriteria.find((c) => c.id === criteriaId);
      if (!criteriaToUpdate) {
        return;
      }

      // Force update even if the score hasn't changed significantly

      // Make absolutely sure we're sending the correct value
      const payload = {
        ...criteriaToUpdate,
        score: Number(newScore) // Ensure it's a number
      };

      await templateService.updateScoreCriteria(id, criteriaId, payload);

      // Update the local state with the new score
      setScoreCriteria((prev) =>
        prev.map((c) => (c.id === criteriaId ? { ...c, score: Number(newScore) } : c))
      );
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update score',
        variant: 'destructive'
      });
    }
  };

  const handleCreateField = async (field: Partial<TemplateField>) => {
    if (!id) return;

    try {
      const newField: Omit<TemplateField, 'id' | 'templateId'> = {
        label: field.label || '',
        fieldType: field.fieldType || FieldType.Text,
        weight: field.weight ?? 0,
        isRequired: field.isRequired || false,
        displayOrder: getAllTemplateFields().length + 1,
        placeholder: field.placeholder || '',
        minLength: field.minLength,
        maxLength: field.maxLength,
        minValue: field.minValue,
        maxValue: field.maxValue,
        minDate: field.minDate,
        maxDate: field.maxDate,
        pattern: field.pattern,
        lookupId: field.lookupId || null,
        sectionId: fieldSectionId || null,
        readOnly: field.readOnly || false
      };

      await templateService.createTemplateField(id, newField);

      // Refresh fields from server to get the latest data
      await fetchTemplateFields(id);
      setFieldDialogOpen(false);
      setFieldSectionId(null); // Clear section context

      toast({
        title: 'Success',
        description: fieldSectionId
          ? `Field created successfully in section.`
          : 'Field created successfully'
      });
    } catch (err) {
      console.error('Error creating field:', err);
      toast({
        title: 'Error',
        description: 'Failed to create field',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateField = async (fieldId: number, field: Partial<TemplateField>) => {
    if (!id) return;

    try {
      const currentField = getAllTemplateFields().find((f) => f.id === fieldId);
      if (!currentField) return;

      const updatedField: Omit<TemplateField, 'id' | 'templateId'> = {
        ...currentField,
        ...field,
        weight: field.weight ?? 0,
        lookupId: field.lookupId || null,
        readOnly: field.readOnly || false
      };

      await templateService.updateTemplateField(id, fieldId, updatedField);

      // Refresh fields from server to get the latest data
      await fetchTemplateFields(id);
      setFieldDialogOpen(false);
      setSelectedField(null);

      toast({
        title: 'Success',
        description: 'Field updated successfully'
      });
    } catch (err) {
      console.error('Error updating field:', err);
      toast({
        title: 'Error',
        description: 'Failed to update field',
        variant: 'destructive'
      });
    }
  };

  const confirmDeleteField = (field: TemplateField) => {
    setFieldToDelete(field);
    setDeleteDialogOpen(true);
  };

  const handleDeleteField = async (fieldId: number) => {
    if (!id) return;

    try {
      await templateService.deleteTemplateField(id, fieldId);

      // Refresh fields from server to get the latest data
      await fetchTemplateFields(id);

      toast({
        title: 'Success',
        description: 'Field deleted successfully'
      });
    } catch (err) {
      console.error('Error deleting field:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete field',
        variant: 'destructive'
      });
    } finally {
      setFieldToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleWeightChange = async (fieldId: number, weight: number) => {
    if (!id) return;

    try {
      await templateService.updateFieldWeight(id, fieldId, weight);

      // Refresh fields from server to get the latest data
      await fetchTemplateFields(id);

      toast({
        title: 'Success',
        description: 'Field weight updated successfully'
      });
    } catch (err) {
      console.error('Error updating field weight:', err);
      toast({
        title: 'Error',
        description: 'Failed to update field weight',
        variant: 'destructive'
      });
    } finally {
      setEditingWeight(null);
    }
  };

  // Field Options handlers
  const openOptionsDialog = async (fieldId: number) => {
    if (!id) return;

    setOptionFieldId(fieldId);

    try {
      const options = await templateService.getFieldOptions(id, fieldId);
      setFieldOptions(options);
      setOptionsDialogOpen(true);
    } catch (err) {
      console.error('Error fetching field options:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch field options',
        variant: 'destructive'
      });
    }
  };

  const handleCreateOption = async (option: Omit<FieldOption, 'id' | 'fieldId'>) => {
    if (!id || !optionFieldId) return;

    try {
      await templateService.createFieldOption(id, optionFieldId, option);

      // Refresh options from server
      const updatedOptions = await templateService.getFieldOptions(id, optionFieldId);
      setFieldOptions(updatedOptions);
      setSelectedOption(null);

      toast({
        title: 'Success',
        description: 'Option created successfully'
      });
    } catch (err) {
      console.error('Error creating option:', err);
      toast({
        title: 'Error',
        description: 'Failed to create option',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateOption = async (
    optionId: number,
    option: Omit<FieldOption, 'id' | 'fieldId'>
  ) => {
    if (!id || !optionFieldId) return;

    try {
      await templateService.updateFieldOption(id, optionFieldId, optionId, option);

      // Refresh options from server
      const updatedOptions = await templateService.getFieldOptions(id, optionFieldId);
      setFieldOptions(updatedOptions);
      setSelectedOption(null);

      toast({
        title: 'Success',
        description: 'Option updated successfully'
      });
    } catch (err) {
      console.error('Error updating option:', err);
      toast({
        title: 'Error',
        description: 'Failed to update option',
        variant: 'destructive'
      });
    }
  };

  const confirmDeleteOption = (option: FieldOption) => {
    setOptionToDelete(option);
    setDeleteOptionDialogOpen(true);
  };

  const handleDeleteOption = async (optionId: number) => {
    if (!id || !optionFieldId) return;

    try {
      await templateService.deleteFieldOption(id, optionFieldId, optionId);

      // Refresh options from server
      const updatedOptions = await templateService.getFieldOptions(id, optionFieldId);
      setFieldOptions(updatedOptions);

      toast({
        title: 'Success',
        description: 'Option deleted successfully'
      });
    } catch (err) {
      console.error('Error deleting option:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete option',
        variant: 'destructive'
      });
    } finally {
      setOptionToDelete(null);
      setDeleteOptionDialogOpen(false);
    }
  };

  const handleCreateRange = async (range: Omit<ScoreCriteriaRange, 'id' | 'fieldId'>) => {
    if (!id || !rangeFieldId) return;

    try {
      await templateService.createScoreCriteriaRange(id, rangeFieldId, range);

      // Refresh ranges from server
      const updatedRanges = await templateService.getTemplateScoreCriteriaRanges(id, rangeFieldId);
      setScoreCriteriaRanges(updatedRanges);

      toast({
        title: 'Success',
        description: 'Range created successfully'
      });
    } catch (err) {
      console.error('Error creating range:', err);
      toast({
        title: 'Error',
        description: 'Failed to create range',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateRange = async (
    rangeId: number,
    range: Omit<ScoreCriteriaRange, 'id' | 'fieldId'>
  ) => {
    if (!id || !rangeFieldId) return;

    try {
      await templateService.updateScoreCriteriaRange(id, rangeFieldId, rangeId, range);

      // Refresh ranges from server
      const updatedRanges = await templateService.getTemplateScoreCriteriaRanges(id, rangeFieldId);
      setScoreCriteriaRanges(updatedRanges);

      toast({
        title: 'Success',
        description: 'Range updated successfully'
      });
    } catch (err) {
      console.error('Error updating range:', err);
      toast({
        title: 'Error',
        description: 'Failed to update range',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteRange = async (range: ScoreCriteriaRange) => {
    if (!id || !rangeFieldId || !range.id) {
      toast({
        title: 'Error',
        description: 'Missing required information to delete range',
        variant: 'destructive'
      });
      return;
    }

    try {
      // First delete from server
      await templateService.deleteScoreCriteriaRange(id, rangeFieldId, range.id);

      // Then refresh ranges from server
      const updatedRanges = await templateService.getTemplateScoreCriteriaRanges(id, rangeFieldId);
      setScoreCriteriaRanges(updatedRanges);

      // Close the delete dialog
      setDeleteRangeDialogOpen(false);
      setRangeToDelete(null);

      toast({
        title: 'Success',
        description: 'Range deleted successfully'
      });
    } catch (err) {
      console.error('Error deleting range:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete range',
        variant: 'destructive'
      });
      throw err; // Re-throw to let the dialog component know about the error
    }
  };

  const confirmDeleteRange = (range: ScoreCriteriaRange) => {
    if (!range.id) {
      toast({
        title: 'Error',
        description: 'Invalid range selected for deletion',
        variant: 'destructive'
      });
      return;
    }
    setRangeToDelete(range);
    setDeleteRangeDialogOpen(true);
  };

  const fetchScoreCriteriaRanges = async (templateId: string, fieldId: number) => {
    try {
      const data = await templateService.getTemplateScoreCriteriaRanges(templateId, fieldId);
      setScoreCriteriaRanges(data);
    } catch (err) {
      console.error('Error fetching score criteria ranges:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch score criteria ranges',
        variant: 'destructive'
      });
    }
  };

  const handleOpenRangesDialog = async (field: TemplateField) => {
    if (field.fieldType !== FieldType.Number) {
      toast({
        title: 'Error',
        description: 'Score criteria ranges are only available for number fields',
        variant: 'destructive'
      });
      return;
    }

    if (!id || typeof field.id !== 'number') return;

    setRangeFieldId(field.id);
    // Fetch ranges before opening dialog
    await fetchScoreCriteriaRanges(id, field.id);
    setRangesDialogOpen(true);
  };

  const handleUpdateWeight = async (fieldId: number, newWeight: number) => {
    if (!id) return;

    try {
      const fieldToUpdate = getAllTemplateFields().find((f) => f.id === fieldId);
      if (!fieldToUpdate) return;

      const updatedField = await templateService.updateTemplateField(id, fieldId, {
        ...fieldToUpdate,
        weight: newWeight
      });

      // Refresh fields from server to get the latest data
      await fetchTemplateFields(id);
      setEditingWeight(null);

      toast({
        title: 'Success',
        description: 'Field weight updated successfully'
      });
    } catch (err) {
      console.error('Error updating field weight:', err);
      toast({
        title: 'Error',
        description: 'Failed to update field weight',
        variant: 'destructive'
      });
    }
  };

  const handleOpenReadOnlyOptionsDialog = async (fieldName: string) => {
    try {
      // For read-only fields, we'll create a mock field object to display in the dialog
      const mockField: TemplateField = {
        id: 0, // This won't be used for read-only fields
        label: fieldName,
        fieldType: FieldType.Dropdown,
        isRequired: true,
        placeholder: fieldName === 'Nationality' ? 'Select nationality' : 'Select country of birth',
        weight: 0,
        displayOrder: 0,
        sectionId: null,
        templateId: template?.id || 0,
        readOnly: true, // Mark as read-only
        lookupId: null
      };

      // Fetch real options from API for Nationality and Country of Birth fields
      let sampleOptions: FieldOption[] = [];
      if (fieldName === 'Nationality') {
        try {
          const nationalityData = await lookupService.getLookupValuesByKey('Nationality', {
            pageNumber: 1,
            pageSize: 100
          });
          sampleOptions = nationalityData.items.map((item, index) => ({
            id: item.id,
            fieldId: 0,
            label: item.value,
            displayOrder: index + 1,
            scoreCriteriaId: 0
          }));
        } catch (error) {
          console.error('Error fetching nationality options:', error);
          // Fallback to empty options if API fails
          sampleOptions = [];
        }
      } else if (fieldName === 'Country of Birth') {
        try {
          const countryOfBirthData = await lookupService.getLookupValuesByKey('CountryOfBirth', {
            pageNumber: 1,
            pageSize: 100
          });
          sampleOptions = countryOfBirthData.items.map((item, index) => ({
            id: item.id,
            fieldId: 0,
            label: item.value,
            displayOrder: index + 1,
            scoreCriteriaId: 0
          }));
        } catch (error) {
          console.error('Error fetching country of birth options:', error);
          // Fallback to empty options if API fails
          sampleOptions = [];
        }
      }

      // Set the selected field and options for the dialog
      setSelectedField(mockField);
      setFieldOptions(sampleOptions);
      setOptionsDialogOpen(true);
    } catch (error) {
      console.error('Error opening read-only options dialog:', error);
      toast({
        title: 'Error',
        description: 'Failed to open options dialog',
        variant: 'destructive'
      });
    }
  };

  // Section management functions
  const handleCreateSection = async (data: Omit<TemplateSection, 'id' | 'fields'>) => {
    if (!id) return;

    try {
      await templateService.createTemplateSection(id, data);

      // Refresh fields from server to get the latest data
      await fetchTemplateFields(id);
      setSectionDialogOpen(false);

      toast({
        title: 'Success',
        description: 'Section created successfully'
      });
    } catch (err) {
      console.error('Error creating section:', err);
      toast({
        title: 'Error',
        description: 'Failed to create section',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateSection = async (
    sectionId: number,
    data: Omit<TemplateSection, 'id' | 'fields'>
  ) => {
    if (!id) return;

    try {
      await templateService.updateTemplateSection(id, sectionId, data);

      // Refresh fields from server to get the latest data
      await fetchTemplateFields(id);
      setSectionDialogOpen(false);
      setSelectedSection(null);

      toast({
        title: 'Success',
        description: 'Section updated successfully'
      });
    } catch (err) {
      console.error('Error updating section:', err);
      toast({
        title: 'Error',
        description: 'Failed to update section',
        variant: 'destructive'
      });
    }
  };

  const confirmDeleteSection = (section: TemplateSection) => {
    setSectionToDelete(section);
    setDeleteSectionDialogOpen(true);
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!id) return;

    try {
      await templateService.deleteTemplateSection(id, sectionId);

      // Refresh fields from server to get the latest data
      await fetchTemplateFields(id);

      toast({
        title: 'Success',
        description: 'Section deleted successfully'
      });
    } catch (err) {
      console.error('Error deleting section:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete section',
        variant: 'destructive'
      });
    } finally {
      setSectionToDelete(null);
      setDeleteSectionDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-gray-500">Loading template details...</div>
        </div>
      </Container>
    );
  }

  if (error || !template) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-500 bg-red-50 px-4 py-2 rounded-lg">
            {error || 'Template not found'}
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          {/* Breadcrumb Navigation */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/templates">Templates</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{template.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Hero Section */}
          <div className="bg-white rounded-xl py-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-lg p-3 bg-primary/5">
                  <Icon name="description" className="text-primary text-2xl" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
                    {getStatusBadge(template.status)}
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Icon name="tag" className="text-gray-400" />
                      <span>Version {template.version}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Icon name="business" className="text-gray-400" />
                      <span>{template.tenantName}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <StatusIcon status={template.status} />
                      <span>{TemplateStatus[template.status]}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/templates')}
                  className="hover:bg-gray-50 gap-2"
                  size="sm"
                >
                  <Icon name="arrow_back" className="text-base" />
                  Back to Templates
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content in cards */}
        <div className="grid grid-cols-1 gap-8">
          {/* Scoring Section - Only show for Record templates */}
          {template.templateType === TemplateType.Record && (
            <Card className="overflow-hidden border shadow-sm">
              <CardHeader className="bg-gray-50/50 border-b px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon name="analytics" className="text-primary text-xl" />
                    <h2 className="text-xl font-semibold">Scoring Criteria</h2>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                    Applied to All Assessments
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-8">
                <ScoreCriteriaBar criteria={scoreCriteria} onChange={handleScoreChange} />
              </CardContent>
            </Card>
          )}

          {/* Template Details Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden shadow-sm">
              <CardHeader className="bg-gray-50/50 border-b px-6">
                <div className="flex items-center gap-3">
                  <Icon name="info" className="text-primary text-xl" />
                  <h2 className="text-lg font-semibold">Template Information</h2>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Version</p>
                      <p className="text-base text-gray-900">{template.version}</p>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Tenant</p>
                      <p className="text-base text-gray-900">{template.tenantName}</p>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <p className="text-base text-gray-900 flex items-center gap-2">
                        <StatusIcon status={template.status} />
                        {TemplateStatus[template.status]}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* History Section */}
            <Card className="overflow-hidden shadow-sm">
              <CardHeader className="bg-gray-50/50 border-b px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon name="history" className="text-primary text-xl" />
                    <h2 className="text-lg font-semibold">Activity History</h2>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2 text-primary">
                    <Icon name="tune" className="text-base" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="p-4 hover:bg-gray-50/50 transition-colors duration-150"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-blue-100 p-2 mt-1">
                          <Icon name="edit" className="text-blue-600 text-base" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-gray-900">Score criteria updated</p>
                            <span className="text-xs text-gray-500">2 days ago</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Values were updated from 1.5 to 2.0
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <div className="px-6 py-4 border-t bg-gray-50/50">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Icon name="expand_more" className="text-base" />
                  View More
                </Button>
              </div>
            </Card>
          </div>

          {/* Template Fields Section */}
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon name="edit_note" className="text-primary text-xl" />
                  <h2 className="text-xl font-semibold">Template Fields</h2>
                </div>
                <Button onClick={() => setSectionDialogOpen(true)}>
                  <Icon name="add" className="mr-1" />
                  Add Section
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Default Personal Information Section for Record Templates */}
              {template.templateType === TemplateType.Record && (
                <div className="border rounded-lg overflow-hidden mb-6">
                  <div className="bg-blue-50 px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon name="person" className="text-blue-600 text-xl" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Personal Information
                        </h3>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Read Only
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-blue-600 font-medium">Default Section</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsPersonalInfoCollapsed(!isPersonalInfoCollapsed)}
                          className="h-8 w-8 p-0"
                        >
                          <Icon
                            name="expand_more"
                            className={`text-blue-600 transition-transform duration-200 ${
                              isPersonalInfoCollapsed ? 'rotate-180' : ''
                            }`}
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {!isPersonalInfoCollapsed && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Field</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Required</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { label: 'First Name', type: 'Text', icon: 'person' },
                          { label: 'Last Name', type: 'Text', icon: 'person' },
                          { label: 'Date of Birth', type: 'Date', icon: 'calendar_today' },
                          { label: 'Nationality', type: 'Dropdown', icon: 'flag' },
                          { label: 'Middle Name', type: 'Text', icon: 'person' },
                          { label: 'Identification', type: 'Text', icon: 'badge' },
                          { label: 'Country of Birth', type: 'Dropdown', icon: 'public' },
                          { label: 'Customer Reference ID', type: 'Text', icon: 'tag' }
                        ].map((field, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="flex items-start gap-4">
                                <div className="rounded-lg p-2 bg-blue-100">
                                  <Icon name={field.icon} className="text-blue-600 text-xl" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{field.label}</div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    {field.label === 'Date of Birth'
                                      ? 'mm/dd/yyyy'
                                      : field.label === 'Nationality'
                                        ? 'Select nationality'
                                        : field.label === 'Country of Birth'
                                          ? 'Select country of birth'
                                          : ''}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {field.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {field.type === 'Dropdown' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenReadOnlyOptionsDialog(field.label)}
                                    className="text-xs"
                                  >
                                    <Icon name="list" className="mr-1" />
                                    Options
                                  </Button>
                                )}
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-gray-100 text-gray-600"
                                >
                                  Read Only
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {templateSections.length === 0 && fieldsWithoutSection.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="edit_note" className="mx-auto text-gray-400 text-4xl mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No sections or fields defined
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Add sections and fields to your template to start collecting data
                  </p>
                  <Button onClick={() => setSectionDialogOpen(true)}>
                    <Icon name="add" className="mr-1" />
                    Add Your First Section
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Sections */}
                  {templateSections.map((section) => (
                    <div key={section.id} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedField(null);
                                setFieldSectionId(section.id);
                                setFieldDialogOpen(true);
                              }}
                            >
                              <Icon name="add" className="mr-1" />
                              Add Field
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const sectionId = `section-${section.id}`;
                                setCollapsedSections((prev) => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(sectionId)) {
                                    newSet.delete(sectionId);
                                  } else {
                                    newSet.add(sectionId);
                                  }
                                  return newSet;
                                });
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Icon
                                name="expand_more"
                                className={`text-gray-500 transition-transform duration-200 ${
                                  collapsedSections.has(`section-${section.id}`) ? 'rotate-180' : ''
                                }`}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSection(section);
                                setSectionDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Icon name="edit" className="text-gray-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                confirmDeleteSection(section);
                              }}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Icon name="delete" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {!collapsedSections.has(`section-${section.id}`) && (
                        <div>
                          {section.fields.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50">
                              <Icon
                                name="edit_note"
                                className="mx-auto text-gray-400 text-2xl mb-2"
                              />
                              <p className="text-gray-500 mb-4">No fields in this section yet</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedField(null);
                                  setFieldSectionId(section.id);
                                  setFieldDialogOpen(true);
                                }}
                              >
                                <Icon name="add" className="mr-1" />
                                Add Your First Field
                              </Button>
                            </div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Field</TableHead>
                                  <TableHead>Type</TableHead>
                                  {template.templateType === TemplateType.Record && (
                                    <TableHead>Weight</TableHead>
                                  )}
                                  <TableHead>Required</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {section.fields.map((field) => {
                                  const fieldId = typeof field.id === 'number' ? field.id : null;
                                  console.log('Field data:', field, 'fieldId:', fieldId);

                                  return (
                                    <TableRow key={field.id}>
                                      <TableCell>
                                        <div className="flex items-start gap-4">
                                          <div className="rounded-lg p-2 bg-primary/10">
                                            <Icon
                                              name={
                                                field.fieldType === FieldType.Text
                                                  ? 'short_text'
                                                  : field.fieldType === FieldType.Number
                                                    ? 'numbers'
                                                    : field.fieldType === FieldType.Dropdown
                                                      ? 'arrow_drop_down_circle'
                                                      : field.fieldType === FieldType.Radio
                                                        ? 'radio_button_checked'
                                                        : field.fieldType === FieldType.Checkbox
                                                          ? 'check_box'
                                                          : field.fieldType === FieldType.Lookup
                                                            ? 'list_alt'
                                                            : 'list'
                                              }
                                              className="text-primary text-xl"
                                            />
                                          </div>
                                          <div>
                                            <div className="font-medium text-gray-900">
                                              {field.label}
                                            </div>
                                            {field.placeholder && (
                                              <div className="text-sm text-gray-500 mt-1">
                                                {field.placeholder}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-col gap-1">
                                          <Badge variant="outline" className="text-xs">
                                            {FieldTypeMap[field.fieldType]}
                                          </Badge>
                                          {field.fieldType === FieldType.Lookup &&
                                            field.lookupId && (
                                              <div className="text-xs text-gray-500">
                                                Lookup ID: {field.lookupId}
                                              </div>
                                            )}
                                          {field.readOnly && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
                                            >
                                              Read Only
                                            </Badge>
                                          )}
                                        </div>
                                      </TableCell>
                                      {template.templateType === TemplateType.Record && (
                                        <TableCell>
                                          {fieldId && (
                                            <div className="flex items-center gap-2">
                                              {editingWeight?.id === fieldId ? (
                                                <div className="flex items-center gap-2">
                                                  <Input
                                                    type="number"
                                                    min={0}
                                                    step={0.1}
                                                    value={editingWeight.value}
                                                    onChange={(e) =>
                                                      setEditingWeight({
                                                        id: fieldId,
                                                        value: Number(e.target.value)
                                                      })
                                                    }
                                                    className="w-20"
                                                  />
                                                  <Button
                                                    size="sm"
                                                    onClick={() =>
                                                      handleUpdateWeight(
                                                        fieldId,
                                                        editingWeight.value
                                                      )
                                                    }
                                                  >
                                                    <Icon name="check" className="text-green-500" />
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setEditingWeight(null)}
                                                  >
                                                    <Icon name="close" className="text-gray-500" />
                                                  </Button>
                                                </div>
                                              ) : (
                                                <div className="flex items-center gap-2">
                                                  <span className="text-sm font-medium">
                                                    {field.weight}
                                                  </span>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                      setEditingWeight({
                                                        id: fieldId,
                                                        value: field.weight
                                                      })
                                                    }
                                                  >
                                                    <Icon name="edit" className="text-gray-500" />
                                                  </Button>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </TableCell>
                                      )}
                                      <TableCell>
                                        {field.isRequired ? (
                                          <Badge variant="destructive" className="text-xs">
                                            Required
                                          </Badge>
                                        ) : (
                                          <span className="text-gray-500 text-sm">Optional</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                          {template.templateType === TemplateType.Record &&
                                            field.fieldType === FieldType.Number &&
                                            fieldId && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleOpenRangesDialog(field)}
                                              >
                                                <Icon name="score" className="mr-1" />
                                                Score Ranges
                                              </Button>
                                            )}
                                          {(field.fieldType === FieldType.Dropdown ||
                                            field.fieldType === FieldType.Radio ||
                                            field.fieldType === FieldType.Checkbox ||
                                            field.fieldType === FieldType.Lookup) &&
                                            field.sectionId && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openOptionsDialog(fieldId || 0)}
                                                disabled={!fieldId}
                                              >
                                                <Icon name="list" className="mr-1" />
                                                Options
                                              </Button>
                                            )}
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setSelectedField(field);
                                              setFieldDialogOpen(true);
                                            }}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Icon name="edit" className="text-gray-500" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setFieldToDelete(field);
                                              setDeleteDialogOpen(true);
                                            }}
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                          >
                                            <Icon name="delete" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Fields without section */}
                  {fieldsWithoutSection.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Fields Without Section
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedField(null);
                                setFieldSectionId(null);
                                setFieldDialogOpen(true);
                              }}
                            >
                              <Icon name="add" className="mr-1" />
                              Add Field
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setIsFieldsWithoutSectionCollapsed(!isFieldsWithoutSectionCollapsed)
                              }
                              className="h-8 w-8 p-0"
                            >
                              <Icon
                                name="expand_more"
                                className={`text-gray-500 transition-transform duration-200 ${
                                  isFieldsWithoutSectionCollapsed ? 'rotate-180' : ''
                                }`}
                              />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {!isFieldsWithoutSectionCollapsed && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Field</TableHead>
                              <TableHead>Type</TableHead>
                              {template.templateType === TemplateType.Record && (
                                <TableHead>Weight</TableHead>
                              )}
                              <TableHead>Required</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fieldsWithoutSection.map((field) => {
                              const fieldId = typeof field.id === 'number' ? field.id : null;
                              console.log(
                                'Field without section data:',
                                field,
                                'fieldId:',
                                fieldId
                              );

                              return (
                                <TableRow key={field.id}>
                                  <TableCell>
                                    <div className="flex items-start gap-4">
                                      <div className="rounded-lg p-2 bg-primary/10">
                                        <Icon
                                          name={
                                            field.fieldType === FieldType.Text
                                              ? 'short_text'
                                              : field.fieldType === FieldType.Number
                                                ? 'numbers'
                                                : field.fieldType === FieldType.Dropdown
                                                  ? 'arrow_drop_down_circle'
                                                  : field.fieldType === FieldType.Radio
                                                    ? 'radio_button_checked'
                                                    : field.fieldType === FieldType.Checkbox
                                                      ? 'check_box'
                                                      : field.fieldType === FieldType.Lookup
                                                        ? 'list_alt'
                                                        : 'list'
                                          }
                                          className="text-primary text-xl"
                                        />
                                      </div>
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          {field.label}
                                        </div>
                                        {field.placeholder && (
                                          <div className="text-sm text-gray-500 mt-1">
                                            {field.placeholder}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-1">
                                      <Badge variant="outline" className="text-xs">
                                        {FieldTypeMap[field.fieldType]}
                                      </Badge>
                                      {field.fieldType === FieldType.Lookup && field.lookupId && (
                                        <div className="text-xs text-gray-500">
                                          Lookup ID: {field.lookupId}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  {template.templateType === TemplateType.Record && (
                                    <TableCell>
                                      {fieldId && (
                                        <div className="flex items-center gap-2">
                                          {editingWeight?.id === fieldId ? (
                                            <div className="flex items-center gap-2">
                                              <Input
                                                type="number"
                                                min={0}
                                                step={0.1}
                                                value={editingWeight.value}
                                                onChange={(e) =>
                                                  setEditingWeight({
                                                    id: fieldId,
                                                    value: Number(e.target.value)
                                                  })
                                                }
                                                className="w-20"
                                              />
                                              <Button
                                                size="sm"
                                                onClick={() =>
                                                  handleUpdateWeight(fieldId, editingWeight.value)
                                                }
                                              >
                                                <Icon name="check" className="text-green-500" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setEditingWeight(null)}
                                              >
                                                <Icon name="close" className="text-gray-500" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-2">
                                              <span className="text-sm font-medium">
                                                {field.weight}
                                              </span>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  setEditingWeight({
                                                    id: fieldId,
                                                    value: field.weight
                                                  })
                                                }
                                              >
                                                <Icon name="edit" className="text-gray-500" />
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </TableCell>
                                  )}
                                  <TableCell>
                                    {field.isRequired ? (
                                      <Badge variant="destructive" className="text-xs">
                                        Required
                                      </Badge>
                                    ) : (
                                      <span className="text-gray-500 text-sm">Optional</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      {template.templateType === TemplateType.Record &&
                                        field.fieldType === FieldType.Number &&
                                        fieldId && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleOpenRangesDialog(field)}
                                          >
                                            <Icon name="score" className="mr-1" />
                                            Score Ranges
                                          </Button>
                                        )}
                                      {(field.fieldType === FieldType.Dropdown ||
                                        field.fieldType === FieldType.Radio ||
                                        field.fieldType === FieldType.Checkbox ||
                                        field.fieldType === FieldType.Lookup) &&
                                        field.sectionId && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openOptionsDialog(fieldId || 0)}
                                            disabled={!fieldId}
                                          >
                                            <Icon name="list" className="mr-1" />
                                            Options
                                          </Button>
                                        )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedField(field);
                                          setFieldDialogOpen(true);
                                        }}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Icon name="edit" className="text-gray-500" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setFieldToDelete(field);
                                          setDeleteDialogOpen(true);
                                        }}
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Icon name="delete" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8">
          <Button size="sm" className="shadow-sm gap-2">
            <Icon name="add" className="text-base" />
            New Version
          </Button>
        </div>

        {/* Field Dialog */}
        <TemplateFieldDialog
          open={fieldDialogOpen}
          onOpenChange={(open) => {
            setFieldDialogOpen(open);
            if (!open) {
              setFieldSectionId(null); // Clear section context when dialog closes
            }
          }}
          initialData={selectedField || undefined}
          onSubmit={(data) => {
            if (selectedField && selectedField.id) {
              handleUpdateField(selectedField.id, data);
            } else {
              handleCreateField(data);
            }
          }}
          templateType={template.templateType}
        />

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md p-6">
            <DialogTitle className="text-xl">Confirm Deletion</DialogTitle>
            <DialogHeader className="mb-4">
              <DialogDescription className="mt-2">
                Are you sure you want to delete this field?
              </DialogDescription>
            </DialogHeader>

            {fieldToDelete && (
              <div className="py-4 space-y-4">
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-red-100 p-3 flex-shrink-0">
                      <Icon
                        name={
                          fieldToDelete.fieldType === FieldType.Text
                            ? 'text_fields'
                            : fieldToDelete.fieldType === FieldType.Dropdown
                              ? 'arrow_drop_down_circle'
                              : fieldToDelete.fieldType === FieldType.Radio
                                ? 'radio_button_checked'
                                : fieldToDelete.fieldType === FieldType.Checkbox
                                  ? 'check_box'
                                  : fieldToDelete.fieldType === FieldType.Date
                                    ? 'calendar_month'
                                    : fieldToDelete.fieldType === FieldType.Number
                                      ? 'pin'
                                      : fieldToDelete.fieldType === FieldType.Lookup
                                        ? 'list_alt'
                                        : 'notes'
                        }
                        className="text-red-600 text-xl"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-lg text-gray-900">{fieldToDelete.label}</h4>
                      <p className="text-gray-500 mt-1">{FieldTypeMap[fieldToDelete.fieldType]}</p>
                    </div>
                  </div>
                </div>

                {fieldToDelete.isRequired && (
                  <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md border border-yellow-100 flex items-start gap-3">
                    <Icon name="warning" className="text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p>
                      This is a required field. Deleting it may affect existing assessments or
                      evaluations.
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="mt-6 gap-3">
              <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (fieldToDelete && fieldToDelete.id) {
                    handleDeleteField(fieldToDelete.id);
                  }
                }}
              >
                Delete Field
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Option Delete Confirmation Dialog */}
        <Dialog open={deleteOptionDialogOpen} onOpenChange={setDeleteOptionDialogOpen}>
          <DialogContent className="sm:max-w-md p-6">
            <DialogTitle className="text-xl">Delete Option</DialogTitle>
            <DialogHeader className="mb-4">
              <DialogDescription className="mt-2">
                Are you sure you want to delete this option?
              </DialogDescription>
            </DialogHeader>

            {optionToDelete && (
              <div className="py-4 space-y-4">
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-red-100 p-3 flex-shrink-0">
                      <Icon name="label" className="text-red-600 text-xl" />
                    </div>
                    <div>
                      <h4 className="font-medium text-lg text-gray-900">{optionToDelete.label}</h4>
                      {scoreCriteria.some((c) => c.id === optionToDelete.scoreCriteriaId) && (
                        <div className="mt-2">
                          <Badge
                            style={{
                              backgroundColor: scoreCriteria.find(
                                (c) => c.id === optionToDelete.scoreCriteriaId
                              )?.bgColor,
                              color: scoreCriteria.find(
                                (c) => c.id === optionToDelete.scoreCriteriaId
                              )?.color
                            }}
                          >
                            {
                              scoreCriteria.find((c) => c.id === optionToDelete.scoreCriteriaId)
                                ?.key
                            }{' '}
                            (
                            {scoreCriteria
                              .find((c) => c.id === optionToDelete.scoreCriteriaId)
                              ?.score.toFixed(2)}
                            )
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-6 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteOptionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (optionToDelete && optionToDelete.id) {
                    handleDeleteOption(optionToDelete.id);
                  }
                }}
              >
                Delete Option
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Field Options Dialog */}
        <FieldOptionsDialog
          open={optionsDialogOpen}
          onOpenChange={setOptionsDialogOpen}
          field={getAllTemplateFields().find((f) => f.id === optionFieldId) || null}
          options={fieldOptions}
          scoreCriteria={scoreCriteria}
          onCreateOption={handleCreateOption}
          onUpdateOption={handleUpdateOption}
          onDeleteOption={confirmDeleteOption}
          templateType={template.templateType}
        />

        <ScoreCriteriaRangeDialog
          open={rangesDialogOpen}
          onOpenChange={(open) => {
            setRangesDialogOpen(open);
            if (!open) {
              // Reset state when dialog closes
              setDeleteRangeDialogOpen(false);
              setRangeToDelete(null);
            }
          }}
          field={getAllTemplateFields().find((f) => f.id === rangeFieldId) || null}
          ranges={scoreCriteriaRanges}
          scoreCriteria={scoreCriteria}
          onCreateRange={handleCreateRange}
          onUpdateRange={handleUpdateRange}
          onDeleteRange={handleDeleteRange}
          templateId={id}
          fieldId={rangeFieldId || undefined}
        />

        {/* Section Dialog */}
        <SectionDialog
          open={sectionDialogOpen}
          onOpenChange={(open) => {
            setSectionDialogOpen(open);
            if (!open) {
              setSelectedSection(null);
              setFieldSectionId(null); // Clear section context
            }
          }}
          initialData={selectedSection || undefined}
          onSubmit={(data) => {
            if (selectedSection && selectedSection.id) {
              handleUpdateSection(selectedSection.id, data);
            } else {
              handleCreateSection(data);
            }
          }}
        />

        {/* Section Delete Confirmation Dialog */}
        <Dialog open={deleteSectionDialogOpen} onOpenChange={setDeleteSectionDialogOpen}>
          <DialogContent className="sm:max-w-md p-6">
            <DialogTitle className="text-xl">Confirm Deletion</DialogTitle>
            <DialogHeader className="mb-4">
              <DialogDescription className="mt-2">
                Are you sure you want to delete this section?
              </DialogDescription>
            </DialogHeader>

            {sectionToDelete && (
              <div className="py-4 space-y-4">
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-red-100 p-3 flex-shrink-0">
                      <Icon name="folder" className="text-red-600 text-xl" />
                    </div>
                    <div>
                      <h4 className="font-medium text-lg text-gray-900">{sectionToDelete.title}</h4>
                      <p className="text-gray-500 mt-1">
                        Display Order: {sectionToDelete.displayOrder}
                      </p>
                      <p className="text-gray-500">Fields: {sectionToDelete.fields.length}</p>
                    </div>
                  </div>
                </div>

                {sectionToDelete.fields.length > 0 && (
                  <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md border border-yellow-100 flex items-start gap-3">
                    <Icon name="warning" className="text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p>
                      This section contains {sectionToDelete.fields.length} field(s). Deleting it
                      will move all fields to "Fields Without Section".
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="mt-6 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteSectionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (sectionToDelete && sectionToDelete.id) {
                    handleDeleteSection(sectionToDelete.id);
                  }
                }}
              >
                Delete Section
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Container>
  );
};

export default TemplateDetailsPage;
