import React, { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  AgreementSchema, 
  AgreementFormData, 
  defaultValues 
} from '@/lib/validation-schemas/agreement';

interface AgreementSubmitHandlerProps {
  children: (props: {
    form: ReturnType<typeof useForm<AgreementFormData>>;
    methods: ReturnType<typeof useForm<AgreementFormData>>;
  }) => ReactNode;
}

const AgreementSubmitHandler: React.FC<AgreementSubmitHandlerProps> = ({ children }) => {
  // Fix type parameter usage
  const form = useForm<AgreementFormData>({
    resolver: zodResolver(AgreementSchema),
    defaultValues: defaultValues,
    mode: "onChange"
  });

  const methods = useForm<AgreementFormData>({
    resolver: zodResolver(AgreementSchema),
    defaultValues: defaultValues,
    mode: "onChange"
  });

  return children({ form, methods });
};

export default AgreementSubmitHandler;
