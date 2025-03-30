
# Feature Development Guidance

## Technology Stack Overview

This project uses a dual-platform architecture with shared backend services:

- **Web Application**: React/Vite with TypeScript
- **Mobile Application**: React Native/Expo
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)

## Development Considerations

When implementing new features, consider the following aspects to ensure system-wide integration:

### 1. System-Wide Integration

- **Data Consistency**: Ensure all features maintain real-time data synchronization across all modules
- **Workflow Cohesion**: New features should respect the existing user journey flows
- **End-to-End Experience**: Consider how your feature affects the complete workflow from rider management to fleet operations

### 2. Frontend Development

#### Web (React/Vite)
- Use Shadcn UI components for consistent styling
- Follow existing component organization patterns
- Implement Tailwind CSS for styling with responsive design
- Use TypeScript for type safety

#### Mobile (React Native/Expo)
- Use React Native Paper components for UI consistency
- Ensure responsive layouts for various device sizes
- Maintain platform-specific considerations while sharing logic

### 3. Backend Integration

- **Supabase Database**:
  - Design normalized data models
  - Implement appropriate Row Level Security (RLS) policies
  - Consider data relationships and constraints

- **Authentication**:
  - Use Supabase Auth for user management
  - Implement proper role-based access control

- **Storage**:
  - Use Supabase Storage for file management
  - Implement secure access patterns

### 4. Data Fetching & State Management

- Use Tanstack React Query for data fetching and caching
- Follow the established pattern for API calls:
  ```typescript
  const { data, isLoading, error } = useQuery({
    queryKey: ['resourceName'],
    queryFn: fetchResourceData,
  });
  ```
- Use the custom hooks in the codebase for API operations

### 5. Performance Considerations

- Implement lazy loading where appropriate
- Use virtualization for long lists
- Optimize API calls to minimize database load
- Consider edge functions for intensive operations

### 6. Error Handling

- Implement consistent error handling patterns
- Use toast notifications for user feedback
- Log errors appropriately for debugging

### 7. Testing Strategy

- Test new features across devices and browsers
- Ensure mobile responsiveness
- Verify data integrity with backend operations

## Implementation Patterns

### Example: Adding a New Entity Management Feature

1. **Database Setup**:
   - Create appropriate tables in Supabase
   - Set up RLS policies
   - Define relationships

2. **API Integration**:
   - Create API functions in appropriate service files
   - Implement CRUD operations
   - Set up React Query hooks

3. **UI Implementation**:
   - Create reusable components
   - Implement list and detail views
   - Add forms for data entry

4. **Navigation**:
   - Update router configuration
   - Add navigation links

### Example: Adding Dashboard Widgets

1. **Data Source**:
   - Identify required data
   - Create queries or aggregations

2. **Component Creation**:
   - Build widget component
   - Implement loading states
   - Add error handling

3. **Dashboard Integration**:
   - Add widget to dashboard layout
   - Consider responsive behavior

## Documentation

- Comment your code appropriately
- Update relevant documentation
- Provide usage examples for complex features

## Cross-Cutting Concerns

- **Security**: Ensure proper authentication and authorization
- **Accessibility**: Follow web accessibility guidelines
- **Internationalization**: Support for multiple languages if required
- **Compliance**: Adhere to data protection regulations

By following these guidelines, new features will maintain consistency with the existing system while ensuring high quality, performance, and user experience.
