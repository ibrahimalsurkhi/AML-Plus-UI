# DataPagination Component

A reusable pagination component designed to work seamlessly with the `PaginatedResponse<T>` interface used throughout the AML-Plus-UI system.

## Features

- 🔄 **Consistent Pagination**: Works with standard `PaginatedResponse` interface
- 📱 **Responsive Design**: Adapts to different screen sizes
- 🎨 **Customizable**: Configurable appearance and behavior
- ♿ **Accessible**: Built with accessibility best practices
- 📊 **Page Info**: Optional display of item counts and ranges
- 🎯 **Smart Ellipsis**: Intelligent page number truncation for large datasets

## Basic Usage

```typescript
import { DataPagination, extractPaginationData } from '@/components/common/DataPagination';
import { useState } from 'react';

const MyDataPage = () => {
  const [data, setData] = useState<PaginatedResponse<MyDataType> | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  // ... fetch data logic

  return (
    <div>
      {/* Your data table/grid here */}
      
      {data && (
        <DataPagination
          paginationData={extractPaginationData(data)}
          onPageChange={setPageNumber}
          showPageInfo={true}
        />
      )}
    </div>
  );
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `paginationData` | `PaginationData` | **Required** | Pagination metadata from API response |
| `onPageChange` | `(page: number) => void` | **Required** | Callback when user changes page |
| `maxVisiblePages` | `number` | `5` | Maximum number of page links to show |
| `showPageInfo` | `boolean` | `true` | Show "Showing X-Y of Z items" text |
| `className` | `string` | `''` | Additional CSS classes for container |

## Expected JSON Structure

The component expects data in this format (from `PaginatedResponse<T>`):

```json
{
  "items": [...],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 150,
  "totalPages": 8,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

## Advanced Usage

### Custom Styling

```typescript
<DataPagination
  paginationData={extractPaginationData(data)}
  onPageChange={setPageNumber}
  className="my-custom-pagination-styles"
  maxVisiblePages={7}
  showPageInfo={false}
/>
```

### With Loading State

```typescript
const MyPage = () => {
  const [loading, setLoading] = useState(false);
  
  const handlePageChange = async (page: number) => {
    setLoading(true);
    try {
      const newData = await fetchData(page);
      setData(newData);
      setPageNumber(page);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Data display */}
      
      {!loading && data && (
        <DataPagination
          paginationData={extractPaginationData(data)}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};
```

## Integration Examples

### Transactions Page
```typescript
// Already implemented in src/pages/transactions/index.tsx
<DataPagination
  paginationData={extractPaginationData(transactions)}
  onPageChange={setPageNumber}
  showPageInfo={true}
/>
```

### Records Page
```typescript
<DataPagination
  paginationData={extractPaginationData(records)}
  onPageChange={(page) => {
    setCurrentPage(page);
    fetchRecords(page);
  }}
  maxVisiblePages={7}
/>
```

### Cases Page
```typescript
<DataPagination
  paginationData={extractPaginationData(cases)}
  onPageChange={setPageNumber}
  showPageInfo={true}
  className="mt-8"
/>
```

## Helper Functions

### `extractPaginationData<T>(response)`

Extracts pagination metadata from a `PaginatedResponse<T>` object:

```typescript
const paginationData = extractPaginationData(apiResponse);
// Returns: { pageNumber, pageSize, totalCount, totalPages, hasPreviousPage, hasNextPage }
```

## Behavior

- **Auto-hide**: Component doesn't render when `totalPages <= 1`
- **Smart Ellipsis**: Shows ellipsis (...) when there are many pages
- **Responsive**: Page info text stacks vertically on small screens
- **Accessible**: Proper ARIA labels and keyboard navigation
- **Consistent**: Matches the existing UI design system

## Migration Guide

### From Manual Pagination

Replace this pattern:
```typescript
// Old manual pagination
{data.totalPages > 1 && (
  <Pagination>
    <PaginationContent>
      {/* Manual pagination logic */}
    </PaginationContent>
  </Pagination>
)}
```

With this:
```typescript
// New DataPagination component
<DataPagination
  paginationData={extractPaginationData(data)}
  onPageChange={setPageNumber}
/>
```

This provides consistent behavior and reduces code duplication across the application.
