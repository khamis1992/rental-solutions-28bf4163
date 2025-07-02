
// @ts-nocheck
/* eslint-disable */

import { useIsMobile } from '@/hooks/use-mobile';

import { Textarea } from '@/components/ui/textarea';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ResponsiveFormProps {
  children: React.ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
  dir?: 'ltr' | 'rtl';
}

export const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  children,
  className,
  onSubmit,
  dir = 'rtl'
}) => {
  const isMobile = useIsMobile();

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'w-full',
        isMobile ? 'space-y-4' : 'space-y-6',
        className
      )}
      dir={dir}
    >
      {children}
    </form>
  );
};

interface ResponsiveFormGroupProps {
  children: React.ReactNode;
  className?: string;
  columns?: 'auto' | 1 | 2 | 3;
  label?: string;
  required?: boolean;
  error?: string;
  description?: string;
}

export const ResponsiveFormGroup: React.FC<ResponsiveFormGroupProps> = ({
  children,
  className,
  columns = 'auto',
  label,
  required,
  error,
  description
}) => {
  const isMobile = useIsMobile();

  const getGridCols = () => {
    if (isMobile) return 'grid-cols-1';
    if (columns === 'auto') return 'grid-cols-1 md:grid-cols-2';
    return `grid-cols-1 md:grid-cols-${columns}`;
  };

  const content = (
    <div className={cn(
      'w-full',
      typeof columns === 'number' && columns > 1 && !isMobile ? 'grid gap-4' : 'space-y-2',
      typeof columns === 'number' && columns > 1 && !isMobile && getGridCols(),
      className
    )}>
      {children}
    </div>
  );

  if (label) {
    return (
      <div className="space-y-2">
        <Label className={cn(
          'text-sm font-medium text-right',
          required && "after:content-['*'] after:text-red-500 after:ml-1"
        )}>
          {label}
        </Label>
        {description && (
          <p className="text-xs text-gray-500 text-right">{description}</p>
        )}
        {content}
        {error && (
          <p className="text-xs text-red-500 text-right">{error}</p>
        )}
      </div>
    );
  }

  return content;
};

interface ResponsiveInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  description?: string;
  fullWidth?: boolean;
}

export const ResponsiveInput: React.FC<ResponsiveInputProps> = ({
  label,
  error,
  required,
  description,
  fullWidth = true,
  className,
  ...props
}) => {
  const isMobile = useIsMobile();

  const input = (
    <Input
      {...props}
      className={cn(
        'touch-friendly',
        isMobile && 'text-base', // Prevents zoom on iOS
        fullWidth && 'w-full',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
        className
      )}
      style={{
        fontSize: isMobile ? '16px' : undefined, // Prevents iOS zoom
      }}
    />
  );

  if (label) {
    return (
      <ResponsiveFormGroup
        label={label}
        required={required}
        error={error}
        description={description}
      >
        {input}
      </ResponsiveFormGroup>
    );
  }

  return input;
};

interface ResponsiveTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
  description?: string;
  fullWidth?: boolean;
  minRows?: number;
}

export const ResponsiveTextarea: React.FC<ResponsiveTextareaProps> = ({
  label,
  error,
  required,
  description,
  fullWidth = true,
  minRows = 3,
  className,
  ...props
}) => {
  const isMobile = useIsMobile();

  const textarea = (
    <Textarea
      {...props}
      rows={minRows}
      className={cn(
        'touch-friendly resize-vertical',
        isMobile && 'text-base', // Prevents zoom on iOS
        fullWidth && 'w-full',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
        className
      )}
      style={{
        fontSize: isMobile ? '16px' : undefined, // Prevents iOS zoom
        minHeight: `${minRows * 1.5}rem`,
      }}
    />
  );

  if (label) {
    return (
      <ResponsiveFormGroup
        label={label}
        required={required}
        error={error}
        description={description}
      >
        {textarea}
      </ResponsiveFormGroup>
    );
  }

  return textarea;
};

interface ResponsiveSelectProps {
  label?: string;
  error?: string;
  required?: boolean;
  description?: string;
  fullWidth?: boolean;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveSelect: React.FC<ResponsiveSelectProps> = ({
  label,
  error,
  required,
  description,
  fullWidth = true,
  placeholder,
  value,
  onValueChange,
  children,
  className
}) => {
  const isMobile = useIsMobile();

  const select = (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger 
        className={cn(
          'touch-friendly',
          isMobile && 'text-base h-12', // Better touch target and prevents zoom
          fullWidth && 'w-full',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {children}
      </SelectContent>
    </Select>
  );

  if (label) {
    return (
      <ResponsiveFormGroup
        label={label}
        required={required}
        error={error}
        description={description}
      >
        {select}
      </ResponsiveFormGroup>
    );
  }

  return select;
};

interface ResponsiveButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  alignment?: 'left' | 'center' | 'right' | 'between';
  direction?: 'horizontal' | 'vertical' | 'responsive';
  fullWidthOnMobile?: boolean;
}

export const ResponsiveButtonGroup: React.FC<ResponsiveButtonGroupProps> = ({
  children,
  className,
  alignment = 'right',
  direction = 'responsive',
  fullWidthOnMobile = true
}) => {
  const isMobile = useIsMobile();

  const getFlexDirection = () => {
    if (direction === 'vertical') return 'flex-col';
    if (direction === 'responsive') return 'flex-col md:flex-row';
    return 'flex-row';
  };

  const getJustification = () => {
    switch (alignment) {
      case 'left': return 'justify-start';
      case 'center': return 'justify-center';
      case 'between': return 'justify-between';
      default: return 'justify-end';
    }
  };

  return (
    <div className={cn(
      'flex gap-3',
      getFlexDirection(),
      !isMobile && getJustification(),
      isMobile && fullWidthOnMobile && 'flex-col',
      className
    )}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === Button) {
          return React.cloneElement(child, {
            className: cn(
              child.props.className,
              isMobile && fullWidthOnMobile && 'w-full touch-friendly',
              !isMobile && 'min-w-[100px]'
            )
          });
        }
        return child;
      })}
    </div>
  );
};

interface ResponsiveFieldsetProps {
  children: React.ReactNode;
  legend?: string;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export const ResponsiveFieldset: React.FC<ResponsiveFieldsetProps> = ({
  children,
  legend,
  className,
  collapsible = false,
  defaultOpen = true
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const isMobile = useIsMobile();

  return (
    <fieldset className={cn('border border-gray-200 rounded-lg p-4 md:p-6', className)}>
      {legend && (
        <legend 
          className={cn(
            'px-2 text-sm font-medium text-gray-700 cursor-pointer',
            collapsible && 'hover:text-gray-900'
          )}
          onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
        >
          <div className="flex items-center gap-2">
            {legend}
            {collapsible && (
              <svg 
                className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </legend>
      )}
      
      {(!collapsible || isOpen) && (
        <div className={cn(isMobile ? 'space-y-4' : 'space-y-6')}>
          {children}
        </div>
      )}
    </fieldset>
  );
}; 