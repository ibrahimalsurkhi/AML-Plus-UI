# Best Practices Guide - AML-Plus-UI Technology Stack

## Table of Contents
1. [React Best Practices](#react-best-practices)
2. [TypeScript Best Practices](#typescript-best-practices)
3. [Vite Best Practices](#vite-best-practices)
4. [Tailwind CSS Best Practices](#tailwind-css-best-practices)
5. [State Management Best Practices](#state-management-best-practices)
6. [API Integration Best Practices](#api-integration-best-practices)
7. [Authentication Best Practices](#authentication-best-practices)
8. [Performance Best Practices](#performance-best-practices)
9. [Security Best Practices](#security-best-practices)
10. [Testing Best Practices](#testing-best-practices)
11. [Code Quality Best Practices](#code-quality-best-practices)
12. [Deployment Best Practices](#deployment-best-practices)

---

## React Best Practices

### Component Structure

#### 1. Functional Components with Hooks
```typescript
// ✅ Good: Use functional components with hooks
import React, { useState, useEffect } from 'react';

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <LoadingSpinner />;
  if (!user) return <ErrorMessage />;

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};
```

#### 2. Component Organization
```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── layout/               # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   └── features/             # Feature-specific components
│       ├── dashboard/
│       ├── sanctions/
│       └── transactions/
```

#### 3. Custom Hooks
```typescript
// ✅ Good: Extract reusable logic into custom hooks
import { useState, useEffect } from 'react';
import { api } from '@/services/api';

interface UseApiOptions<T> {
  url: string;
  dependencies?: any[];
  transform?: (data: any) => T;
}

export function useApi<T>({ url, dependencies = [], transform }: UseApiOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api.get(url)
      .then(response => {
        const result = transform ? transform(response.data) : response.data;
        setData(result);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, dependencies);

  return { data, loading, error };
}
```

### Props and State Management

#### 1. Props Interface Definition
```typescript
// ✅ Good: Define clear prop interfaces
interface SearchFormProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
  initialValue?: string;
}

// ❌ Bad: Using any or loose typing
interface SearchFormProps {
  onSearch: any;
  placeholder?: any;
  disabled?: any;
}
```

#### 2. State Updates
```typescript
// ✅ Good: Use functional updates for state that depends on previous state
const [count, setCount] = useState(0);

const increment = () => {
  setCount(prev => prev + 1);
};

// ✅ Good: Use spread operator for object updates
const [user, setUser] = useState<User>({ name: '', email: '' });

const updateUser = (updates: Partial<User>) => {
  setUser(prev => ({ ...prev, ...updates }));
};
```

### Error Boundaries
```typescript
// ✅ Good: Implement error boundaries for graceful error handling
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}
```

---

## TypeScript Best Practices

### Type Definitions

#### 1. Interface vs Type
```typescript
// ✅ Good: Use interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// ✅ Good: Use types for unions, intersections, and complex types
type UserRole = 'admin' | 'user' | 'guest';
type ApiResponse<T> = { data: T; status: number; message: string };
```

#### 2. Strict Type Checking
```typescript
// ✅ Good: Enable strict mode in tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

#### 3. Generic Types
```typescript
// ✅ Good: Use generics for reusable components
interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
}

function Table<T>({ data, columns, onRowClick }: TableProps<T>) {
  return (
    <table>
      {data.map((item, index) => (
        <tr key={index} onClick={() => onRowClick?.(item)}>
          {columns.map(column => (
            <td key={column.key}>{column.render(item)}</td>
          ))}
        </tr>
      ))}
    </table>
  );
}
```

### Type Safety

#### 1. Avoid `any` Type
```typescript
// ❌ Bad: Using any
const handleClick = (event: any) => {
  console.log(event.target.value);
};

// ✅ Good: Proper typing
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  console.log(event.currentTarget.value);
};
```

#### 2. Null Safety
```typescript
// ✅ Good: Handle null/undefined properly
interface User {
  name: string;
  email?: string; // Optional property
}

const UserProfile: React.FC<{ user: User | null }> = ({ user }) => {
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      {user.email && <p>{user.email}</p>}
    </div>
  );
};
```

---

## Vite Best Practices

### Configuration

#### 1. Optimize Build Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

#### 2. Environment Variables
```typescript
// ✅ Good: Use Vite's env variable system
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const IS_DEV = import.meta.env.DEV;
const IS_PROD = import.meta.env.PROD;
```

#### 3. Asset Handling
```typescript
// ✅ Good: Use Vite's asset handling
import logo from '@/assets/logo.svg';
import styles from '@/styles/main.css';

// In component
<img src={logo} alt="Logo" />
```

---

## Tailwind CSS Best Practices

### Class Organization

#### 1. Consistent Class Ordering
```typescript
// ✅ Good: Follow consistent class ordering
<div className="
  flex items-center justify-between
  p-4 m-2
  bg-white border border-gray-200 rounded-lg
  hover:bg-gray-50 hover:border-gray-300
  transition-all duration-200
  text-sm font-medium text-gray-900
">
  Content
</div>
```

#### 2. Custom Components with Tailwind
```typescript
// ✅ Good: Create reusable components with Tailwind
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  onClick 
}) => {
  const baseClasses = "font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary-dark focus:ring-primary",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

#### 3. Responsive Design
```typescript
// ✅ Good: Use responsive prefixes consistently
<div className="
  grid grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3 
  xl:grid-cols-4
  gap-4 md:gap-6 lg:gap-8
">
  {/* Grid items */}
</div>
```

### Custom Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

---

## State Management Best Practices

### React Context

#### 1. Context Provider Pattern
```typescript
// ✅ Good: Create context with provider pattern
interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

#### 2. Local State Management
```typescript
// ✅ Good: Use useReducer for complex state
interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
}

type FormAction = 
  | { type: 'SET_VALUE'; field: string; value: any }
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'SET_TOUCHED'; field: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END' };

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_VALUE':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: '' }
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error }
      };
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true };
    case 'SUBMIT_END':
      return { ...state, isSubmitting: false };
    default:
      return state;
  }
};
```

---

## API Integration Best Practices

### Axios Configuration

#### 1. Centralized API Client
```typescript
// ✅ Good: Centralized API configuration
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }
}

