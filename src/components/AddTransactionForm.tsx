"use client";

import React, { useState, useEffect } from 'react';
import { Transaction } from '@/lib/types';
import { parseLocalDate } from '@/lib/utils';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';

interface AddTransactionFormProps {
  onTransactionSaved: (transaction: Transaction) => void;
  userId: number;
  transactionToEdit?: Transaction | null;
  categories: string[];
}

const AddTransactionForm: React.FC<AddTransactionFormProps> = ({
  onTransactionSaved,
  userId,
  transactionToEdit,
  categories
}) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isPublic, setIsPublic] = useState(true); // Default to true for new transactions
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allCategoryOptions = React.useMemo(() => {
    return categories.sort();
  }, [categories]);

  // When form loads or transaction to edit changes
  useEffect(() => {
    if (transactionToEdit) {
      // Start with the raw category from the transaction
      let categoryToSet = transactionToEdit.category.trim();

      // Try to find a matching predefined category (case insensitive)
      const canonicalCategory = categories.find(
        pc => pc.toLowerCase() === categoryToSet.toLowerCase()
      );

      // Use the canonical version if found, otherwise use the trimmed original
      if (canonicalCategory) {
        categoryToSet = canonicalCategory;
      }

      console.log('Setting category for edit:', categoryToSet);

      // Set all form fields from the transaction being edited
      setDescription(transactionToEdit.description);
      setAmount(transactionToEdit.amount.toString());
      setDate(parseLocalDate(transactionToEdit.date));
      setIsPublic(Boolean(transactionToEdit.is_public));

      // Set category last to ensure it's correctly set after other state updates
      setTimeout(() => {
        setCategory(categoryToSet);
      }, 0);
    } else {
      // Reset all form fields for a new transaction
      setDescription('');
      setAmount('');
      setDate(new Date());
      setIsPublic(true); // Keep new transactions as public by default
      setCategory(''); // Reset category last
    }
  }, [transactionToEdit, categories]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!date) {
      setError("Date is required.");
      setIsSubmitting(false);
      return;
    }
    if (!description || !category || !amount) {
      setError("All fields except 'Public' are required.");
      setIsSubmitting(false);
      return;
    }

    const transactionData = {
      description,
      category,
      amount: parseFloat(amount),
      date: format(date, 'yyyy-MM-dd'),
      is_public: isPublic,
      user_id: userId,
    };

    try {
      const url = transactionToEdit
        ? `/api/transactions/${transactionToEdit.id}`
        : '/api/transactions';
      const method = transactionToEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${transactionToEdit ? 'update' : 'add'} transaction`);
      }

      const savedTransaction: Transaction = await response.json();
      onTransactionSaved(savedTransaction);

      if (!transactionToEdit) {
        setDescription('');
        setCategory('');
        setAmount('');
        setDate(new Date());
        setIsPublic(false);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'An unexpected error occurred.');
      } else {
        setError('An unexpected error occurred.');
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Groceries, Salary"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        {/* Using shadcn's Select component with proper key to force re-render when category changes */}
        <Select
          key={`category-select-${category}`} // Key forces re-render when category changes
          onValueChange={setCategory}
          defaultValue={category}
          required
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {allCategoryOptions.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g., -25.99 or 1200"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <DatePicker date={date} setDate={setDate} />
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="isPublic"
          checked={isPublic}
          onCheckedChange={(checkedState) => setIsPublic(Boolean(checkedState))}
        />
        <Label htmlFor="isPublic" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Public Transaction (visible to other users)
        </Label>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving...' : transactionToEdit ? 'Update Transaction' : 'Add Transaction'}
      </Button>
    </form>
  );
};

export default AddTransactionForm;
