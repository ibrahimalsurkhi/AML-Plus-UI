import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading, ToolbarActions } from '@/partials/toolbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { recordService, caseService, type DetailedRecord, type DetailedFieldResponse, type DetailedTemplateField, type Case, type PaginatedResponse, type RecalculationResponse } from '@/services/api';
import { DataPagination, extractPaginationData } from '@/components/common/DataPagination';
import { toast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  User,
  Shield, 
  FileText, 
  DollarSign, 
  Calendar,
  Hash,
  MapPin,
  Flag,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  FileSearch,
  Eye,
  Calculator
} from 'lucide-react';

const RecordDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<DetailedRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<Case[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesError, setCasesError] = useState<string | null>(null);
  const [casesPagination, setCasesPagination] = useState<PaginatedResponse<Case> | null>(null);
  const [casesCurrentPage, setCasesCurrentPage] = useState(1);
  const [casesPageSize] = useState(3);
  const [recalculating, setRecalculating] = useState(false);
  const [newlyCreatedCaseId, setNewlyCreatedCaseId] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      fetchRecordDetails(id);
      // Reset to page 1 when record changes
      if (casesCurrentPage !== 1) {
        setCasesCurrentPage(1);
      } else {
        fetchCases(id, 1);
      }
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchCases(id, casesCurrentPage);
    }
  }, [casesCurrentPage]);

  const fetchRecordDetails = async (recordUuid: string) => {
      try {
        setLoading(true);
      const response = await recordService.getRecordDetails(recordUuid);
      setRecord(response);
      } catch (error) {
        console.error('Error fetching record details:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch record details. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

  const fetchCases = async (recordUuid: string, page: number = 1) => {
    try {
      setCasesLoading(true);
      setCasesError(null);
      const response = await caseService.getCases({
        pageNumber: page,
        pageSize: casesPageSize,
        recordUuid
      });
      setCases(response.items);
      setCasesPagination(response);
    } catch (error) {
      console.error('Error fetching cases:', error);
      setCasesError('Failed to fetch cases');
      toast({
        title: 'Warning',
        description: 'Failed to fetch linked cases for this record.',
        variant: 'default'
      });
    } finally {
      setCasesLoading(false);
    }
  };

  const handleCasesPageChange = (page: number) => {
    setCasesCurrentPage(page);
  };

  const handleRecalculate = async () => {
    if (!record) return;
    
    try {
      setRecalculating(true);
      const result = await recordService.recalculateRecord(record.id);
      
      // Refresh the record data to get updated weights
      await fetchRecordDetails(record.uuid);
      
      // Refresh linked cases to show newly created cases (especially if a new case was created)
      if (id && result.caseCreated && result.case) {
        await fetchCases(id, casesCurrentPage);
        
        // Clear the highlight after 10 seconds
        
      }
      
      // Show detailed success message with score and case information
      const successMessage = `Score: ${result.calculation.finalScore} (Threshold: ${result.targetThreshold})${result.caseCreated ? ' • New case created' : ''}`;
      
      toast({
        title: 'Recalculation Complete',
        description: successMessage,
        variant: 'default'
      });

      // If a case was created and exceeds threshold, offer to navigate to it
      if (result.caseCreated && result.case && result.exceedsTargetThreshold) {
        // Additional notification for high-risk cases
        setTimeout(() => {
          toast({
            title: 'High Risk Alert',
            description: `Score ${result.calculation.finalScore} exceeds threshold ${result.targetThreshold}. Case #${result.case!.id} created. Click here to review the case.`,
            variant: 'destructive'
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Error recalculating record:', error);
      toast({
        title: 'Error',
        description: 'Failed to recalculate record. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setRecalculating(false);
    }
  };

  const getFieldValue = (field: DetailedTemplateField): string => {
    if (!field.fieldResponse) return 'Not provided';
    
    const response = field.fieldResponse;
    
    
    // Handle different field types
    switch (field.fieldType) {
      case 1: // Dropdown
      case 2: // Radio
      case 7: // Lookup
        return response.lookupValue?.value || 'Not selected';
      case 4: // Date
        return response.valueDate ? formatDate(response.valueDate) : 'Not provided';
      case 5: // Number
        return response.valueNumber !== null && response.valueNumber !== undefined ? response.valueNumber.toString() : 'Not provided';
      case 6: // TextArea
      case 0: // Text
        return response.valueText || 'Not provided';
      default:
        return 'Not provided';
    }
  };


  const getFieldIcon = (field: DetailedTemplateField) => {
    const label = field.label.toLowerCase();
    
    if (label.includes('date') || label.includes('birth')) return <Calendar className="h-4 w-4 text-blue-500" />;
    if (label.includes('number') || label.includes('count') || label.includes('amount')) return <Hash className="h-4 w-4 text-green-500" />;
    if (label.includes('country') || label.includes('location')) return <MapPin className="h-4 w-4 text-purple-500" />;
    if (label.includes('nationality') || label.includes('flag')) return <Flag className="h-4 w-4 text-orange-500" />;
    if (label.includes('income') || label.includes('financial') || label.includes('worth')) return <DollarSign className="h-4 w-4 text-emerald-500" />;
    if (label.includes('risk') || label.includes('pep') || label.includes('raca')) return <Shield className="h-4 w-4 text-red-500" />;
    if (label.includes('product') || label.includes('channel')) return <CreditCard className="h-4 w-4 text-indigo-500" />;
    if (label.includes('profession') || label.includes('education')) return <TrendingUp className="h-4 w-4 text-cyan-500" />;
    
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  const renderField = (field: DetailedTemplateField) => {
    const value = getFieldValue(field);
    const fieldIcon = getFieldIcon(field);
    
    
    return (
      <div key={field.id} className="group relative bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 p-4">
        <div className="flex items-start justify-between gap-4 pr-16">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-0.5">
              {fieldIcon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <label className="text-sm font-semibold text-gray-900 leading-tight">
                  {field.label}
                </label>
                {field.isRequired && (
                  <span className="text-red-500 text-xs font-medium">*</span>
                )}
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">
                {value === 'Not provided' || value === 'Not selected' ? (
                  <span className="text-gray-400 italic">{value}</span>
                ) : (
                  <span className="text-gray-900">{value}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        {(field.lastCalculatedWeight && field.lastCalculatedWeight > 0) ? (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="text-xs font-bold bg-white text-gray-900 border-2 border-gray-500 px-3 py-1 shadow-md">
              Weight: {field.lastCalculatedWeight}
            </Badge>
          </div>
        ) : null}
      </div>
    );
  };

  const renderSection = (section: any, icon: React.ReactNode) => {
    if (!section.fields || section.fields.length === 0) return null;

    return (
      <Card key={section.id} className="mb-6 overflow-hidden shadow-sm border-0 bg-gradient-to-br from-white to-gray-50/30">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200/60 px-6 py-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800">
            <div className="p-2 rounded-lg bg-white shadow-sm border border-gray-200/50">
              {icon}
            </div>
            <span className="flex-1">{section.title}</span>
            <Badge variant="outline" className="text-xs font-medium">
              {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {section.fields.map((field: DetailedTemplateField) => renderField(field))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container>
        <div className="space-y-6">
          <Toolbar>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/records')}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <ToolbarHeading>Record Details</ToolbarHeading>
            </div>
            <ToolbarActions>
              <Button 
                variant="outline" 
                onClick={handleRecalculate}
                disabled={recalculating}
                className="mr-2"
              >
                {recalculating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Recalculating...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Recalculate
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => navigate('/records')}>
                Back to Records
              </Button>
            </ToolbarActions>
          </Toolbar>

          {/* Loading Skeleton */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse">
                <div className="h-6 bg-gray-300 rounded w-48"></div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse">
                  <div className="h-6 bg-gray-300 rounded w-40"></div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-5 bg-gray-200 rounded w-24"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    );
  }

  if (!record) {
    return (
      <Container>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Record not found</h2>
          <p className="text-gray-600 mb-4">The record you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/records')}>
            Back to Records
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <Toolbar>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/records')}
              className="p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <ToolbarHeading>Record Details</ToolbarHeading>
          </div>
          <ToolbarActions>
            <Button 
              variant="outline" 
              onClick={handleRecalculate}
              disabled={recalculating}
              className="mr-2"
            >
              {recalculating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Recalculating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Recalculate
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate('/records')}>
              Back to Records
            </Button>
          </ToolbarActions>
        </Toolbar>

        {/* Personal Information Section */}
        <Card className="mb-6 overflow-hidden shadow-sm border-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/20">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-100/50 border-b border-blue-200/60 px-6 py-5">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <User className="h-6 w-6" />
              </div>
              <span className="flex-1">Personal Information</span>
              <Badge variant="outline" className="bg-white/80 text-blue-700 border-blue-300">
                ID: {record.id}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white/70">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group bg-white/80 rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200">
                    <User className="h-4 w-4 text-purple-600" />
                </div>
                  <label className="text-sm font-semibold text-gray-700">Full Name</label>
                </div>
                <p className="text-lg font-semibold text-gray-900 leading-tight">
                  {record.firstName} {record.middleName && `${record.middleName} `}
                  {record.lastName}
                </p>
              </div>
              
              <div className="group bg-white/80 rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
                    <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                  <label className="text-sm font-semibold text-gray-700">Date of Birth</label>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(record.dateOfBirth)}
                </p>
              </div>
              
              <div className="group bg-white/80 rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-green-200">
                    <Hash className="h-4 w-4 text-green-600" />
                </div>
                  <label className="text-sm font-semibold text-gray-700">Identification</label>
                </div>
                <p className="text-lg font-semibold text-gray-900 font-mono">{record.identification}</p>
              </div>
              
              <div className="group bg-white/80 rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200">
                    <Hash className="h-4 w-4 text-orange-600" />
                </div>
                  <label className="text-sm font-semibold text-gray-700">Customer Reference ID</label>
                </div>
                <p className="text-lg font-semibold text-gray-900 font-mono">{record.customerReferenceId}</p>
              </div>
              
              <div className="group bg-white/80 rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all duration-200 relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200">
                    <MapPin className="h-4 w-4 text-purple-600" />
                </div>
                  <label className="text-sm font-semibold text-gray-700">Country of Birth</label>
                  {record.lastCountryOfBirthWeight && record.lastCountryOfBirthWeight > 0 && (
                    <Badge variant="secondary" className="text-xs font-bold bg-white text-purple-900 border-2 border-purple-500 px-3 py-1 ml-auto shadow-md">
                      Weight: {record.lastCountryOfBirthWeight}
                    </Badge>
                  )}
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {record.countryOfBirthLookupValue?.value || 'Not provided'}
                </p>
              </div>
              
              <div className="group bg-white/80 rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all duration-200 relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200">
                    <Flag className="h-4 w-4 text-orange-600" />
                </div>
                  <label className="text-sm font-semibold text-gray-700">Nationality</label>
                  {record.lastNationalityWeight && record.lastNationalityWeight > 0 && (
                    <Badge variant="secondary" className="text-xs font-bold bg-white text-orange-900 border-2 border-orange-500 px-3 py-1 ml-auto shadow-md">
                      Weight: {record.lastNationalityWeight}
                    </Badge>
                  )}
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {record.nationalityLookupValue?.value || 'Not provided'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Template Information */}
        <Card className="mb-6 overflow-hidden shadow-sm border-0 bg-gradient-to-br from-emerald-50/30 to-teal-50/20">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-100/50 border-b border-emerald-200/60 px-6 py-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <FileText className="h-5 w-5" />
              </div>
              <span className="flex-1">Template Information</span>
            </CardTitle>
            </CardHeader>
          <CardContent className="p-6 bg-white/70">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/80 rounded-xl p-4 border border-gray-200/50">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Template Name</label>
                <p className="text-lg font-semibold text-gray-900">{record.template.name}</p>
                      </div>
              <div className="bg-white/80 rounded-xl p-4 border border-gray-200/50">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Template Description</label>
                <p className="text-lg font-semibold text-gray-900">{record.template.description}</p>
                    </div>
              </div>
            </CardContent>
          </Card>

        {/* Linked Cases Section */}
        <Card className="mb-6 overflow-hidden shadow-sm border-0 bg-gradient-to-br from-amber-50/30 to-orange-50/20">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-100/50 border-b border-amber-200/60 px-6 py-5">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                <FileSearch className="h-6 w-6" />
              </div>
              <span className="flex-1">Linked Cases</span>
              <Badge variant="outline" className="bg-white/80 text-amber-700 border-amber-300">
                {casesLoading 
                  ? 'Loading...' 
                  : casesPagination 
                    ? `${casesPagination.totalCount} case${casesPagination.totalCount !== 1 ? 's' : ''} (Page ${casesPagination.pageNumber} of ${casesPagination.totalPages})`
                    : `${cases.length} case${cases.length !== 1 ? 's' : ''}`
                }
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white/70">
            {casesLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                <span className="ml-3 text-gray-600">Loading cases...</span>
              </div>
            )}
            
            {!casesLoading && casesError && (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {casesError}
              </div>
            )}
            
            {!casesLoading && !casesError && cases.length === 0 && (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <FileSearch className="h-5 w-5 mr-2" />
                No cases linked to this record
              </div>
            )}
            
            {!casesLoading && !casesError && cases.length > 0 && (
              <div className="space-y-4">
                {cases.map((caseItem) => {
                  const isNewlyCreated = newlyCreatedCaseId === caseItem.id;
                  return (
                    <div
                      key={caseItem.id}
                      className={`group rounded-xl p-4 border transition-all duration-200 cursor-pointer ${
                        isNewlyCreated 
                          ? 'bg-green-50/80 border-green-300 shadow-md ring-2 ring-green-200 animate-pulse' 
                          : 'bg-white/80 border-gray-200/50 hover:shadow-md'
                      }`}
                      onClick={() => navigate(`/cases/${caseItem.id}`)}
                    >
                      {isNewlyCreated && (
                        <div className="mb-2">
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">
                            ✨ Just Created
                          </Badge>
                        </div>
                      )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-orange-200">
                          <Shield className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{caseItem.fullName}</h4>
                            <Badge variant="outline" className="text-xs">
                              ID: {caseItem.id}
                            </Badge>
                            {caseItem.riskLevel && (
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{ 
                                  backgroundColor: caseItem.riskLevelBGColor || '#f3f4f6',
                                  color: caseItem.riskLevelColor || '#374151'
                                }}
                              >
                                {caseItem.riskLevel}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-3 space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium">
                                  Status
                                </span>
                                <span className="text-gray-900 font-medium">
                                  {caseItem.statusString || caseItem.status || 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 text-purple-800 text-xs font-medium">
                                  Source
                                </span>
                                <span className="text-gray-900 font-medium">
                                  {caseItem.sourceString || caseItem.source || 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-medium">
                                  Template
                                </span>
                                <span className="text-gray-900 font-medium">
                                  {caseItem.templateName || 'N/A'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                <span>Created: {caseItem.created ? formatDate(caseItem.created) : 'N/A'}</span>
                              </div>
                              {caseItem.score && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">Score:</span>
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs"
                                    style={{ 
                                      backgroundColor: caseItem.scoreBGColor || '#f3f4f6',
                                      color: '#374151'
                                    }}
                                  >
                                    {caseItem.score}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/cases/${caseItem.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Case
                        </Button>
                      </div>
                    </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Pagination for Cases */}
            {!casesLoading && !casesError && casesPagination && casesPagination.totalPages > 1 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <DataPagination
                  paginationData={extractPaginationData(casesPagination)}
                  onPageChange={handleCasesPageChange}
                  showPageInfo={true}
                  maxVisiblePages={5}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dynamic Sections */}
        {record.sections.map((section) => {
          // Determine icon and colors based on section title
          let icon = <FileText className="h-5 w-5" />;
          let iconBg = "from-gray-500 to-gray-600";
          let headerBg = "from-gray-50 to-gray-100/50";
          let cardBg = "from-gray-50/30 to-gray-50/20";
          let borderColor = "border-gray-200/60";
          
          if (section.title.toLowerCase().includes('risk')) {
            icon = <Shield className="h-5 w-5" />;
            iconBg = "from-red-500 to-red-600";
            headerBg = "from-red-50 to-red-100/50";
            cardBg = "from-red-50/30 to-red-50/20";
            borderColor = "border-red-200/60";
          } else if (section.title.toLowerCase().includes('financial')) {
            icon = <DollarSign className="h-5 w-5" />;
            iconBg = "from-emerald-500 to-emerald-600";
            headerBg = "from-emerald-50 to-emerald-100/50";
            cardBg = "from-emerald-50/30 to-emerald-50/20";
            borderColor = "border-emerald-200/60";
          } else if (section.title.toLowerCase().includes('additional')) {
            icon = <FileText className="h-5 w-5" />;
            iconBg = "from-blue-500 to-blue-600";
            headerBg = "from-blue-50 to-blue-100/50";
            cardBg = "from-blue-50/30 to-blue-50/20";
            borderColor = "border-blue-200/60";
          }
          
          return (
            <Card key={section.id} className={`mb-6 overflow-hidden shadow-sm border-0 bg-gradient-to-br ${cardBg}`}>
              <CardHeader className={`bg-gradient-to-r ${headerBg} border-b ${borderColor} px-6 py-4`}>
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${iconBg} text-white shadow-sm`}>
                    {icon}
                              </div>
                  <span className="flex-1">{section.title}</span>
                  <Badge variant="outline" className="text-xs font-medium bg-white/80">
                    {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-white/50">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {section.fields.map((field: DetailedTemplateField) => renderField(field))}
                </div>
            </CardContent>
          </Card>
          );
        })}
      </div>
    </Container>
  );
};

export default RecordDetailsPage;