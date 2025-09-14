import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading } from '@/partials/toolbar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  transactionService,
  ruleService,
  type TransactionCaseDetails,
  type TransactionCase,
  type PaginatedResponse,
  type RuleDetails,
  type Rule
} from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { KeenIcon } from '@/components/keenicons';
import { formatCurrencyUSD } from '@/utils/currency';

const TransactionCaseDetailsPage = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<TransactionCaseDetails | null>(null);
  const [relatedCases, setRelatedCases] = useState<PaginatedResponse<TransactionCase> | null>(null);
  const [ruleDetails, setRuleDetails] = useState<Rule | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedCasesLoading, setRelatedCasesLoading] = useState(false);
  const [ruleLoading, setRuleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCaseData = async () => {
      if (!uuid) return;

      try {
        setLoading(true);
        const data = await transactionService.getTransactionCaseByUuid(uuid);
        setCaseData(data);
        setError(null);

        // Fetch related cases if we have account information
        if (data.accountId) {
          fetchRelatedCases(data.accountId);
        }

        // Fetch rule details if we have matched rule
        if (data.matchedRule?.id) {
          fetchRuleDetails(data.matchedRule.id);
        }
      } catch (err) {
        setError('Failed to fetch case details');
        toast({
          title: 'Error',
          description: 'Failed to fetch case details',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchRelatedCases = async (accountId: number) => {
      try {
        setRelatedCasesLoading(true);
        const data = await transactionService.getTransactionCases({
          pageNumber: 1,
          pageSize: 10,
          accountId: accountId
        });
        setRelatedCases(data);
      } catch (err) {
        console.error('Failed to fetch related cases:', err);
      } finally {
        setRelatedCasesLoading(false);
      }
    };

    const fetchRuleDetails = async (ruleId: number) => {
      try {
        setRuleLoading(true);
        const data = await ruleService.getRuleById(ruleId);
        setRuleDetails(data as unknown as Rule);
      } catch (err) {
        console.error('Failed to fetch rule details:', err);
      } finally {
        setRuleLoading(false);
      }
    };

    fetchCaseData();
  }, [uuid]);

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1:
        return 'Active';
      case 2:
        return 'Inactive';
      case 3:
        return 'Blocked';
      case 4:
        return 'Suspended';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return 'text-green-600 bg-green-100';
      case 2:
        return 'text-gray-600 bg-gray-100';
      case 3:
        return 'text-red-600 bg-red-100';
      case 4:
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeLabel = (type: number) => {
    return caseData?.transactionType?.name || `Type ${type}`;
  };

  const formatAmount = (amount: number) => {
    return formatCurrencyUSD(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return dateString;
    }
  };

  const formatUuid = (uuid: string) => {
    return uuid.substring(0, 8) + '...' + uuid.substring(uuid.length - 4);
  };

  const handleViewRelatedCase = (uuid: string) => {
    navigate(`/transaction-cases/${uuid}`);
  };

  const getRuleTypeLabel = (ruleType: number) => {
    switch (ruleType) {
      case 1:
        return 'Transaction Monitoring';
      case 2:
        return 'Transaction Screening';
      case 3:
        return 'Financial Fraud';
      case 4:
        return 'Anti-Concealment';
      default:
        return `Type ${ruleType}`;
    }
  };

  const getActionTypeLabel = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'alert':
        return 'Generate Alert';
      case 'block':
        return 'Block Transaction';
      case 'flag':
        return 'Flag for Review';
      case 'report':
        return 'Generate Report';
      default:
        return actionType;
    }
  };

  const generateRuleSummary = (rule: Rule): string => {
    console.log('Rule data:', rule);
    console.log('Rule root:', rule.root);

    if (!rule.root) {
      console.log('No root found, using fallback');
      return 'Rule conditions not specified';
    }

    // Copy the getRulePreview function from RuleDetailPage
    const getRulePreview = (group: any): string => {
      if (!group) return '';
      if (!group.children || group.children.length === 0) return '';

      const op = group.operator === 'AND' ? 'AND' : 'OR';
      return group.children
        .map((child: any) => {
          if ('condition' in child && child.condition) {
            const cond = child.condition;
            const metric = cond.aggregateFieldId || '[Metric]';
            const operator = cond.operator || '[Operator]';
            let value = '[Value]';

            if (cond.jsonValue) {
              try {
                if (cond.aggregateFieldId === 'TransactionTime') {
                  const date = new Date(cond.jsonValue);
                  value = isNaN(date.getTime()) ? '[Value]' : format(date, 'yyyy-MM-dd');
                } else {
                  const parsed = JSON.parse(cond.jsonValue);
                  if (Array.isArray(parsed)) {
                    value = parsed.length > 1 ? `[${parsed.join(', ')}]` : parsed.join(', ');
                  } else {
                    value = parsed;
                  }
                }
              } catch {
                value = cond.jsonValue;
              }
            }

            const duration = cond.duration ? cond.duration : '[Duration]';
            const durationType = cond.durationType ? cond.durationType : '[Duration Type]';
            const transferType = cond.accountType ? cond.accountType : '[Account Type]';

            let preview = '';
            preview += metric !== '[Metric]' ? metric : '[Metric]';
            preview += operator !== '[Operator]' ? ` ${operator}` : ' [Operator]';
            preview += value !== '[Value]' ? ` ${value}` : ' [Value]';

            if (cond.duration) {
              preview += ' in last';
              preview += cond.duration ? ` ${cond.duration}` : ' [Duration]';
              preview += cond.durationType ? ` ${cond.durationType}` : ' [Duration Type]';
            }

            if (transferType !== '[Account Type]') {
              preview += ` for ${transferType}`;
            } else {
              preview += ' for [Account Type]';
            }

            return preview.trim();
          } else if ('operator' in child && 'children' in child) {
            return `(${getRulePreview(child)})`;
          }
          return '';
        })
        .filter(Boolean)
        .join(` ${op} `);
    };

    return getRulePreview(rule.root);
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading case details...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <div className="flex items-center gap-2">
              <KeenIcon icon="shield-tick" style="duotone" className="text-primary" />
              Transaction Case Details
            </div>
          </ToolbarHeading>
        </Toolbar>

        <div className="text-center py-16">
          <KeenIcon
            icon="shield-tick"
            style="duotone"
            className="text-muted-foreground text-4xl mx-auto mb-4"
          />
          <h2 className="text-2xl font-semibold mb-2">Error Loading Case</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/transaction-cases')}>
              <KeenIcon icon="arrow-left" style="duotone" className="mr-2" />
              Back to Cases
            </Button>
            <Button variant="outline" onClick={() => navigate('/transactions/new')}>
              <KeenIcon icon="plus" style="duotone" className="mr-2" />
              Create Transaction
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <div className="flex items-center gap-2">
            <KeenIcon icon="shield-tick" style="duotone" className="text-primary" />
            Transaction Case Details
          </div>
        </ToolbarHeading>
      </Toolbar>

      {caseData ? (
        <div className="grid gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeenIcon icon="shield-tick" style="duotone" className="text-primary" />
                Case Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Basic Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Case UUID</dt>
                      <dd className="text-sm font-mono">{caseData.uuid}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                      <dd>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(caseData.status)}`}
                        >
                          {getStatusLabel(caseData.status)}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                      <dd className="text-sm">{formatDate(caseData.created)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Created By</dt>
                      <dd className="text-sm">{caseData.createdBy}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Transaction Details</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                      <dd className="text-sm">
                        {caseData.transactionType?.name || 'Unknown Type'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Amount</dt>
                      <dd className="text-sm font-medium">{formatAmount(caseData.amount)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Currency</dt>
                      <dd className="text-sm">{caseData.currency?.value || 'Unknown Currency'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Record Name</dt>
                      <dd className="text-sm">
                        {caseData.record
                          ? `${caseData.record.firstName} ${caseData.record.middleName || ''} ${caseData.record.lastName}`.trim()
                          : 'No record information'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeenIcon icon="user" style="duotone" className="text-primary" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Account Details</h4>
                  {caseData.account ? (
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Account Name</dt>
                        <dd className="text-sm">{caseData.account.name}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                          Account Number
                        </dt>
                        <dd className="text-sm font-mono">{caseData.account.number}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Bank Country</dt>
                        <dd className="text-sm">{caseData.account.bankOfCountryName}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Bank City</dt>
                        <dd className="text-sm">{caseData.account.bankOfCity}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No account information available
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-3">Record Details</h4>
                  {caseData.record ? (
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Full Name</dt>
                        <dd className="text-sm">
                          {caseData.record.firstName} {caseData.record.middleName || ''}{' '}
                          {caseData.record.lastName}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Date of Birth</dt>
                        <dd className="text-sm">{caseData.record.dateOfBirth}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                          Identification
                        </dt>
                        <dd className="text-sm font-mono">{caseData.record.identification}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-sm text-muted-foreground">No record information available</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rule Preview */}
          {caseData?.matchedRule && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeenIcon icon="document" style="duotone" className="text-primary" />
                  Rule Preview
                </CardTitle>
                {ruleDetails && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/rules/${ruleDetails.id}`)}
                    >
                      <KeenIcon icon="external-link" style="outline" className="h-4 w-4 mr-2" />
                      View Full Rule
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {ruleLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Loading rule details...</span>
                  </div>
                ) : ruleDetails ? (
                  <div>
                    <label className="block font-medium mb-2">Rule Preview</label>
                    <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm font-mono text-gray-800">
                      {ruleDetails?.root
                        ? generateRuleSummary(ruleDetails)
                        : '[Metric] [Operator] [Value] in last [Duration] [Duration Type] for [Account Type]'}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <KeenIcon
                      icon="document"
                      style="duotone"
                      className="text-muted-foreground text-3xl mx-auto mb-2"
                    />
                    <p className="text-muted-foreground">Rule details not available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Related Cases Grid */}
          {caseData?.accountId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeenIcon icon="shield-tick" style="duotone" className="text-primary" />
                  Related Cases (Same Account)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {relatedCasesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Loading related cases...</span>
                  </div>
                ) : relatedCases && relatedCases.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Case UUID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relatedCases.items
                          .filter((caseItem) => caseItem.caseUuid !== caseData.uuid) // Exclude current case
                          .map((caseItem) => (
                            <TableRow key={caseItem.id} className="hover:bg-muted/50">
                              <TableCell className="font-mono text-sm">
                                <div className="flex items-center gap-2">
                                  <KeenIcon
                                    icon="shield-tick"
                                    style="outline"
                                    className="text-primary"
                                  />
                                  {formatUuid(caseItem.caseUuid)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <KeenIcon
                                    icon="sort"
                                    style="outline"
                                    className="text-muted-foreground"
                                  />
                                  Type {caseItem.type}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'USD'
                                }).format(caseItem.amount)}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}
                                >
                                  {getStatusLabel(caseItem.status)}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(caseItem.created)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewRelatedCase(caseItem.caseUuid)}
                                  className="h-8 px-2"
                                >
                                  <KeenIcon icon="eye" style="outline" className="h-4 w-4" />
                                  <span className="sr-only">View</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <KeenIcon
                      icon="shield-tick"
                      style="duotone"
                      className="text-muted-foreground text-3xl mx-auto mb-2"
                    />
                    <p className="text-muted-foreground">No other cases found for this account</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button onClick={() => navigate('/transaction-cases')}>
              <KeenIcon icon="arrow-left" style="duotone" className="mr-2" />
              Back to Cases
            </Button>
            <Button variant="outline" onClick={() => navigate('/transactions/new')}>
              <KeenIcon icon="plus" style="duotone" className="mr-2" />
              Create Transaction
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <KeenIcon
            icon="shield-tick"
            style="duotone"
            className="text-muted-foreground text-4xl mx-auto mb-4"
          />
          <h2 className="text-2xl font-semibold mb-2">No Case Data</h2>
          <p className="text-muted-foreground mb-4">
            Unable to load case details. Please try again.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/transaction-cases')}>
              <KeenIcon icon="arrow-left" style="duotone" className="mr-2" />
              Back to Cases
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
};

export default TransactionCaseDetailsPage;
