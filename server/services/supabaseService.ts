import { createClient } from '@supabase/supabase-js';
import { formatISO } from 'date-fns';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Anon Key must be provided in .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export interface Policy {
  id: string;
  customer_id: string;
  type: 'Health' | 'Life' | 'Motor' | 'Travel' | 'Pension';
  insurer: string;
  status: 'Active' | 'Renewal Due' | 'Lapsed';
  due_date: string | null;
  amount: number;
  coverage: number;
  last_contacted: string;
}


export const db = {
  addCustomer: async (customer: { name: string, phone?: string, email?: string, address?: string }) => {
    const { data, error } = await supabase
      .from('customers')
      .insert([
        { name: customer.name, phone: customer.phone, email: customer.email, address: customer.address },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  addUnassignedPolicy: async (policyData: any) => {
    const { data, error } = await supabase
      .from('policies')
      .insert([
        {
          id: policyData.id,
          policy_number: policyData.policy_number,
          insurer: policyData.insurer,
          type: policyData.type,
          status: 'Lapsed', // Default status for new policies
          start_date: policyData.start_date,
          end_date: policyData.end_date,
          premium_amount: policyData.premium_amount,
          coverage_amount: policyData.coverage_amount,
          last_contacted_date: new Date().toISOString(),
          customer_id: null
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getUnassignedPolicies: async () => {
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .is('customer_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  getAllCustomers: async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, email')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  assignPolicy: async (policyId: string, customerId: string) => {
    const { data, error } = await supabase
      .from('policies')
      .update({ customer_id: customerId }) // FIX: Only update the customer_id
      .eq('id', policyId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  getAllPolicies: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from('policies')
      .select(`
        id, type, insurer, status, end_date, premium_amount, coverage_amount, last_contacted_date,
        customer:customers ( name, phone )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((p: any) => ({
      id: p.id,
      customer: p.customer ? p.customer.name : 'Unassigned',
      phone: p.customer ? p.customer.phone : 'N/A',
      type: p.type,
      insurer: p.insurer,
      status: p.status,
      dueDate: p.end_date ? formatISO(new Date(p.end_date), { representation: 'date' }) : '—',
      amount: p.premium_amount,
      coverage: p.coverage_amount,
      lastContacted: p.last_contacted_date
    }));
  },
  
  updatePolicyStatus: async (id: string, status: Policy['status']): Promise<any | undefined> => {
    const { data, error } = await supabase
      .from('policies')
      .update({ status: status })
      .eq('id', id)
      .select(`*, customer:customers ( name, phone )`)
      .single();

    if (error) throw error;
    if (!data) return undefined;

    const p = data as any;
    return {
        id: p.id,
        customer: p.customer ? p.customer.name : 'Unassigned',
        phone: p.customer ? p.customer.phone : 'N/A',
        type: p.type,
        insurer: p.insurer,
        status: p.status,
        dueDate: p.end_date ? formatISO(new Date(p.end_date), { representation: 'date' }) : '—',
        amount: p.premium_amount,
        coverage: p.coverage_amount,
        lastContacted: p.last_contacted_date
    };
  },

  // START: Added missing functions
  findPolicyById: async (id: string): Promise<any | null> => {
    const { data, error } = await supabase
      .from('policies')
      .select(`
        *,
        customer:customers ( name, phone )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Code for no rows found
        return null;
      }
      throw error;
    }
    return data;
  },

  findCustomerByName: async (name: string): Promise<any | null> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('name', name)
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  },
  
  findCustomersBySegment: async (segment: string): Promise<any[]> => {
    // This is a placeholder for more complex segmenting logic.
    // For now, it will just return a few customers for demonstration.
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone')
      .limit(5);

    if (error) throw error;
    return data;
  },
  // END: Added missing functions
};