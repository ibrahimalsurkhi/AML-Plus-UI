# Value Labels Fix for Custom Fields

## Problem Analysis
The issue was in the rule preview service where custom field values were showing as IDs (104, 103) instead of human-readable labels (Normal, Other).

**Root Cause**: The previous implementation tried to resolve labels asynchronously within a synchronous function, which doesn't work. The `getRulePreview` function couldn't use `await` for label resolution.

## Solution Implemented

### 1. **Pre-loading Strategy**
Instead of loading field options on-demand during preview generation, we now pre-load all custom field options when the cache is initialized:

```typescript
// Pre-load field options for dropdown/radio/checkbox fields
for (const field of allowedFields) {
  if (field.fieldType === FieldType.Dropdown ||
      field.fieldType === FieldType.Radio ||
      field.fieldType === FieldType.Checkbox) {
    const options = await templateService.getFieldOptions('15', field.id!);
    customFieldOptionsCache[field.id!] = options.map(opt => ({
      id: opt.id!,
      label: opt.label
    }));
  } else if (field.fieldType === FieldType.Lookup && field.lookupId) {
    const lookupValues = await lookupService.getLookupValues(field.lookupId, {
      pageNumber: 1,
      pageSize: 100
    });
    lookupValuesCache[field.lookupId] = lookupValues.items.map(val => ({
      id: val.id,
      value: val.value
    }));
  }
}
```

### 2. **Synchronous Label Resolution**
The label resolution function is now synchronous and uses pre-loaded cache:

```typescript
function getCustomFieldValueLabels(customFieldId: number, jsonValue: string): string {
  const customField = customFieldsCache.find(cf => cf.id === customFieldId);
  if (!customField) return jsonValue;
  
  const parsedValues = JSON.parse(jsonValue);
  if (!Array.isArray(parsedValues)) return jsonValue;
  
  if (customField.fieldType === FieldType.Dropdown ||
      customField.fieldType === FieldType.Radio ||
      customField.fieldType === FieldType.Checkbox) {
    // Use cached field options
    const options = customFieldOptionsCache[customField.id] || [];
    const labels = parsedValues
      .map((id: number) => {
        const option = options.find(opt => opt.id === id);
        return option ? option.label : id.toString();
      })
      .join(', ');
    return labels || jsonValue;
  }
  // Similar logic for lookup fields...
}
```

### 3. **Enhanced Caching System**
```typescript
// Three-tier caching system:
let customFieldsCache = [];           // Field definitions
let customFieldOptionsCache = {};     // Dropdown/radio/checkbox options
let lookupValuesCache = {};          // Lookup values
```

### 4. **Updated Preview Logic**
```typescript
// Now properly resolves labels for custom fields
} else if (cond.customFieldId && cond.jsonValue) {
  value = getCustomFieldValueLabels(cond.customFieldId, cond.jsonValue);
} else if (cond.selectedFieldId && isCustomField(cond.selectedFieldId) && cond.jsonValue) {
  const customFieldId = getCustomFieldId(cond.selectedFieldId);
  value = getCustomFieldValueLabels(customFieldId, cond.jsonValue);
}
```

## Expected Results

### Before Fix:
```
Investor Type In 104, 103 by Sender for All Accounts
```

### After Fix:
```
Investor Type In Normal, Other by Sender for All Accounts
```

## Key Improvements

1. **Performance**: Options are loaded once and cached, reducing API calls
2. **Reliability**: Synchronous resolution eliminates async/await issues
3. **Completeness**: Both dropdown and lookup fields are fully supported
4. **Debugging**: Added comprehensive console logging for troubleshooting

## Testing Recommendations

1. **Clear Browser Cache**: Refresh the page to ensure new cache loading takes effect
2. **Test Different Field Types**: 
   - Dropdown fields (e.g., Investor Type)
   - Radio button fields
   - Checkbox fields  
   - Lookup fields
   - Number fields (should show raw values)
3. **Verify Labels**: Ensure all selected values show as readable labels, not IDs

## Technical Notes

- The cache loading happens asynchronously when `getRulePreview()` is first called
- Failed option loading is handled gracefully (falls back to showing IDs)
- The cache reset function `resetRulePreviewCaches()` is available for development/testing
- Console logging shows the resolution process for debugging

The fix ensures that custom field values display as human-readable labels in both the rule preview and any other places where rule conditions are shown.
