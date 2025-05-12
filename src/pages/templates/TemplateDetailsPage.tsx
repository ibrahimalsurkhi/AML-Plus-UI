import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { templateService, type Template, type ScoreCriteria, TemplateStatus } from '@/services/api';
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

  // Initialize thumb positions
  const [thumbPositions, setThumbPositions] = useState([1.8, 3, 5]);
  const [isDragging, setIsDragging] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const getValueFromEvent = (e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
    if (!sliderRef.current) return null;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const offsetX = clientX - rect.left;
    const percentage = Math.min(Math.max(offsetX / rect.width, 0), 1);
    return percentage * maxScore;
  };

  const updateThumbPosition = (index: number, newValue: number) => {
    // Don't update if not in edit mode or trying to move last thumb
    if (!isEditMode || index === 2) return;
    
    const newPositions = [...thumbPositions];
    
    // Ensure the new value is within valid range and doesn't cross other thumbs
    if (index === 0) {
      newPositions[0] = Math.min(Math.max(newValue, 0), newPositions[1] - 0.1);
    } else if (index === 1) {
      newPositions[1] = Math.min(Math.max(newValue, newPositions[0] + 0.1), newPositions[2] - 0.1);
    }
    
    setThumbPositions(newPositions);
    setHasChanges(true);
  };

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    // Don't handle if not in edit mode or trying to drag last thumb
    if (!isEditMode || index === 2) return;
    
    e.preventDefault();
    setIsDragging(index);

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const newValue = getValueFromEvent(e);
      if (newValue !== null) {
        updateThumbPosition(index, newValue);
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
    // Don't handle if not in edit mode or trying to drag last thumb
    if (!isEditMode || index === 2) return;
    
    e.preventDefault();
    setIsDragging(index);

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const newValue = getValueFromEvent(e);
      if (newValue !== null) {
        updateThumbPosition(index, newValue);
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
    toast({
      description: "You can now drag the sliders to adjust scores",
    });
  };

  const handleSave = () => {
    if (!onChange || !hasChanges) return;

    // Update criteria near both movable thumbs
    [0, 1].forEach(index => {
      const value = thumbPositions[index];
      const criteriaNearThumb = criteria.filter(c => 
        Math.abs(c.score - value) < 0.5
      );
      criteriaNearThumb.forEach(c => {
        onChange(c.id, value);
      });
    });

    setHasChanges(false);
    setIsEditMode(false);
    toast({
      title: "Success",
      description: "Score criteria updated successfully",
    });
  };

  const handleCancel = () => {
    // Reset to original positions
    setThumbPositions([1.8, 3, 5]);
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
              width: `${(thumbPositions[0] / maxScore) * 100}%`,
              borderRight: '2px solid white'
            }}
          />
          {/* Medium section */}
          <div
            className="h-full"
            style={{ 
              background: sections[1].color,
              width: `${((thumbPositions[1] - thumbPositions[0]) / maxScore) * 100}%`,
              borderRight: '2px solid white'
            }}
          />
          {/* High section */}
          <div
            className="h-full"
            style={{ 
              background: sections[2].color,
              width: `${((maxScore - thumbPositions[1]) / maxScore) * 100}%`
            }}
          />
        </div>

        {/* Thumbs */}
        {thumbPositions.map((value, idx) => (
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

export const TemplateDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentLayout } = useLayout();
  const [template, setTemplate] = useState<Template | null>(null);
  const [scoreCriteria, setScoreCriteria] = useState<ScoreCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchTemplateDetails(id);
      fetchScoreCriteria(id);
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

  const handleScoreChange = async (criteriaId: number, newScore: number) => {
    if (!id) return;
    try {
      const criteriaToUpdate = scoreCriteria.find(c => c.id === criteriaId);
      if (!criteriaToUpdate) return;

      await templateService.updateScoreCriteria(id, criteriaId, {
        ...criteriaToUpdate,
        score: newScore
      });
      
      // Refresh the list to get the updated scores
      //await fetchScoreCriteria(id);
    } catch (err) {
      console.error('Error updating score:', err);
      toast({
        title: "Error",
        description: "Failed to update score",
        variant: "destructive",
      });
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
        </div>

        {/* Quick Actions */}
        <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8">
          <Button size="sm" className="shadow-sm gap-2">
            <Icon name="add" className="text-base" />
            New Version
          </Button>
        </div>
      </div>
    </Container>
  );
};

export default TemplateDetailsPage; 