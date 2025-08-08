import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  recordService,
  type Record,
  type TemplateField,
  templateService,
  FieldType,
  type Template,
  caseService,
  Case,
  lookupService,
  type LookupValue
} from '@/services/api';
import { Container } from '@/components/container';
import {
  Loader2,
  ArrowLeft,
  User,
  Calendar,
  Hash,
  FileText,
  IdCard,
  FileType,
  UserRound,
  Cake
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Toolbar, ToolbarHeading, ToolbarActions } from '@/partials/toolbar';
import { cn } from '@/lib/utils';

// Extend TemplateField type to include options and ranges
interface ExtendedTemplateField extends TemplateField {
  options?: Array<{
    id?: number;
    fieldId?: number;
    label: string;
    scoreCriteriaId: number;
    displayOrder: number;
  }>;
}

const RecordDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Record | null>(null);
  const [templateName, setTemplateName] = useState<string>('');
  const [fields, setFields] = useState<ExtendedTemplateField[]>([]);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<Case[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const recordId = Number(id);
        if (!id || isNaN(recordId)) {
          throw new Error('Invalid record ID');
        }

        // Now get the full record details using the template ID
        const fullRecord = await recordService.getRecordById(recordId);
        setRecord(fullRecord);

        // Get the template name
        const templateDetails = await templateService.getTemplateById(
          fullRecord.templateId.toString()
        );
        setTemplateName(templateDetails.name);

        // Get the template fields and their options
        const fieldsResponse = await templateService.getTemplateFields(
          fullRecord.templateId.toString()
        );
        // Get all fields from sections and fields without section
        const allFields = [
          ...fieldsResponse.sections.flatMap((section) => section.fields),
          ...fieldsResponse.fieldsWithoutSection
        ];

        // Fetch options for fields that need them
        const fieldsWithOptions = await Promise.all(
          allFields.map(async (field) => {
            const extendedField: ExtendedTemplateField = { ...field };

            // Fetch options for option-based fields
            if (
              field.fieldType === FieldType.Dropdown ||
              field.fieldType === FieldType.Radio ||
              field.fieldType === FieldType.Checkbox
            ) {
              const options = await templateService.getFieldOptions(
                fullRecord.templateId.toString(),
                field.id!
              );
              extendedField.options = options;
            }

            // Fetch lookup values for Lookup fields
            if (field.fieldType === FieldType.Lookup && field.lookupId) {
              try {
                const lookupValues = await lookupService.getLookupValues(field.lookupId, {
                  pageNumber: 1,
                  pageSize: 100
                });
                // Convert lookup values to field options format
                extendedField.options = lookupValues.items.map(
                  (lookupValue: LookupValue, index: number) => ({
                    id: lookupValue.id,
                    fieldId: field.id!,
                    label: lookupValue.value,
                    scoreCriteriaId: 0, // Default score criteria
                    displayOrder: index + 1
                  })
                );
              } catch (error) {
                console.error(`Error fetching lookup values for field ${field.id}:`, error);
                extendedField.options = [];
              }
            }

            return extendedField;
          })
        );

        setFields(fieldsWithOptions);

        // Fetch cases by recordId
        caseService.getCasesByRecordId(fullRecord.id).then(setCases);
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

  if (!record) {
    return (
      <Container>
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold mb-2">Record Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The record you are looking for does not exist.
          </p>
          <Button onClick={() => navigate('/records')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Records
          </Button>
        </div>
      </Container>
    );
  }

  // Helper to get field value from record.fieldResponses
  const getFieldValue = (
    fieldId: number,
    fieldType: FieldType,
    options?: ExtendedTemplateField['options']
  ) => {
    const response = record.fieldResponses.find((fr) => fr.fieldId === fieldId);
    if (!response) return null;

    switch (fieldType) {
      case FieldType.Text:
      case FieldType.TextArea:
        return response.valueText;
      case FieldType.Number:
        return response.valueNumber;
      case FieldType.Date:
        return response.valueDate ? new Date(response.valueDate).toLocaleDateString() : null;
      case FieldType.Dropdown:
      case FieldType.Radio:
      case FieldType.Checkbox:
      case FieldType.Lookup:
        if (response.valueText) {
          // Find the option that matches the valueText (which is the option ID)
          const option = options?.find((opt) => opt.id?.toString() === response.valueText);
          return option?.label || response.valueText;
        }
        return null;
      default:
        return response.valueText;
    }
  };

  // Helper to get field icon based on field type
  const getFieldIcon = (fieldType: FieldType) => {
    switch (fieldType) {
      case FieldType.Text:
      case FieldType.TextArea:
        return <FileType className="w-4 h-4" />;
      case FieldType.Number:
        return <Hash className="w-4 h-4" />;
      case FieldType.Date:
        return <Calendar className="w-4 h-4" />;
      case FieldType.Dropdown:
      case FieldType.Radio:
      case FieldType.Checkbox:
      case FieldType.Lookup:
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Container>
      <div className="space-y-6">
        <Toolbar>
          <div className="flex flex-col gap-1">
            <ToolbarHeading>Record Details</ToolbarHeading>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-md">
                <Hash className="w-4 h-4 text-primary" />
                <span>ID: {record?.id || '-'}</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-md">
                <IdCard className="w-4 h-4 text-primary" />
                <span>Identification: {record?.identification || '-'}</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-md">
                <FileText className="w-4 h-4 text-primary" />
                <span>Template: {templateName || '-'}</span>
              </div>
            </div>
          </div>
          <ToolbarActions>
            <Button
              variant="outline"
              onClick={() => navigate('/records')}
              className="hover:bg-primary/5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Records
            </Button>
          </ToolbarActions>
        </Toolbar>

        {/* Personal Information Card */}
        <Card className="shadow-sm border-primary/10">
          <CardHeader className="bg-primary/5 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <UserRound className="w-5 h-5 text-primary" />
              Personal Information
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Basic information about the record holder.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Hash className="w-4 h-4" />
                  ID
                </div>
                <div className="text-base font-medium">{record?.id || '-'}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <IdCard className="w-4 h-4" />
                  Identification
                </div>
                <div className="text-base font-medium">{record?.identification || '-'}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Template
                </div>
                <div className="text-base font-medium">{templateName || '-'}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <User className="w-4 h-4" />
                  First Name
                </div>
                <div className="text-base font-medium">{record.firstName}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <User className="w-4 h-4" />
                  Middle Name
                </div>
                <div className="text-base font-medium">{record.middleName || '-'}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <User className="w-4 h-4" />
                  Last Name
                </div>
                <div className="text-base font-medium">{record.lastName}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Cake className="w-4 h-4" />
                  Date of Birth
                </div>
                <div className="text-base font-medium">
                  {new Date(record.dateOfBirth).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Template Fields Card */}
        {fields.length > 0 && (
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="bg-primary/5 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Template Fields
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Additional information based on the template requirements.
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fields.map((field) => {
                  const value = getFieldValue(field.id!, field.fieldType, field.options);
                  return (
                    <div
                      key={field.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                        {getFieldIcon(field.fieldType)}
                        {field.label}
                      </div>
                      <div className="text-base font-medium">
                        {value !== null ? value : <span className="text-muted-foreground">-</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {cases.length > 0 && (
          <Card className="shadow-sm border-primary/10 mt-6">
            <CardHeader className="bg-primary/5 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Related Cases
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-3 py-2 text-left">ID</th>
                      <th className="border px-3 py-2 text-left">Full Name</th>
                      <th className="border px-3 py-2 text-left">Score</th>
                      <th className="border px-3 py-2 text-left">Medium Threshold</th>
                      <th className="border px-3 py-2 text-left">Exceeds Medium</th>
                      <th className="border px-3 py-2 text-left">Status</th>
                      <th className="border px-3 py-2 text-left">Source</th>
                      <th className="border px-3 py-2 text-left">Created</th>
                      <th className="border px-3 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c) => (
                      <tr key={c.id}>
                        <td className="border px-3 py-2">{c.id}</td>
                        <td className="border px-3 py-2">{c.fullName}</td>
                        <td className="border px-3 py-2">
                          <span
                            className="px-2 w-16 text-center py-1 rounded-md inline-block"
                            style={{ backgroundColor: c.scoreBGColor }}
                          >
                            {c.score}
                          </span>
                        </td>
                        <td className="border px-3 py-2">{c.mediumThreshold}</td>
                        <td className="border px-3 py-2">
                          {c.exceedsMediumThreshold ? 'Yes' : 'No'}
                        </td>
                        <td className="border px-3 py-2">{c.status}</td>
                        <td className="border px-3 py-2">{c.source}</td>
                        <td className="border px-3 py-2">{c.created}</td>
                        <td className="border px-3 py-2">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => navigate(`/cases/${c.id}`)}
                          >
                            View
                          </Button>
                        </td>
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

export default RecordDetailsPage;
