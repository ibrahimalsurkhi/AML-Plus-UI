# Custom Fields Implementation in Rule Builder

## Overview
Successfully implemented custom field support in the Rule Builder page, allowing users to create conditions using dynamic template fields in addition to static fields like Transaction Status, Amount, and Risk Status.

## Implementation Details

### 1. Enhanced Field Selection
- **Location**: `src/pages/rules/RuleCondition.tsx`
- **Enhancement**: Modified the field dropdown to include both static and custom fields
- **Features**:
  - Displays static fields (Transaction Status, Amount, Risk Status)
  - Shows a divider: "--- Custom Fields ---"
  - Dynamically loads custom fields from `templateService.getTemplateFields('15')`
  - Filters fields by allowed types: dropdown, lookup, radio, checkbox, number

### 2. Field Type Handling

#### Dropdown, Radio, Checkbox Fields
- **Behavior**: Handled as multi-select lists
- **Data Source**: `templateService.getFieldOptions('15', field.id)`
- **UI Component**: Custom `MultiSelect` component with checkboxes
- **Value Storage**: JSON array of selected option IDs

#### Lookup Fields
- **Behavior**: Handled as multi-select lists
- **Data Source**: `lookupService.getLookupValues(field.lookupId, ...)`
- **UI Component**: Custom `MultiSelect` component
- **Value Storage**: JSON array of selected lookup value IDs

#### Number Fields
- **Behavior**: Simple number input (custom values option hidden)
- **UI Component**: Standard number input field
- **Operators**: Full comparison operators (=, !=, >, <, >=, <=, Contains, etc.)

### 3. Enhanced Data Structure

#### Updated Condition Interface
```typescript
export interface Condition {
  // ... existing properties ...
  
  // New properties for custom fields
  selectedFieldId?: string | number | null; // Stores either static ID or custom_<id>
  customFieldType?: number | null; // FieldType of the custom field
  customFieldOptions?: Array<{ id: number; label: string; value?: string }>;
  customFieldLookupId?: number | null; // Lookup ID for lookup fields
}
```

#### Field Identification System
- **Static fields**: Use numeric IDs (1, 2, 3, etc.)
- **Custom fields**: Use prefixed IDs (`custom_123`, `custom_456`, etc.)
- **Helper functions**: `isCustomField()`, `getCustomFieldId()`, `createCustomFieldId()`

### 4. Operator Logic

#### Static Fields
- **Transaction Status/Risk Status**: In/Not In operators
- **Amount/Numbers**: Comparison operators (=, !=, >, <, etc.)

#### Custom Fields
- **Dropdown/Radio/Checkbox/Lookup**: In/Not In operators
- **Number**: Full comparison operators
- **Auto-detection**: Based on `customFieldType` property

### 5. Key Files Modified

1. **`src/pages/rules/enums.ts`**
   - Added field identification helpers
   - Added divider constant for dropdown separation

2. **`src/pages/rules/RuleCondition.tsx`**
   - Enhanced field selection dropdown
   - Added custom field loading logic
   - Implemented field-specific value inputs
   - Updated operator logic for custom fields

3. **`src/pages/rules/RuleGroup.tsx`**
   - Updated default condition to include new properties

## How It Works

### User Flow
1. **Field Selection**: User opens field dropdown and sees:
   ```
   Transaction Status
   Amount  
   Risk Status
   --- Custom Fields ---
   Customer Type (dropdown)
   Risk Level (lookup)
   Account Balance (number)
   ```

2. **Custom Field Selection**: When user selects a custom field:
   - System identifies it as custom using the `custom_` prefix
   - Loads appropriate options based on field type
   - Updates UI to show relevant input components

3. **Value Input**: Based on field type:
   - **Dropdown/Radio/Checkbox**: Multi-select with checkboxes
   - **Lookup**: Multi-select with lookup values
   - **Number**: Simple number input

4. **Operator Selection**: Shows relevant operators:
   - **List fields**: In/Not In
   - **Number fields**: =, !=, >, <, >=, <=, Contains, etc.

### Technical Features
- **Lazy Loading**: Custom field options loaded only when field is selected
- **Type Safety**: Full TypeScript support with proper interfaces
- **Error Handling**: Graceful fallbacks for loading failures
- **Performance**: Efficient state management and minimal re-renders
- **Backward Compatibility**: Existing rules continue to work unchanged

## API Dependencies
- `templateService.getTemplateFields('15')`: Fetches template fields
- `templateService.getFieldOptions('15', fieldId)`: Fetches dropdown/radio/checkbox options
- `lookupService.getLookupValues(lookupId, {...})`: Fetches lookup values

## Configuration
- **Template ID**: Currently hardcoded to '15' (transaction template)
- **Allowed Field Types**: `Dropdown`, `Lookup`, `Radio`, `Checkbox`, `Number`
- **Page Size**: 100 items for lookup values (configurable)

## Benefits
1. **Flexibility**: Rules can now use any custom field from templates
2. **Consistency**: Same UI patterns for static and custom fields
3. **Scalability**: Easy to add new field types in the future
4. **User Experience**: Clear separation between static and custom fields
5. **Maintainability**: Clean separation of concerns and type safety

## Future Enhancements
- Support for additional field types (Text, TextArea, Date)
- Dynamic template ID selection
- Field validation based on template requirements
- Custom field grouping by sections
- Performance optimizations for large field lists
