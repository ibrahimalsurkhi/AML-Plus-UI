# Custom Field ID Implementation

## Overview
Updated the rule builder to properly handle custom field selection by setting the `isAggregatedCustomField` property and ensuring the custom field ID is sent correctly.

## Changes Made

### 1. **Field Selection Logic Update**

When a custom field is selected, the system now sets:
- `isAggregatedCustomField: true` - Indicates this is a custom field condition
- `customFieldId: [field_id]` - The actual custom field ID from the template
- `aggregateFieldId: null` - Clears any static field selection

When a static field is selected:
- `isAggregatedCustomField: false` - Indicates this is a static field condition  
- `aggregateFieldId: [field_id]` - The static field ID
- `customFieldId: null` - Clears any custom field selection

### 2. **Code Implementation**

```typescript
if (isCustom) {
  // Handle custom field selection
  const customFieldId = getCustomFieldId(v);
  const field = customFields.find(f => f.id === customFieldId);
  
  onChange({
    ...condition,
    selectedFieldId: v,
    customFieldId: customFieldId,
    customFieldType: field?.fieldType || null,
    customFieldLookupId: field?.lookupId || null,
    isAggregatedCustomField: true, // ✅ Set to true for custom fields
    aggregateFieldId: null, // clear static field
    jsonValue: '',
    aggregateFunction: null,
    ComparisonOperator: undefined
  });
} else {
  // Handle static field selection
  onChange({
    ...condition,
    selectedFieldId: v,
    aggregateFieldId: v ? Number(v) : null,
    customFieldId: null, // clear custom field
    customFieldType: null,
    customFieldLookupId: null,
    isAggregatedCustomField: false, // ✅ Set to false for static fields
    jsonValue: '',
    aggregateFunction: null,
    ComparisonOperator: undefined
  });
}
```

### 3. **Data Structure**

When a custom field condition is created, the condition object will contain:

```typescript
{
  title: "Condition 1",
  isAggregated: false,
  isAggregatedCustomField: true,        // ✅ Indicates custom field
  aggregateFieldId: null,               // Static field ID (null for custom)
  customFieldId: 123,                   // ✅ Custom field ID from template
  customFieldType: 1,                   // FieldType (Dropdown/Radio/etc.)
  selectedFieldId: "custom_123",        // Internal tracking ID
  ComparisonOperator: 9,                // Operator (In/Not In/etc.)
  jsonValue: "[104,103]",              // Selected values as JSON
  // ... other properties
}
```

### 4. **Backend Integration**

The backend should now receive:
- `isAggregatedCustomField: true` when the condition uses a custom field
- `customFieldId: [number]` containing the template field ID
- `aggregateFieldId: null` for custom fields (or vice versa for static fields)

### 5. **Enhanced Debugging**

Added `isAggregatedCustomField` to the debug logging in the rule preview service to help track the property:

```typescript
console.log('Condition data:', {
  aggregateFieldId: cond.aggregateFieldId,
  customFieldId: cond.customFieldId,
  selectedFieldId: cond.selectedFieldId,
  isAggregatedCustomField: cond.isAggregatedCustomField, // ✅ Added to logging
  // ... other properties
});
```

## How It Works

1. **User selects a custom field** (e.g., "Investor Type" from dropdown)
2. **System detects** it's a custom field using the `custom_` prefix
3. **Sets properties**:
   - `isAggregatedCustomField = true`
   - `customFieldId = 123` (actual template field ID)
   - `aggregateFieldId = null`
4. **User configures condition** (operator, values)
5. **Condition is saved/sent** with proper custom field identification

## Validation

To verify the implementation is working:

1. **Open browser dev tools** and check console logs
2. **Select a custom field** in the rule builder
3. **Look for debug output** showing:
   ```
   Condition data: {
     isAggregatedCustomField: true,
     customFieldId: 123,
     aggregateFieldId: null,
     ...
   }
   ```

## Benefits

1. **Clear Identification**: Backend can easily distinguish custom vs static fields
2. **Proper Field Reference**: Custom field ID directly references the template field
3. **Consistent Data Flow**: Same pattern for all custom field types
4. **Debugging Support**: Console logging helps track the data flow
5. **Future-Proof**: Structure supports additional custom field features

The implementation ensures that when users select custom fields, the backend receives all necessary information to properly process and store the rule conditions.
