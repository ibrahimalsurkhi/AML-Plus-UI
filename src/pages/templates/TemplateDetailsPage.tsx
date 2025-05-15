import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { templateService, type Template, type ScoreCriteria, TemplateStatus, type TemplateField, FieldType, type FieldOption } from '@/services/api';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import { Tabs, Tab, TabPanel, TabsList } from '@/components/tabs';
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
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import '@/styles/material-icons.css';  // Make sure this CSS file exists and is properly configured
import '@/styles/score-slider.css';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
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
  const sliderRef = useRef<HTMLDivElement>(null);
  
  // Store modified criteria scores separately to track changes
  const [editedScores, setEditedScores] = useState<Record<number, number>>({});
  
  // Initialize boundaries and edited scores on mount or when criteria changes
  useEffect(() => {
    // Default boundaries from section definitions
    const initialBoundaries = [sections[0].range[1], sections[1].range[1]];
    setBoundaries(initialBoundaries);
    
    // Initialize edited scores with original values
    const initialScores: Record<number, number> = {};
    criteria.forEach(c => {
      initialScores[c.id] = c.score;
    });
    setEditedScores(initialScores);
  }, [criteria]);

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
    
    console.log(`Updated boundary ${index} to ${newBoundaries[index]}`);
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
    criteria.forEach(c => {
      currentScores[c.id] = c.score;
    });
    setEditedScores(currentScores);
    toast({
      description: "You can now drag the sliders to adjust score boundaries",
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
      console.log("Save canceled: onChange handler missing or no changes", { 
        hasOnChange: !!onChange, 
        hasChanges 
      });
      return;
    }

    console.log("CRITICAL: ScoreCriteriaBar handleSave called", {
      boundaries,
      hasChanges,
      criteriaCount: criteria.length
    });

    console.log("CRITICAL: Using actual slider positions to calculate scores");
    
    // Calculate section ranges based on current boundaries
    const lowRange = [0, boundaries[0]];
    const mediumRange = [boundaries[0], boundaries[1]];
    const highRange = [boundaries[1], maxScore];
    
    // Debug: print all criteria with their score ranges
    console.log("CRITICAL: Section ranges:", {
      low: lowRange,
      medium: mediumRange,
      high: highRange
    });
    
    console.log("CRITICAL: Current criteria:", criteria.map(c => ({ 
      id: c.id, 
      key: c.key, 
      score: c.score,
      // Determine which section each criterion is in based on its current score
      section: c.score <= boundaries[0] ? "LOW" : (c.score <= boundaries[1] ? "MEDIUM" : "HIGH")
    })));
    
    // Find criteria in each section
    const lowCriteria = criteria.filter(c => c.key.toLowerCase().includes('low'));
    const mediumCriteria = criteria.filter(c => c.key.toLowerCase().includes('medium'));
    const highCriteria = criteria.filter(c => c.key.toLowerCase().includes('high'));
    
    // Calculate scores based on actual slider positions
    const updateCriteriaScores = () => {
      // Process each criteria based on its key
      lowCriteria.forEach(c => {
        if (c && onChange) {
          // For low criteria, use first boundary value
          const targetScore = Number(boundaries[0]);
          console.log(`CRITICAL: Setting LOW criteria ${c.id} to score ${targetScore} based on first boundary`);
          
          setTimeout(() => {
            console.log(`CRITICAL: Dispatching update for LOW criteria ${c.id} with score ${targetScore}`);
            onChange(c.id, targetScore);
          }, 200 * criteria.indexOf(c));
        }
      });
      
      mediumCriteria.forEach(c => {
        if (c && onChange) {
          // For medium criteria, use second boundary value
          const targetScore = Number(boundaries[1]);
          console.log(`CRITICAL: Setting MEDIUM criteria ${c.id} to score ${targetScore} based on second boundary`);
          
          setTimeout(() => {
            console.log(`CRITICAL: Dispatching update for MEDIUM criteria ${c.id} with score ${targetScore}`);
            onChange(c.id, targetScore);
          }, 200 * criteria.indexOf(c));
        }
      });
      
      highCriteria.forEach(c => {
        if (c && onChange) {
          // For high criteria, use max score
          const targetScore = Number(maxScore);
          console.log(`CRITICAL: Setting HIGH criteria ${c.id} to score ${targetScore} based on max score`);
          
          setTimeout(() => {
            console.log(`CRITICAL: Dispatching update for HIGH criteria ${c.id} with score ${targetScore}`);
            onChange(c.id, targetScore);
          }, 200 * criteria.indexOf(c));
        }
      });
    };
    
    // Update all criteria
    updateCriteriaScores();

    setHasChanges(false);
    setIsEditMode(false);
    toast({
      title: "Success",
      description: "Score criteria updated successfully",
    });
  };

  const handleCancel = () => {
    // Reset to default section boundaries
    setBoundaries([sections[0].range[1], sections[1].range[1]]);
    setHasChanges(false);
    setIsEditMode(false);
    toast({
      description: "Changes cancelled",
    });
  };
  
  return (
    <div className="w-full space-y-6 px-4">
      {/* Section labels */}
      <div className="flex justify-between">
        {sections.map((section) => (
          <div
            key={section.key}
            className="text-sm font-semibold"
            style={{ color: section.textColor }}
          >
            {section.key}
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
                {value.toFixed(1)}
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
          {minScore}
        </div>
        <div className="absolute -bottom-6 right-0 text-sm text-gray-500 font-medium">
          {maxScore}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-4">
        {!isEditMode ? (
          <Button
            onClick={handleEnableEdit}
            className="gap-2"
            size="sm"
          >
            <Icon name="edit" className="text-base" />
            Update
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="gap-2"
              size="sm"
            >
              <Icon name="close" className="text-base" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="gap-2"
              size="sm"
            >
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

const InfoCard = ({ label, value, icon, valueIcon }: { 
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
              <div className={`text-gray-900 flex items-start gap-2 ${isLongText ? 'text-base' : 'text-xl font-semibold'}`}>
                <div className={`${!isExpanded && isLongText ? 'line-clamp-3' : ''}`}>
                  {value}
                </div>
                {valueIcon && <Icon name={valueIcon} className="text-gray-400 text-base mt-1 flex-shrink-0" />}
              </div>
              {isLongText && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary hover:text-primary/80 -ml-2 h-8"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <Icon name={isExpanded ? "expand_less" : "expand_more"} className="mr-1" />
                  {isExpanded ? "Show less" : "Read more"}
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
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Score Criteria' : 'Add Score Criteria'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update the score criteria details below.' : 'Fill in the details for the new score criteria.'}
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
            <Button type="submit">
              {initialData ? 'Update' : 'Create'}
            </Button>
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
  [FieldType.TextArea]: 'Text Area'
};

const TemplateFieldDialog = ({ 
  open, 
  onOpenChange,
  onSubmit,
  initialData
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<TemplateField>) => void;
  initialData?: TemplateField;
}) => {
  const defaultField: Partial<TemplateField> = {
    label: '',
    fieldType: FieldType.Text,
    weight: 1,
    isRequired: false,
    placeholder: '',
    displayOrder: 1
  };

  const [formData, setFormData] = useState<Partial<TemplateField>>(initialData || defaultField);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(defaultField);
    }
    setErrors({});
  }, [initialData, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate required fields
    if (!formData.label?.trim()) {
      newErrors.label = 'Label is required';
    }
    
    if (formData.fieldType === undefined) {
      newErrors.fieldType = 'Field type is required';
    }
    
    if (formData.weight === undefined || formData.weight <= 0) {
      newErrors.weight = 'Weight must be greater than 0';
    }
    
    // Validate min/max values if provided
    if (formData.minLength !== null && formData.maxLength !== null && 
        formData.minLength !== undefined && formData.maxLength !== undefined && 
        formData.minLength > formData.maxLength) {
      newErrors.minLength = 'Min length cannot be greater than max length';
    }
    
    if (formData.minValue !== null && formData.maxValue !== null && 
        formData.minValue !== undefined && formData.maxValue !== undefined && 
        formData.minValue > formData.maxValue) {
      newErrors.minValue = 'Min value cannot be greater than max value';
    }
    
    if (formData.minDate && formData.maxDate && 
        new Date(formData.minDate) > new Date(formData.maxDate)) {
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
        <DialogHeader className="mb-4">
          <DialogTitle>{initialData ? 'Edit Field' : 'Add Field'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update the field details below.' : 'Configure the details for the new field.'}
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
              {errors.label && (
                <p className="text-red-500 text-sm mt-1">{errors.label}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fieldType" className="flex items-center">
                Field Type <span className="text-red-500 ml-1">*</span>
              </Label>
              <select
                id="fieldType"
                value={formData.fieldType}
                onChange={(e) => {
                  setFormData({ ...formData, fieldType: Number(e.target.value) });
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
              {errors.fieldType && (
                <p className="text-red-500 text-sm mt-1">{errors.fieldType}</p>
              )}
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
            
            <div className="space-y-2">
              <Label htmlFor="weight" className="flex items-center">
                Weight <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="weight"
                type="number"
                min={1}
                max={100}
                value={formData.weight || ''}
                onChange={(e) => {
                  setFormData({ ...formData, weight: Number(e.target.value) });
                  if (errors.weight) {
                    setErrors({ ...errors, weight: '' });
                  }
                }}
                placeholder="Enter weight"
                className={errors.weight ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.weight && (
                <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
              )}
            </div>
            
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
            
            {/* Additional validation fields based on field type */}
            {(formData.fieldType === FieldType.Text || formData.fieldType === FieldType.TextArea) && (
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
                  {errors.minDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.minDate}</p>
                  )}
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
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : initialData ? 'Update' : 'Create'}
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
  onCancel
}: { 
  onSubmit: (data: Omit<FieldOption, 'id' | 'fieldId'>) => void;
  initialData?: FieldOption;
  scoreCriteria: ScoreCriteria[];
  onCancel: () => void;
}) => {
  const defaultOption: Omit<FieldOption, 'id' | 'fieldId'> = {
    label: '',
    scoreCriteriaId: scoreCriteria.length > 0 ? scoreCriteria[0].id : 0,
    displayOrder: 1
  };

  const [formData, setFormData] = useState<Omit<FieldOption, 'id' | 'fieldId'>>(initialData || defaultOption);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        label: initialData.label,
        scoreCriteriaId: initialData.scoreCriteriaId,
        displayOrder: initialData.displayOrder
      });
    } else {
      setFormData(defaultOption);
    }
    setErrors({});
  }, [initialData, scoreCriteria]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.label?.trim()) {
      newErrors.label = 'Label is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        />
        {errors.label && (
          <p className="text-red-500 text-sm mt-1">{errors.label}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="scoreCriteriaId">Score Criteria</Label>
        <select
          id="scoreCriteriaId"
          value={formData.scoreCriteriaId}
          onChange={(e) => setFormData({ ...formData, scoreCriteriaId: Number(e.target.value) })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {scoreCriteria.map((criteria) => (
            <option key={`criteria-${criteria.id}`} value={criteria.id}>
              {criteria.key} (Score: {criteria.score})
            </option>
          ))}
        </select>
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
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update' : 'Create'}
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
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: TemplateField | null;
  options: FieldOption[];
  scoreCriteria: ScoreCriteria[];
  onCreateOption: (option: Omit<FieldOption, 'id' | 'fieldId'>) => void;
  onUpdateOption: (optionId: number, option: Omit<FieldOption, 'id' | 'fieldId'>) => void;
  onDeleteOption: (option: FieldOption) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedOption, setSelectedOption] = useState<FieldOption | null>(null);

  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setSelectedOption(null);
    }
  }, [open]);

  const handleCreateClick = () => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-primary/10">
              <Icon 
                name={
                  field?.fieldType === FieldType.Dropdown ? "arrow_drop_down_circle" :
                  field?.fieldType === FieldType.Radio ? "radio_button_checked" :
                  field?.fieldType === FieldType.Checkbox ? "check_box" : "list"
                } 
                className="text-primary text-xl"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {field?.label || 'Field Options'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Define selectable options with score values
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
          />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Available Options</h3>
              <Button size="sm" onClick={handleCreateClick}>
                <Icon name="add" className="mr-1" />
                Add Option
              </Button>
            </div>
            
            {options.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <Icon name="list" className="mx-auto text-gray-400 text-3xl mb-2" />
                <p className="text-gray-600">No options defined for this field yet.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={handleCreateClick}
                >
                  Add Your First Option
                </Button>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>Score Criteria</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {options
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((option) => {
                        const criteria = scoreCriteria.find(c => c.id === option.scoreCriteriaId);
                        return (
                          <TableRow key={option.id}>
                            <TableCell className="font-medium">{option.label}</TableCell>
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
                                  <span className="text-sm text-gray-500">({criteria.score})</span>
                                </div>
                              ) : (
                                <span className="text-gray-500">Not assigned</span>
                              )}
                            </TableCell>
                            <TableCell>{option.displayOrder}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleEditClick(option)}
                                >
                                  <Icon name="edit" className="text-gray-500" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => onDeleteOption(option)}
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
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const TemplateDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentLayout } = useLayout();
  const [template, setTemplate] = useState<Template | null>(null);
  const [scoreCriteria, setScoreCriteria] = useState<ScoreCriteria[]>([]);
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<TemplateField | null>(null);
  const [editingWeight, setEditingWeight] = useState<{ id: number, value: number } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<TemplateField | null>(null);
  
  // Field Options states
  const [fieldOptions, setFieldOptions] = useState<FieldOption[]>([]);
  const [optionsDialogOpen, setOptionsDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<FieldOption | null>(null);
  const [optionFieldId, setOptionFieldId] = useState<number | null>(null);
  const [deleteOptionDialogOpen, setDeleteOptionDialogOpen] = useState(false);
  const [optionToDelete, setOptionToDelete] = useState<FieldOption | null>(null);

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
        title: "Error",
        description: "Failed to fetch score criteria",
        variant: "destructive",
      });
    }
  };

  const fetchTemplateFields = async (templateId: string) => {
    try {
      const data = await templateService.getTemplateFields(templateId);
      setTemplateFields(data);
    } catch (err) {
      console.error('Error fetching template fields:', err);
      toast({
        title: "Error",
        description: "Failed to fetch template fields",
        variant: "destructive",
      });
    }
  };

  const handleScoreChange = async (criteriaId: number, newScore: number) => {
    if (!id) return;
    
    console.log(`CRITICAL: Updating criteria ${criteriaId} with new score ${newScore}`);
    
    try {
      const criteriaToUpdate = scoreCriteria.find(c => c.id === criteriaId);
      if (!criteriaToUpdate) {
        console.error(`Could not find criteria with ID ${criteriaId}`);
        return;
      }
      
      // Force update even if the score hasn't changed significantly
      // This ensures that clicking the Update button will always send updates to the server
      
      console.log(`CRITICAL: Sending API request to update criteria ${criteriaId}`, {
        current: criteriaToUpdate,
        newScore: newScore
      });
      
      // Make absolutely sure we're sending the correct value
      const payload = {
        ...criteriaToUpdate,
        score: Number(newScore) // Ensure it's a number
      };
      
      console.log(`CRITICAL: Final payload for criteria ${criteriaId}:`, payload);
      
      await templateService.updateScoreCriteria(id, criteriaId, payload);
      
      console.log(`CRITICAL: Successfully updated criteria ${criteriaId} to ${newScore}`);
      
      // Update the local state with the new score
      setScoreCriteria(prev => 
        prev.map(c => c.id === criteriaId ? {...c, score: Number(newScore)} : c)
      );
    } catch (err) {
      console.error('Error updating score:', err);
      toast({
        title: "Error",
        description: "Failed to update score",
        variant: "destructive",
      });
    }
  };

  const handleCreateField = async (field: Partial<TemplateField>) => {
    if (!id) return;

    try {
      const newField: Omit<TemplateField, 'id' | 'templateId'> = {
        label: field.label || '',
        fieldType: field.fieldType || FieldType.Text,
        weight: field.weight || 1,
        isRequired: field.isRequired || false,
        displayOrder: templateFields.length + 1,
        placeholder: field.placeholder || '',
        minLength: field.minLength,
        maxLength: field.maxLength,
        minValue: field.minValue,
        maxValue: field.maxValue,
        minDate: field.minDate,
        maxDate: field.maxDate,
        pattern: field.pattern
      };

      await templateService.createTemplateField(id, newField);
      
      // Refresh fields from server to get the latest data
      await fetchTemplateFields(id);
      setFieldDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Field created successfully",
      });
    } catch (err) {
      console.error('Error creating field:', err);
      toast({
        title: "Error",
        description: "Failed to create field",
        variant: "destructive",
      });
    }
  };

  const handleUpdateField = async (fieldId: number, field: Partial<TemplateField>) => {
    if (!id) return;

    try {
      const currentField = templateFields.find(f => f.id === fieldId);
      if (!currentField) return;

      const updatedField: Omit<TemplateField, 'id' | 'templateId'> = {
        ...currentField,
        ...field
      };

      await templateService.updateTemplateField(id, fieldId, updatedField);
      
      // Refresh fields from server to get the latest data
      await fetchTemplateFields(id);
      setFieldDialogOpen(false);
      setSelectedField(null);
      
      toast({
        title: "Success",
        description: "Field updated successfully",
      });
    } catch (err) {
      console.error('Error updating field:', err);
      toast({
        title: "Error",
        description: "Failed to update field",
        variant: "destructive",
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
        title: "Success",
        description: "Field deleted successfully",
      });
    } catch (err) {
      console.error('Error deleting field:', err);
      toast({
        title: "Error",
        description: "Failed to delete field",
        variant: "destructive",
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
        title: "Success",
        description: "Field weight updated successfully",
      });
    } catch (err) {
      console.error('Error updating field weight:', err);
      toast({
        title: "Error",
        description: "Failed to update field weight",
        variant: "destructive",
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
        title: "Error",
        description: "Failed to fetch field options",
        variant: "destructive",
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
        title: "Success",
        description: "Option created successfully",
      });
    } catch (err) {
      console.error('Error creating option:', err);
      toast({
        title: "Error",
        description: "Failed to create option",
        variant: "destructive",
      });
    }
  };

  const handleUpdateOption = async (optionId: number, option: Omit<FieldOption, 'id' | 'fieldId'>) => {
    if (!id || !optionFieldId) return;

    try {
      await templateService.updateFieldOption(id, optionFieldId, optionId, option);
      
      // Refresh options from server
      const updatedOptions = await templateService.getFieldOptions(id, optionFieldId);
      setFieldOptions(updatedOptions);
      setSelectedOption(null);
      
      toast({
        title: "Success",
        description: "Option updated successfully",
      });
    } catch (err) {
      console.error('Error updating option:', err);
      toast({
        title: "Error",
        description: "Failed to update option",
        variant: "destructive",
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
        title: "Success",
        description: "Option deleted successfully",
      });
    } catch (err) {
      console.error('Error deleting option:', err);
      toast({
        title: "Error",
        description: "Failed to delete option",
        variant: "destructive",
      });
    } finally {
      setOptionToDelete(null);
      setDeleteOptionDialogOpen(false);
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
          {/* Scoring Section */}
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
              <ScoreCriteriaBar 
                criteria={scoreCriteria} 
                onChange={handleScoreChange}
              />
            </CardContent>
          </Card>

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
                    <div key={item} className="p-4 hover:bg-gray-50/50 transition-colors duration-150">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-blue-100 p-2 mt-1">
                          <Icon name="edit" className="text-blue-600 text-base" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-gray-900">Score criteria updated</p>
                            <span className="text-xs text-gray-500">2 days ago</span>
                          </div>
                          <p className="text-sm text-gray-600">Values were updated from 1.5 to 2.0</p>
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
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon name="list_alt" className="text-primary text-xl" />
                  <h2 className="text-lg font-semibold">Template Fields</h2>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setSelectedField(null);
                    setFieldDialogOpen(true);
                  }}
                  className="gap-2"
                >
                  <Icon name="add" className="text-base" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {templateFields.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Icon name="article" className="text-gray-400 text-xl" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No fields defined</h3>
                  <p className="text-gray-500 mb-4">Add fields to collect data for this template</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedField(null);
                      setFieldDialogOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Icon name="add" className="text-base" />
                    Add First Field
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Distribution (%)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templateFields.map((field) => (
                      <TableRow 
                        key={field.id}
                        className="hover:bg-gray-50"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="rounded-full bg-primary/10 p-1.5 flex-shrink-0">
                              <Icon 
                                name={
                                  field.fieldType === FieldType.Text ? "text_fields" :
                                  field.fieldType === FieldType.Dropdown ? "arrow_drop_down_circle" :
                                  field.fieldType === FieldType.Radio ? "radio_button_checked" :
                                  field.fieldType === FieldType.Checkbox ? "check_box" :
                                  field.fieldType === FieldType.Date ? "calendar_month" :
                                  field.fieldType === FieldType.Number ? "pin" :
                                  "notes"
                                } 
                                className="text-primary text-sm" 
                              />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {field.label}
                              </div>
                              {field.placeholder && (
                                <div className="text-xs text-gray-500 italic mt-1">
                                  "{field.placeholder}"
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {FieldTypeMap[field.fieldType]}
                        </TableCell>
                        <TableCell>
                          {field.isRequired ? (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                              Required
                            </Badge>
                          ) : (
                            <span className="text-gray-500 text-sm">Optional</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              className="w-16 h-8 text-sm"
                              value={editingWeight && field.id === editingWeight.id ? editingWeight.value : field.weight}
                              onChange={(e) => {
                                const value = parseInt(e.target.value, 10);
                                if (!isNaN(value) && value > 0 && field.id) {
                                  setEditingWeight({ id: field.id, value });
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && field.id && editingWeight && editingWeight.id === field.id) {
                                  handleWeightChange(field.id, editingWeight.value);
                                } else if (e.key === 'Escape') {
                                  setEditingWeight(null);
                                }
                              }}
                              onBlur={() => {
                                if (field.id && editingWeight && editingWeight.id === field.id && editingWeight.value !== field.weight) {
                                  handleWeightChange(field.id, editingWeight.value);
                                } else {
                                  setEditingWeight(null);
                                }
                              }}
                              onFocus={() => {
                                if (field.id) {
                                  setEditingWeight({ id: field.id, value: field.weight });
                                }
                              }}
                  />
                </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            // Calculate the total weight of all fields
                            const totalWeight = templateFields.reduce((sum, field) => sum + field.weight, 0);
                            
                            // Calculate the percentage distribution for this field
                            const percentage = totalWeight > 0 ? (field.weight / totalWeight) * 100 : 0;
                            
                            return (
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                  <div 
                                    className="bg-primary h-2.5 rounded-full" 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span>{percentage.toFixed(1)}%</span>
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* Only show options button for field types that can have options */}
                            {(field.fieldType === FieldType.Dropdown || 
                              field.fieldType === FieldType.Radio ||
                              field.fieldType === FieldType.Checkbox) && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="mr-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (field.id) openOptionsDialog(field.id);
                                }}
                              >
                                <Icon name="list" className="mr-1" />
                                Options
                  </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setSelectedField(field);
                                setFieldDialogOpen(true);
                              }}
                            >
                              <Icon name="edit" className="text-gray-500" />
                  </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                if (field.id) confirmDeleteField(field);
                              }}
                            >
                              <Icon name="delete" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {templateFields.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No fields found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
          onOpenChange={setFieldDialogOpen}
          initialData={selectedField || undefined}
          onSubmit={(data) => {
            if (selectedField && selectedField.id) {
              handleUpdateField(selectedField.id, data);
            } else {
              handleCreateField(data);
            }
          }}
        />

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl">Confirm Deletion</DialogTitle>
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
                          fieldToDelete.fieldType === FieldType.Text ? "text_fields" :
                          fieldToDelete.fieldType === FieldType.Dropdown ? "arrow_drop_down_circle" :
                          fieldToDelete.fieldType === FieldType.Radio ? "radio_button_checked" :
                          fieldToDelete.fieldType === FieldType.Checkbox ? "check_box" :
                          fieldToDelete.fieldType === FieldType.Date ? "calendar_month" :
                          fieldToDelete.fieldType === FieldType.Number ? "pin" :
                          "notes"
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
                    <p>This is a required field. Deleting it may affect existing assessments or evaluations.</p>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter className="mt-6 gap-3">
              <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
                    </Button>
              <Button type="button" variant="destructive" onClick={() => {
                if (fieldToDelete && fieldToDelete.id) {
                  handleDeleteField(fieldToDelete.id);
                }
              }}>
                Delete Field
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Option Delete Confirmation Dialog */}
        <Dialog open={deleteOptionDialogOpen} onOpenChange={setDeleteOptionDialogOpen}>
          <DialogContent className="sm:max-w-md p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl">Delete Option</DialogTitle>
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
                      {scoreCriteria.some(c => c.id === optionToDelete.scoreCriteriaId) && (
                        <div className="mt-2">
                          <Badge 
                            style={{ 
                              backgroundColor: scoreCriteria.find(c => c.id === optionToDelete.scoreCriteriaId)?.bgColor,
                              color: scoreCriteria.find(c => c.id === optionToDelete.scoreCriteriaId)?.color 
                            }}
                          >
                            {scoreCriteria.find(c => c.id === optionToDelete.scoreCriteriaId)?.key}
                          </Badge>
                  </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="mt-6 gap-3">
              <Button type="button" variant="outline" onClick={() => setDeleteOptionDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={() => {
                if (optionToDelete && optionToDelete.id) {
                  handleDeleteOption(optionToDelete.id);
                }
              }}>
                Delete Option
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Field Options Dialog */}
        <FieldOptionsDialog
          open={optionsDialogOpen}
          onOpenChange={setOptionsDialogOpen}
          field={templateFields.find(f => f.id === optionFieldId) || null}
          options={fieldOptions}
          scoreCriteria={scoreCriteria}
          onCreateOption={handleCreateOption}
          onUpdateOption={handleUpdateOption}
          onDeleteOption={confirmDeleteOption}
        />
        </div>
      </Container>
  );
};

export default TemplateDetailsPage; 