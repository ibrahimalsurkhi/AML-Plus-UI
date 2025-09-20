import { templateService, customValueService, FieldType, TemplateType } from './api';

export interface TemplateData {
  id: number;
  name: string;
  templateType: TemplateType;
  tenantId: number;
  sections: any[];
  fieldsWithoutSection: any[];
  prepareRecordData?: any;
}

export interface CustomFieldData {
  id: number;
  label: string;
  fieldType: number;
  lookupId?: number;
  templateId: string;
  options?: { id: number; label: string }[];
  lookupValues?: { id: number; value: string }[];
}

export interface CustomValueData {
  id: number;
  title: string;
}

class TemplateDataService {
  private templates: TemplateData[] = [];
  private customFields: CustomFieldData[] = [];
  private customValues: CustomValueData[] = [];
  private isLoaded = false;
  private isLoading = false;
  private loadingPromise: Promise<void> | null = null;

  /**
   * Load all templates and their prepare-record data
   */
  async loadAllTemplateData(): Promise<void> {
    if (this.isLoaded) return;
    if (this.isLoading && this.loadingPromise) return this.loadingPromise;

    this.isLoading = true;
    this.loadingPromise = this._performLoad();
    
    try {
      await this.loadingPromise;
      this.isLoaded = true;
    } finally {
      this.isLoading = false;
      this.loadingPromise = null;
    }
  }

  private async _performLoad(): Promise<void> {
    console.log('TemplateDataService: Starting to load all template data...');
    
    try {
      // Step 1: Get all templates
      const templatesResponse = await templateService.getTemplates({
        pageNumber: 1,
        pageSize: 100,
        templateType: undefined // Get all templates
      });

      console.log('TemplateDataService: Loaded templates:', templatesResponse.items.length);

      // Step 2: Load custom values (needed for Amount field in rule builder)
      try {
        this.customValues = await customValueService.getCustomValueOptions();
        console.log('TemplateDataService: Loaded custom values:', this.customValues.length);
      } catch (error) {
        console.error('TemplateDataService: Failed to load custom values:', error);
      }

      // Step 3: Process each template using only prepare-record (contains all data we need)
      const templatePromises = templatesResponse.items.map(async (template) => {
        const templateData: TemplateData = {
          id: template.id,
          name: template.name,
          templateType: template.templateType,
          tenantId: template.tenantId,
          sections: [],
          fieldsWithoutSection: []
        };

        try {
          // Call prepare-record for each template (this contains all the data we need)
          const prepareResponse = await templateService.prepareRecord(template.id.toString());
          templateData.prepareRecordData = prepareResponse;
          
          // Extract sections and fields from prepare-record response
          templateData.sections = prepareResponse.sections || [];
          templateData.fieldsWithoutSection = []; // prepare-record organizes everything in sections
          
          console.log(`TemplateDataService: Loaded prepare-record data for template ${template.id} (${template.name})`);

          // Process custom fields from prepare-record data (no additional API calls needed!)
          const allFields = prepareResponse.sections.flatMap((section: any) => section.fields || []);

          const allowedFields = allFields.filter(
            (field: any) =>
              field.fieldType === FieldType.Dropdown ||
              field.fieldType === FieldType.Lookup ||
              field.fieldType === FieldType.Radio ||
              field.fieldType === FieldType.Checkbox ||
              field.fieldType === FieldType.Number
          );

          // Process each allowed field using data from prepare-record
          for (const field of allowedFields) {
            const customField: CustomFieldData = {
              id: field.id,
              label: field.label,
              fieldType: field.fieldType,
              lookupId: field.lookupId || undefined,
              templateId: template.id.toString()
            };

            // Extract field options from prepare-record response (no API calls needed!)
            if (
              field.fieldType === FieldType.Dropdown ||
              field.fieldType === FieldType.Radio ||
              field.fieldType === FieldType.Checkbox ||
              (field.fieldType === FieldType.Lookup && field.lookupOptions)
            ) {
              // Use lookupOptions from prepare-record response
              customField.options = field.lookupOptions?.map((opt: any) => ({
                id: opt.id,
                label: opt.value // PrepareRecordOption uses 'value' field for the label
              })) || [];
              
              // For lookup fields, also store as lookupValues for backward compatibility
              if (field.fieldType === FieldType.Lookup) {
                customField.lookupValues = field.lookupOptions?.map((opt: any) => ({
                  id: opt.id,
                  value: opt.value
                })) || [];
              }
            }

            this.customFields.push(customField);
          }

          console.log(`TemplateDataService: Processed template ${template.id} (${template.name}) with ${allowedFields.length} custom fields using only prepare-record data`);
        } catch (error) {
          console.warn(`TemplateDataService: Failed to load prepare-record for template ${template.id}:`, error);
          // Skip this template if prepare-record fails
        }

        return templateData;
      });

      // Wait for all templates to be processed
      this.templates = await Promise.all(templatePromises);
      
      console.log('TemplateDataService: Finished loading all template data');
      console.log(`TemplateDataService: Summary - Templates: ${this.templates.length}, Custom Fields: ${this.customFields.length}, Custom Values: ${this.customValues.length}`);
    } catch (error) {
      console.error('TemplateDataService: Failed to load template data:', error);
      throw error;
    }
  }

