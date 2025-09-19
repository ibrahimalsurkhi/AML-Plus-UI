import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  caseService,
  ExtendedCase
} from '@/services/api';
import { Container } from '@/components/container';
import {
  Loader2,
  ArrowLeft,
  Hash,
  User,
  FileText,
  Calendar,
  MapPin,
  Flag,
  ChevronDown,
  ChevronRight,
  Clock,
  FileSearch,
  Calculator
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Toolbar, ToolbarHeading, ToolbarActions } from '@/partials/toolbar';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';


const CaseStatusMap: Record<string, string> = {
  New: 'New',
  InProgress: 'In Progress',
  Completed: 'Completed',
  Rejected: 'Rejected',
  Closed: 'Closed',
  Active: 'Active'
};

const SourceTypeMap: Record<string, string> = {
  Web: 'Web',
  Api: 'Api',
  Manual: 'Manual'
};

const CaseDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<ExtendedCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<{ [id: number]: boolean }>({});


  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!id) throw new Error('Invalid case ID');

        // Fetch detailed case data using UUID
        try {
          const detailedCaseData = await caseService.getCaseDetailsByUuid('48c5cc58-0fb3-4638-be6a-06fa67487fbc');
          console.log('Case Details API Response:', detailedCaseData);
          setCaseData(detailedCaseData);
        } catch (caseDetailsError) {
          console.error('Error fetching case details:', caseDetailsError);
          // Fall back to basic case data if detailed fetch fails
          try {
            const basicCaseData = await caseService.getCaseById(Number(id));
            setCaseData(basicCaseData as ExtendedCase);
          } catch (basicCaseError) {
            console.error('Error fetching basic case data:', basicCaseError);
            throw new Error('Failed to fetch case data');
          }
        }

      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch case details. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);




  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
      </Container>
    );
  }

  if (!caseData) {
    return (
      <Container>
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold mb-2">Case Not Found</h2>
          <p className="text-muted-foreground mb-4">The case you are looking for does not exist.</p>
          <Button onClick={() => navigate('/cases')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cases
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <Toolbar>
          <div className="flex flex-col gap-1">
            <ToolbarHeading>Case Details</ToolbarHeading>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-md">
                <Hash className="w-4 h-4 text-primary" />
                <span>ID: {caseData.id}</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-md">
                <FileText className="w-4 h-4 text-primary" />
                <span>Record ID: {caseData.recordId}</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-md">
                <User className="w-4 h-4 text-primary" />
                <span>Name: {caseData.fullName}</span>
              </div>
            </div>
          </div>
          <ToolbarActions>
            <Button
              variant="outline"
              onClick={() => navigate('/cases')}
              className="hover:bg-primary/5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cases
            </Button>
          </ToolbarActions>
        </Toolbar>

        {/* Case Information & Record Calculations Card */}
        <Card className="mb-6 overflow-hidden shadow-sm border-0 bg-gradient-to-br from-purple-50/30 to-violet-50/20">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-100/50 border-b border-purple-200/60 px-6 py-5">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
                <Calculator className="h-6 w-6" />
              </div>
              <span className="flex-1">Case Information</span>
              <Badge variant="outline" className="bg-white/80 text-purple-700 border-purple-300">
                ID: {caseData.id}
              </Badge>
            </h2>
          </CardHeader>
          <CardContent className="p-6 bg-white/70">
            {/* Record Calculations */}
            {caseData?.recordCalculations && caseData.recordCalculations.length > 0 && (
              <div className="space-y-6">
                {caseData.recordCalculations.map((calculation) => (
                  <Card key={calculation.id} className="border bg-card">
                    <CardContent className="p-6">
                      {/* Combined Case Overview & Calculation Summary */}
                      <div className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="bg-white/80 rounded-lg p-4 border">
                            <div className="text-sm font-medium text-gray-700 mb-1">Final Score</div>
                            <div className="text-2xl font-bold text-gray-900">{calculation.finalScore}</div>
                          </div>
                          <div className="bg-white/80 rounded-lg p-4 border">
                            <div className="text-sm font-medium text-gray-700 mb-1">Target Threshold</div>
                            <div className="text-lg font-semibold text-gray-900">{caseData.targetThreshold}</div>
                          </div>
                          <div className="bg-white/80 rounded-lg p-4 border">
                            <div className="text-sm font-medium text-gray-700 mb-1">Exceeds Threshold</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {caseData.exceedsTargetThreshold ? 'Yes' : 'No'}
                            </div>
                          </div>
                          
                          <div className="bg-white/80 rounded-lg p-4 border">
                            <div className="text-sm font-medium text-gray-700 mb-1">Risk Level</div>
                            <Badge 
                              className="text-sm font-bold px-4 py-2"
                              style={{ 
                                backgroundColor: calculation.riskLevelBGColor,
                                color: calculation.riskLevelColor
                              }}
                            >
                              {calculation.riskLevel}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white/80 rounded-lg p-4 border">
                            <div className="text-sm font-medium text-gray-700 mb-2">Country of Birth</div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900">{calculation.countryOfBirthValue}</span>
                                <Badge 
                                  className="text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 px-4 py-1.5 shadow-lg ring-2 ring-blue-200 ring-offset-1"
                                >
                                  Weight: {calculation.countryOfBirthWeight}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                Score: <span className="font-medium text-gray-900">{calculation.countryOfBirthScore}</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white/80 rounded-lg p-4 border">
                            <div className="text-sm font-medium text-gray-700 mb-2">Nationality</div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900">{calculation.nationalityValue}</span>
                                <Badge 
                                  className="text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 px-4 py-1.5 shadow-lg ring-2 ring-blue-200 ring-offset-1"
                                >
                                  Weight: {calculation.nationalityWeight}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                Score: <span className="font-medium text-gray-900">{calculation.nationalityScore}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Field Results */}
                      {calculation.fieldResults && calculation.fieldResults.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-800 text-lg">Field Results</h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {calculation.fieldResults.map((fieldResult) => (
                              <div key={fieldResult.id} className="bg-gray-50/50 rounded-lg p-4 border">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-semibold text-gray-800">{fieldResult.fieldLabel}</h5>
                                  <Badge 
                                    className="text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 px-4 py-1.5 shadow-lg ring-2 ring-blue-200 ring-offset-1"
                                  >
                                    Weight: {fieldResult.fieldWeight}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600">
                                  Score: <span className="font-medium text-gray-900">{fieldResult.fieldScore}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Calculation Metadata */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Calculated:</span>
                            <span className="ml-2">{formatDate(calculation.calculatedAt)}</span>
                          </div>
                          <div>
                            <span className="font-medium">Created:</span>
                            <span className="ml-2">{formatDate(calculation.created)}</span>
                          </div>
                          {calculation.notes && (
                            <div className="md:col-span-2">
                              <span className="font-medium">Notes:</span>
                              <span className="ml-2">{calculation.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>


        {/* Personal Information Card */}
        {caseData?.recordDetails && (
          <Card className="mb-6 overflow-hidden shadow-sm border-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/20">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-100/50 border-b border-blue-200/60 px-6 py-5">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                  <User className="h-6 w-6" />
                </div>
                <span className="flex-1">Personal Information</span>
                <Badge variant="outline" className="bg-white/80 text-blue-700 border-blue-300">
                  ID: {caseData.recordDetails.id}
                </Badge>
              </h2>
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
                    {caseData.recordDetails.firstName} {caseData.recordDetails.middleName && `${caseData.recordDetails.middleName} `}
                    {caseData.recordDetails.lastName}
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
                    {formatDate(caseData.recordDetails.dateOfBirth)}
                  </p>
                  </div>
                
                <div className="group bg-white/80 rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-green-200">
                      <Hash className="h-4 w-4 text-green-600" />
                </div>
                    <label className="text-sm font-semibold text-gray-700">Identification</label>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 font-mono">{caseData.recordDetails.identification}</p>
                </div>
                
                <div className="group bg-white/80 rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200">
                      <Hash className="h-4 w-4 text-orange-600" />
                  </div>
                    <label className="text-sm font-semibold text-gray-700">Customer Reference ID</label>
                </div>
                  <p className="text-lg font-semibold text-gray-900 font-mono">{caseData.recordDetails.customerReferenceId}</p>
                  </div>
                
                <div className="group bg-white/80 rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all duration-200 relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200">
                      <MapPin className="h-4 w-4 text-purple-600" />
                </div>
                    <label className="text-sm font-semibold text-gray-700">Country of Birth</label>
                    {caseData.recordDetails.lastCountryOfBirthWeight && caseData.recordDetails.lastCountryOfBirthWeight > 0 && (
                      <Badge className="text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 px-4 py-1.5 ml-auto shadow-lg ring-2 ring-blue-200 ring-offset-1">
                        Weight: {caseData.recordDetails.lastCountryOfBirthWeight}
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {caseData.recordDetails.countryOfBirthLookupValue?.value || 'Not provided'}
                  </p>
                </div>
                
                <div className="group bg-white/80 rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all duration-200 relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200">
                      <Flag className="h-4 w-4 text-orange-600" />
                  </div>
                    <label className="text-sm font-semibold text-gray-700">Nationality</label>
                    {caseData.recordDetails.lastNationalityWeight && caseData.recordDetails.lastNationalityWeight > 0 && (
                      <Badge className="text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 px-4 py-1.5 ml-auto shadow-lg ring-2 ring-blue-200 ring-offset-1">
                        Weight: {caseData.recordDetails.lastNationalityWeight}
                      </Badge>
                    )}
                        </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {caseData.recordDetails.nationalityLookupValue?.value || 'Not provided'}
                  </p>
                      </div>
              </div>
            </CardContent>
          </Card>
        )}





        {/* Screening Histories Card */}
        {caseData?.screeningHistories && caseData.screeningHistories.length > 0 && (
          <Card className="mb-6 overflow-hidden shadow-sm border-0 bg-gradient-to-br from-amber-50/30 to-orange-50/20">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-100/50 border-b border-amber-200/60 px-6 py-5">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                  <FileSearch className="h-6 w-6" />
                </div>
                <span className="flex-1">Screening Histories</span>
                <Badge variant="outline" className="bg-white/80 text-amber-700 border-amber-300">
                  {caseData.screeningHistories.length} historie{caseData.screeningHistories.length !== 1 ? 's' : ''}
                </Badge>
              </h2>
            </CardHeader>
            <CardContent className="p-6 bg-white/70">
              <div className="space-y-4">
                {caseData.screeningHistories.map((history) => (
                  <Card key={history.id} className="border bg-card hover:bg-accent/5 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex flex-col space-y-1">
                              <div className="text-sm font-medium text-muted-foreground">History ID</div>
                              <div className="text-base font-semibold">{history.id}</div>
                              </div>
                              <div className="flex flex-col space-y-1">
                              <div className="text-sm font-medium text-muted-foreground">Number of Matches</div>
                              <div className="text-base font-semibold">{history.noOfMatches}</div>
                              </div>
                              <div className="flex flex-col space-y-1">
                              <div className="text-sm font-medium text-muted-foreground">Created</div>
                                <div className="text-base">
                                {history.created ? formatDate(history.created) : 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                          onClick={() => toggleExpand(history.id)}
                            className="ml-4 p-2 hover:bg-gray-100 rounded transition-colors"
                          aria-label={expanded[history.id] ? 'Collapse details' : 'Expand details'}
                          >
                          {expanded[history.id] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                      {/* Expandable Screening Details */}
                      {expanded[history.id] && (
                          <div className="mt-4 pt-4 border-t">
                          {history.caseScreenings && history.caseScreenings.length > 0 ? (
                              <div className="space-y-3">
                                <h4 className="font-medium text-sm text-muted-foreground">
                                Screening Results ({history.caseScreenings.length}):
                                </h4>
                              <div className="grid grid-cols-1 gap-3">
                                {history.caseScreenings.map((screening) => (
                                  <div key={screening.id} className="p-3 rounded border bg-gray-50/50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                      <div>
                                        <div className="font-medium text-gray-700 mb-1">External Name</div>
                                        <div className="text-gray-900">{screening.externalName || 'N/A'}</div>
                                      </div>
                                      <div>
                                        <div className="font-medium text-gray-700 mb-1">External ID</div>
                                        <div className="text-gray-900 font-mono">{screening.externalId || 'N/A'}</div>
                                      </div>
                                      <div>
                                        <div className="font-medium text-gray-700 mb-1">Match Score</div>
                                        <Badge 
                                          variant="outline" 
                                          className={`text-xs ${screening.matchScore >= 0.9 ? 'bg-red-100 text-red-800' : screening.matchScore >= 0.7 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}
                                        >
                                          {(screening.matchScore * 100).toFixed(0)}%
                                        </Badge>
                                        </div>
                                      <div>
                                        <div className="font-medium text-gray-700 mb-1">Source</div>
                                        <div className="text-gray-900">{screening.externalSource || 'N/A'}</div>
                                          </div>
                                      </div>
                                  </div>
                                ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 py-2">
                              No screening results found for this history.
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
            </CardContent>
          </Card>
        )}


        {/* Activity Logs Card */}
        {caseData?.activityLogs && caseData.activityLogs.length > 0 && (
          <Card className="mb-6 overflow-hidden shadow-sm border-0 bg-gradient-to-br from-slate-50/30 to-gray-50/20">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-100/50 border-b border-slate-200/60 px-6 py-5">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600 text-white shadow-lg">
                  <Clock className="h-6 w-6" />
                </div>
                <span className="flex-1">Activity Logs</span>
                <Badge variant="outline" className="bg-white/80 text-slate-700 border-slate-300">
                  {caseData.activityLogs.length} log{caseData.activityLogs.length !== 1 ? 's' : ''}
                </Badge>
              </h2>
            </CardHeader>
            <CardContent className="p-6 bg-white/70">
              <div className="space-y-3">
                    {caseData.activityLogs.map((log) => (
                  <div key={log.id} className="bg-white/80 rounded-lg p-4 border border-gray-200/50 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 mb-1">{log.description}</div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Action:</span>
                            <Badge variant="outline" className="text-xs">{log.action}</Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Module:</span>
                            <Badge variant="outline" className="text-xs">{log.module}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(log.created)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  );
};

export default CaseDetailsPage;
