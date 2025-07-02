

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
  dir?: 'ltr' | 'rtl';
  children?: React.ReactNode;
}

const PageHeader = ({
  title,
  subtitle,
  description,
  icon,
  actions,
  className,
  align = 'left',
  dir = 'ltr',
  children,
}: PageHeaderProps) => {
  const alignmentClasses = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
  };

  const flexDirection = dir === 'rtl' ? 'flex-row-reverse' : 'flex-row';

  return (
    <div 
      className={cn(
        "mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4",
        className
      )}
      dir={dir}
    >
      <div className={alignmentClasses[align]}>
        <div className={cn("flex items-center gap-3", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row', dir === 'rtl' ? 'justify-end' : 'justify-start')}>
          {icon}
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        {subtitle && (
          <p className={cn("text-muted-foreground mt-1", alignmentClasses[align])}>{subtitle}</p>
        )}
        {description && (
          <p className={cn("text-muted-foreground mt-1", alignmentClasses[align])}>{description}</p>
        )}
      </div>
      
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
      
      {children}
    </div>
  );
};

export default PageHeader; 