import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { caseService, Case, ScreeningHistory, ActivityLog, CaseScreening } from '@/services/api';
import { Container } from '@/components/container';
import { Loader2, ArrowLeft, Hash, User, FileText, Calendar } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarActions
} from '@/partials/toolbar';

const CaseStatusMap: Record<string, string> = {
  'New': 'New',
  'InProgress': 'In Progress',
  'Completed': 'Completed',
  'Rejected': 'Rejected',
  'Closed': 'Closed',
  'Active': 'Active',
};

const SourceTypeMap: Record<string, string> = {
  'Web': 'Web',
  'Api': 'Api',
  'Manual': 'Manual',
};

const CaseDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<{ [id: number]: boolean }>({});

  const toggleExpand = (id: number) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!id) throw new Error('Invalid case ID');
        const data = await caseService.getCaseById(Number(id));
        setCaseData(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch case details. Please try again.',
          variant: 'destructive',
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

        {/* Case Information Card */}
        <Card className="shadow-sm border-primary/10">
          <CardHeader className="bg-primary/5 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Case Information
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Basic information about the case.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Hash className="w-4 h-4" />
                  Case ID
                </div>
                <div className="text-base font-medium">{caseData.id}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Record ID
                </div>
                <div className="text-base font-medium">{caseData.recordId}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <User className="w-4 h-4" />
                  Full Name
                </div>
                <div className="text-base font-medium">{caseData.fullName}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Status
                </div>
                <div className="text-base font-medium">{CaseStatusMap[caseData.status] || caseData.status}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Source
                </div>
                <div className="text-base font-medium">{SourceTypeMap[caseData.source] || caseData.source}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Score
                </div>
                <div className="text-base font-medium">
                  <span
                    className="px-2 w-16 text-center py-1 rounded-md inline-block"
                    style={{ backgroundColor: caseData.scoreBGColor }}
                  >
                    {caseData.score}
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Medium Threshold
                </div>
                <div className="text-base font-medium">{caseData.mediumThreshold}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Exceeds Medium Threshold
                </div>
                <div className="text-base font-medium">{caseData.exceedsMediumThreshold ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Screening Histories Card */}
        {caseData.screeningHistories && caseData.screeningHistories.length > 0 && (
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="bg-primary/5 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Screening Histories
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-3 py-2 text-left">ID</th>
                      <th className="border px-3 py-2 text-left">No. of Matches</th>
                      <th className="border px-3 py-2 text-left">Case Screenings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseData.screeningHistories.map(history => (
                      <React.Fragment key={history.id}>
                        <tr className="bg-white">
                          <td className="border px-3 py-2">
                            <button
                              className="text-primary font-bold focus:outline-none"
                              onClick={() => toggleExpand(history.id)}
                              aria-label={expanded[history.id] ? 'Collapse' : 'Expand'}
                            >
                              {expanded[history.id] ? '−' : '+'}
                            </button>
                            <span className="ml-2">{history.id}</span>
                          </td>
                          <td className="border px-3 py-2">{history.noOfMatches}</td>
                          <td className="border px-3 py-2">
                            {history.caseScreenings && history.caseScreenings.length > 0
                              ? <span>{history.caseScreenings.length} screening(s)</span>
                              : <span className="text-muted-foreground">No screenings</span>
                            }
                          </td>
                        </tr>
                        {expanded[history.id] && (
                          <tr>
                            <td colSpan={3} className="border px-3 py-2 bg-gray-50">
                              <table className="min-w-full border text-xs">
                                <thead>
                                  <tr>
                                    <th className="border px-2 py-1">Screening ID</th>
                                    <th className="border px-2 py-1">Individual ID</th>
                                    <th className="border px-2 py-1">Individual Name</th>
                                    <th className="border px-2 py-1">Entity ID</th>
                                    <th className="border px-2 py-1">Match Score</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {history.caseScreenings.map(screening => (
                                    <tr key={screening.id}>
                                      <td className="border px-2 py-1">{screening.id}</td>
                                      <td className="border px-2 py-1">{screening.individualId ?? '-'}</td>
                                      <td className="border px-2 py-1">{screening.individualName ?? '-'}</td>
                                      <td className="border px-2 py-1">{screening.entityId ?? '-'}</td>
                                      <td className="border px-2 py-1">{screening.matchScore}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Logs Card */}
        {caseData.activityLogs && caseData.activityLogs.length > 0 && (
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="bg-primary/5 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Activity Logs
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-3 py-2 text-left">Description</th>
                      <th className="border px-3 py-2 text-left">Action</th>
                      <th className="border px-3 py-2 text-left">Module</th>
                      <th className="border px-3 py-2 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseData.activityLogs.map(log => (
                      <tr key={log.id}>
                        <td className="border px-3 py-2">{log.description}</td>
                        <td className="border px-3 py-2">{log.action}</td>
                        <td className="border px-3 py-2">{log.module}</td>
                        <td className="border px-3 py-2">{log.created}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  );
};

export default CaseDetailsPage; 