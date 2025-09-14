import { subDays, formatISO } from 'date-fns';

export interface Policy {
  id: string; customer: string; type: 'Health' | 'Life' | 'Motor' | 'Travel' | 'Pension'; insurer: string; 
  status: 'Active' | 'Renewal Due' | 'Lapsed'; dueDate: string; amount: number; phone: string;
  lastContacted: string; // ISO Date string
}

const now = new Date();
const policies: Policy[] = [
    { id: "PL-1001", customer: "Ravi Kumar", type: "Health", insurer: "HDFC ERGO", status: "Active", dueDate: "—", amount: 14500, phone: "+919876543210", lastContacted: formatISO(subDays(now, 45)) },
    { id: "PL-1002", customer: "Anita Sharma", type: "Life", insurer: "LIC", status: "Renewal Due", dueDate: formatISO(subDays(now, -25)), amount: 22000, phone: "+919876543211", lastContacted: formatISO(subDays(now, 10)) },
    { id: "PL-1003", customer: "Sanjay Patel", type: "Motor", insurer: "ICICI Lombard", status: "Lapsed", dueDate: formatISO(subDays(now, 40)), amount: 7800, phone: "+919876543212", lastContacted: formatISO(subDays(now, 90)) },
    { id: "PL-1004", customer: "Pooja Verma", type: "Health", insurer: "Star Health", status: "Renewal Due", dueDate: formatISO(subDays(now, -5)), amount: 16800, phone: "+919876543213", lastContacted: formatISO(subDays(now, 200)) },
    { id: "PL-1005", customer: "Arjun Mehta", type: "Travel", insurer: "Tata AIG", status: "Active", dueDate: "—", amount: 5200, phone: "+919876543214", lastContacted: formatISO(subDays(now, 5)) },
];

export const db = {
  getAllPolicies: async (): Promise<Policy[]> => policies,
  findPolicyById: async (id: string): Promise<Policy | undefined> => policies.find(p => p.id === id),
  updatePolicyStatus: async (id: string, status: Policy['status']): Promise<Policy | undefined> => {
    const policy = policies.find(p => p.id === id);
    if (policy) policy.status = status;
    return policy;
  },
  findCustomersBySegment: async (segment: string): Promise<Policy[]> => {
    switch (segment) {
      case 'renewal_due': return policies.filter(p => p.status === 'Renewal Due');
      case 'lapsed': return policies.filter(p => p.status === 'Lapsed');
      default: return policies;
    }
  },
};