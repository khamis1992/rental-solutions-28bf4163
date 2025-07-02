
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  agreementSchema,
  Agreement
} from '@/lib/validation-schemas/agreement';

interface AgreementSubmitHandlerProps {
  children: (props: {
    form: ReturnType<typeof useForm<Agreement>>;
    methods: ReturnType<typeof useForm<Agreement>>;
  }) => React.ReactNode;
}

const AgreementSubmitHandler: React.FC<AgreementSubmitHandlerProps> = ({ children }) => {
  const form = useForm<Agreement>({
    resolver: zodResolver(agreementSchema),
    defaultValues: {
    status: 'active',
    },
    mode: "onChange"
  });

  const methods = useForm<Agreement>({
    resolver: zodResolver(agreementSchema),
    defaultValues: {
      status: 'active',
    },
    mode: "onChange"
  });

  return children({ form, methods });
};

export default AgreementSubmitHandler;
