// src/lib/types.ts

export interface Transaction {
  id: number;
  user_id: number;
  username?: string; // Optional: to display who made a public transaction
  description: string;
  category: string;
  amount: number;
  date: string; // Should be in YYYY-MM-DD format
  is_public: boolean;
  created_at: string;
  updated_at: string;
  is_owner?: boolean; // Added to easily identify ownership on the frontend
}

// We might add more types here later, e.g., for API responses or form inputs
