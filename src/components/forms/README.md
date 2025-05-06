# Form Validation System

This module provides standardized form validation using React Hook Form and Zod schema validation.

## Components

### FormProvider

A wrapper around React Hook Form that provides consistent error handling and submission behavior.

### FormBuilder

A higher-level component that initializes a form with Zod schema validation, making it easy to create validated forms.

## Utilities

### useFormValidation

A custom hook for manual form validation against a Zod schema.

### validation-utils

Server-side validation utilities including `validateData` for schema validation and `withValidation` for creating API handlers with built-in validation.

## How to Use

### 1. Define a Zod Schema

```typescript
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  age: z.number().int().min(18, "Must be at least 18 years old")
});

type UserFormData = z.infer<typeof userSchema>;
```

### 2. Create a Form Using FormBuilder

```tsx
// Default values matching your schema type
const defaultValues: Partial<UserFormData> = {
  name: '',
  email: '',
  age: 18
};

export function UserForm() {
  // Form submission handler
  const handleSubmit = async (data: UserFormData) => {
    // Process form data
    await saveUser(data);
  };

  return (
    <FormBuilder
      schema={userSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <FormField
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Other form fields */}
      
      <Button type="submit">Submit</Button>
    </FormBuilder>
  );
}
```

### 3. Server-Side Validation

```typescript
// API endpoint or service function
async function createUser(userData: unknown) {
  const validationResult = validateData(userSchema, userData);
  
  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }
  
  // Process validated data
  const user = await db.users.create(validationResult.data);
  return { success: true, data: user };
}

// Or using the withValidation helper
const createUserHandler = withValidation(userSchema, async (validData) => {
  const user = await db.users.create(validData);
  return user;
});
```

## Best Practices

1. Define all validation schemas in dedicated files
2. Use consistent error messages across the application
3. Share schemas between client and server validation
4. Use TypeScript's type inference with Zod for type safety
5. Add aria-* attributes for accessibility
