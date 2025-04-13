
export interface Database {
  public: {
    Tables: {
      leases: {
        Row: {
          id: string;
          status: 'active' | 'pending' | 'completed' | 'cancelled';
          // Add other columns
        };
        Insert: {
          // Define insert types
        };
        Update: {
          // Define update types  
        };
      };
      unified_payments: {
        Row: {
          id: string;
          lease_id: string;
          status: 'pending' | 'completed' | 'failed';
          // Add other columns
        };
      };
      // Add other tables
    };
  };
}

export type DbTables = Database['public']['Tables'];