export const apiClient = new ApiClient(import.meta.env.VITE_API_URL);
```

#### 2. Type-Safe API Calls
```typescript
// ✅ Good: Type-safe API service
interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserRequest {
  name: string;
  email: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

class UserService {
  async getUsers(): Promise<User[]> {
    return apiClient.get<ApiResponse<User[]>>('/users').then(res => res.data);
  }

  async getUser(id: string): Promise<User> {
    return apiClient.get<ApiResponse<User>>(`/users/${id}`).then(res => res.data);
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    return apiClient.post<ApiResponse<User>>('/users', userData).then(res => res.data);
  }
}

export const userService = new UserService();
```

---

## Authentication Best Practices

### JWT Token Management

#### 1. Secure Token Storage
```typescript
// ✅ Good: Secure token management
class TokenManager {
  private static readonly TOKEN_KEY = 'authToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';

  static setTokens(token: string, refreshToken: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static clearTokens() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
```

#### 2. Protected Routes
```typescript
// ✅ Good: Route protection
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
};
```

---

## Performance Best Practices

### Code Splitting

#### 1. Route-Based Code Splitting
```typescript
// ✅ Good: Lazy load routes
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('@/pages/dashboard/DashboardPage'));
const SanctionSearch = lazy(() => import('@/pages/sanction-search/SanctionSearchPage'));
const Transactions = lazy(() => import('@/pages/transactions/TransactionsPage'));

const AppRoutes = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/sanction-search" element={<SanctionSearch />} />
      <Route path="/transactions" element={<Transactions />} />
    </Routes>
  </Suspense>
);
```

#### 2. Component-Level Code Splitting
```typescript
// ✅ Good: Lazy load heavy components
const HeavyChart = lazy(() => import('@/components/charts/HeavyChart'));

const Dashboard = () => {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      {showChart && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
};
```

### Memoization

#### 1. React.memo for Components
```typescript
// ✅ Good: Memoize expensive components
interface DataTableProps {
  data: any[];
  columns: Column[];
  onRowClick?: (row: any) => void;
}

const DataTable = React.memo<DataTableProps>(({ data, columns, onRowClick }) => {
  return (
    <table>
      {data.map((row, index) => (
        <tr key={index} onClick={() => onRowClick?.(row)}>
          {columns.map(column => (
            <td key={column.key}>{column.render(row)}</td>
          ))}
        </tr>
      ))}
    </table>
  );
});
```

#### 2. useMemo and useCallback
```typescript
// ✅ Good: Use memoization for expensive calculations
const ExpensiveComponent: React.FC<{ data: number[] }> = ({ data }) => {
  const sortedData = useMemo(() => {
    return data.sort((a, b) => a - b);
  }, [data]);

  const handleClick = useCallback((item: number) => {
    console.log('Clicked:', item);
  }, []);

  return (
    <div>
      {sortedData.map(item => (
        <button key={item} onClick={() => handleClick(item)}>
          {item}
        </button>
      ))}
    </div>
  );
};
```

---

## Security Best Practices

### Input Validation

#### 1. Client-Side Validation
```typescript
// ✅ Good: Comprehensive input validation
import * as yup from 'yup';

const userSchema = yup.object({
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
    .required('Password is required'),
});

const UserForm: React.FC = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = async (field: string, value: any) => {
    try {
      await userSchema.validateAt(field, { [field]: value });
      setErrors(prev => ({ ...prev, [field]: '' }));
    } catch (error) {
      setErrors(prev => ({ ...prev, [field]: error.message }));
    }
  };

  return (
    <form>
      <input
        type="text"
        name="name"
        onChange={(e) => validateField('name', e.target.value)}
      />
      {errors.name && <span className="text-red-500">{errors.name}</span>}
    </form>
  );
};
```

#### 2. XSS Prevention
```typescript
// ✅ Good: Sanitize user input
import DOMPurify from 'dompurify';

