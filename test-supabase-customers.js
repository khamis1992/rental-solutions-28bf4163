require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*');

  if (error) {
    console.error('Supabase error:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No customers found in the database.');
  } else {
    console.log('Customers:', data);
  }
}

testCustomers(); 