  /**
   * Get all templates
   */
  getTemplates(): TemplateData[] {
    return this.templates;
  }

  /**
   * Get templates by type
   */
  getTemplatesByType(templateType: TemplateType): TemplateData[] {
    return this.templates.filter(t => t.templateType === templateType);
  }

  /**
   * Get template by ID
   */
  getTemplate(id: number): TemplateData | undefined {
    return this.templates.find(t => t.id === id);
  }

  /**
   * Get all custom fields
   */
  getCustomFields(): CustomFieldData[] {
    return this.customFields;
  }

  /**
   * Get custom fields by template ID
   */
  getCustomFieldsByTemplate(templateId: string): CustomFieldData[] {
    return this.customFields.filter(f => f.templateId === templateId);
  }

  /**
   * Get custom field by ID
   */
  getCustomField(id: number): CustomFieldData | undefined {
    return this.customFields.find(f => f.id === id);
  }

  /**
   * Get all custom values
   */
  getCustomValues(): CustomValueData[] {
    return this.customValues;
  }

  /**
   * Get custom value by ID
   */
  getCustomValue(id: number): CustomValueData | undefined {
    return this.customValues.find(v => v.id === id);
  }

  /**
   * Get prepare-record data for a template
   */
  getPrepareRecordData(templateId: number): any | undefined {
    const template = this.getTemplate(templateId);
    return template?.prepareRecordData;
  }

  /**
   * Check if data is loaded
   */
  isDataLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Force reload all data (useful for development/testing)
   */
  async reload(): Promise<void> {
    this.isLoaded = false;
    this.isLoading = false;
    this.loadingPromise = null;
    this.templates = [];
    this.customFields = [];
    this.customValues = [];
    await this.loadAllTemplateData();
  }

  /**
   * Get field options for a custom field
   */
  getFieldOptions(customFieldId: number): { id: number; label: string }[] {
    const field = this.getCustomField(customFieldId);
    return field?.options || [];
  }

  /**
   * Get lookup values for a custom field
   */
  getLookupValues(customFieldId: number): { id: number; value: string }[] {
    const field = this.getCustomField(customFieldId);
    return field?.lookupValues || [];
  }

  /**
   * Get value labels for a custom field (for display purposes)
   */
  getCustomFieldValueLabels(customFieldId: number, jsonValue: string): string {
    try {
      const customField = this.getCustomField(customFieldId);
      if (!customField) return jsonValue;

      const parsedValues = JSON.parse(jsonValue);
      if (!Array.isArray(parsedValues)) return jsonValue;

      if (
        customField.fieldType === FieldType.Dropdown ||
        customField.fieldType === FieldType.Radio ||
        customField.fieldType === FieldType.Checkbox
      ) {
        const options = customField.options || [];
        const labels = parsedValues
          .map((id: number) => {
            const option = options.find((opt) => opt.id === id);
            return option ? option.label : id.toString();
          });
        // Format multiple values with brackets to show they're multiple selections
        return labels.length > 1 ? `[${labels.join(', ')}]` : labels[0] || jsonValue;
      } else if (customField.fieldType === FieldType.Lookup && customField.lookupValues) {
        const lookupValues = customField.lookupValues || [];
        const labels = parsedValues
          .map((id: number) => {
            const value = lookupValues.find((val) => val.id === id);
            return value ? value.value : id.toString();
          });
        // Format multiple values with brackets to show they're multiple selections
        return labels.length > 1 ? `[${labels.join(', ')}]` : labels[0] || jsonValue;
      }

      // For other field types, format multiple values with brackets
      return parsedValues.length > 1 ? `[${parsedValues.join(', ')}]` : String(parsedValues[0] || jsonValue);
    } catch (error) {
      console.error('Error getting custom field value labels:', error);
      return jsonValue;
    }
  }

  /**
   * Get custom value title by ID
   */
  getCustomValueTitle(customValueId: number): string {
    const customValue = this.getCustomValue(customValueId);
    return customValue ? `"${customValue.title}"` : `Custom Value #${customValueId}`;
  }

  /**
   * Get custom field label by ID
   */
  getCustomFieldLabel(customFieldId: number): string {
    const customField = this.getCustomField(customFieldId);
    return customField ? customField.label : `Custom Field #${customFieldId}`;
  }
}

// Export singleton instance
export const templateDataService = new TemplateDataService();