const SafeContent: React.FC<{ content: string }> = ({ content }) => {
  const sanitizedContent = DOMPurify.sanitize(content);
  
  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
};
```

### CSRF Protection
```typescript
// ✅ Good: Include CSRF tokens in requests
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
  },
});
```

---

## Testing Best Practices

### Unit Testing

#### 1. Component Testing
```typescript
// ✅ Good: Test components with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  it('displays user information', () => {
    const user = { id: '1', name: 'John Doe', email: 'john@example.com' };
    
    render(<UserProfile user={user} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('handles user update', () => {
    const onUpdate = jest.fn();
    const user = { id: '1', name: 'John Doe', email: 'john@example.com' };
    
    render(<UserProfile user={user} onUpdate={onUpdate} />);
    
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Jane Doe' } });
    fireEvent.click(screen.getByText('Save'));
    
    expect(onUpdate).toHaveBeenCalledWith({ ...user, name: 'Jane Doe' });
  });
});
```

#### 2. Custom Hook Testing
```typescript
// ✅ Good: Test custom hooks
import { renderHook, act } from '@testing-library/react';
import { useApi } from './useApi';

describe('useApi', () => {
  it('fetches data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => mockData,
    } as Response);

    const { result } = renderHook(() => useApi({ url: '/api/test' }));

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
  });
});
```

### Integration Testing
```typescript
// ✅ Good: Test API integration
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserList } from './UserList';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('UserList Integration', () => {
  it('loads and displays users', async () => {
    const mockUsers = [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' },
    ];

    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ data: mockUsers }),
    } as Response);

    render(
      <QueryClientProvider client={queryClient}>
        <UserList />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });
});
```

---

## Code Quality Best Practices

### ESLint Configuration

#### 1. Strict ESLint Rules
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    '@eslint/js',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/prop-types': 'off', // Using TypeScript
    'react-hooks/exhaustive-deps': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
```

#### 2. Prettier Configuration
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Code Organization

#### 1. File Naming Conventions
```
✅ Good:
- UserProfile.tsx
- useApi.ts
- apiClient.ts
- userService.ts

❌ Bad:
- userProfile.tsx
- use_api.ts
- ApiClient.ts
- UserService.ts
```

#### 2. Import Organization
```typescript
// ✅ Good: Organized imports
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. Third-party libraries
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

// 3. Internal components
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

// 4. Types and utilities
import type { User } from '@/types/user';
import { formatDate } from '@/utils/date';
```

---

## Deployment Best Practices

### Environment Configuration

#### 1. Environment Variables
```bash
# .env.development
VITE_API_URL=http://localhost:3000/api
VITE_ENVIRONMENT=development
VITE_DEBUG=true

# .env.production
VITE_API_URL=https://api.aml-plus.com
VITE_ENVIRONMENT=production
VITE_DEBUG=false
```

#### 2. Build Optimization
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog'],
        },
      },
    },
    sourcemap: false, // Disable in production
  },
});
```

### CI/CD Pipeline

#### 1. GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to production
        run: |
          # Deployment commands
```

### Monitoring and Error Tracking

#### 1. Error Boundary with Reporting
```typescript
// ✅ Good: Error boundary with reporting
class ErrorBoundary extends Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report to error tracking service
    console.error('Error caught:', error, errorInfo);
    
    // Send to monitoring service
    if (import.meta.env.PROD) {
      // Send to Sentry, LogRocket, etc.
    }
  }
}
```

#### 2. Performance Monitoring
```typescript
// ✅ Good: Performance monitoring
import { useEffect } from 'react';

const usePerformanceMonitoring = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 100) { // Log slow components
        console.warn(`${componentName} took ${duration}ms to render`);
      }
    };
  });
};
```

---

## Summary

This best practices guide covers the essential patterns and techniques for building robust, maintainable, and performant applications with your technology stack. Key takeaways:

1. **Use TypeScript strictly** - Enable all strict options and avoid `any`
2. **Follow React patterns** - Use functional components, hooks, and proper state management
3. **Optimize performance** - Implement code splitting, memoization, and lazy loading
4. **Ensure security** - Validate inputs, prevent XSS, and handle authentication properly
5. **Write tests** - Comprehensive testing for components, hooks, and integration
6. **Maintain code quality** - Use ESLint, Prettier, and consistent naming conventions
7. **Monitor and deploy** - Proper CI/CD, error tracking, and performance monitoring

Remember to adapt these practices to your specific project requirements and team preferences while maintaining consistency across the codebase. 