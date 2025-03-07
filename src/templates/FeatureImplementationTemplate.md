# Feature Implementation Template

## 1. Feature Overview
- **Name**: [Feature Name]
- **Description**: Brief description of what the feature does
- **Primary Stakeholders**: Which user roles will use this feature
- **Integration Points**: List of existing modules this feature will interact with

## 2. System-Wide Integration Checklist
- [ ] Feature is accessible through existing navigation structure
- [ ] Uses consistent state management patterns (React Query hooks, context, etc.)
- [ ] Integrates with existing authentication/authorization flow
- [ ] Connects to the appropriate data sources and services
- [ ] Utilizes common UI components and design patterns
- [ ] Implements proper error handling and logging

## 3. Workflow Consistency Checklist
- [ ] User journey fits logically within the application flow
- [ ] Navigation between related features is intuitive
- [ ] States (loading, error, success) follow established patterns
- [ ] Feature respects user permissions and access controls
- [ ] UI/UX is consistent with existing patterns
- [ ] Form validations follow established patterns

## 4. Data Accuracy & Sync Checklist
- [ ] Implements proper TypeScript interfaces/types
- [ ] Uses React Query for data fetching with appropriate cache settings
- [ ] Implements optimistic updates where appropriate
- [ ] Includes proper validation at form and API levels
- [ ] Handles concurrent edits or race conditions
- [ ] Error states properly revert data to consistent state

## 5. Best Practices Checklist
- [ ] Uses proper component composition
- [ ] Implements responsive design principles
- [ ] Follows accessibility standards (ARIA attributes, keyboard navigation)
- [ ] Uses proper code organization (hooks, utilities, components)
- [ ] Includes appropriate test coverage
- [ ] Documentation is clear and comprehensive

## 6. Implementation Details

### Data Models
```typescript
// Define TypeScript interfaces for the feature
interface FeatureType {
  id: string;
  name: string;
  // other properties
}
```

### Component Structure
```
src/
└── components/
    └── feature-name/
        ├── FeatureList.tsx         // List view of feature items
        ├── FeatureDetail.tsx       // Detail view of a single item
        ├── FeatureForm.tsx         // Create/edit form
        ├── FeatureStats.tsx        // Statistics or metrics
        └── index.ts                // Exports
```

### API Integration
```typescript
// Example React Query hook
export const useFeatureData = () => {
  return useQuery({
    queryKey: ['feature-name'],
    queryFn: async () => {
      // Implementation
      return data;
    },
  });
};
```

### Routing
```typescript
// Routes to add to App.tsx
<Route path="/feature-name" element={<FeaturePage />} />
<Route path="/feature-name/:id" element={<FeatureDetailPage />} />
```

## 7. Testing Strategy
- Unit tests for utilities and hooks
- Component tests for UI components
- Integration tests for feature workflows
- End-to-end tests for critical paths

## 8. Deployment & Rollout Plan
- Feature flag strategy
- Phased rollout approach
- Monitoring metrics
- Rollback plan

## 9. Approval Checklist
- [ ] Product owner has approved the feature implementation
- [ ] Design has been reviewed and approved
- [ ] Technical architecture has been reviewed
- [ ] Security considerations have been addressed
- [ ] Performance impact has been assessed
