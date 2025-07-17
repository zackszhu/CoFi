export interface CSVTransaction {
  description: string;
  category: string;
  amount: number;
  date: string;
  is_public: boolean;
}

export interface CSVParseResult {
  success: boolean;
  transactions: CSVTransaction[];
  errors: string[];
}

export function parseCSV(csvContent: string): CSVParseResult {
  const lines = csvContent.trim().split('\n');
  const errors: string[] = [];
  const transactions: CSVTransaction[] = [];

  if (lines.length === 0) {
    return { success: false, transactions: [], errors: ['CSV file is empty'] };
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.trim());
  
  // Validate required headers
  const requiredHeaders = ['description', 'category', 'amount', 'date', 'is_public'];
  const missingHeaders = requiredHeaders.filter(h => !header.includes(h));
  
  if (missingHeaders.length > 0) {
    return {
      success: false,
      transactions: [],
      errors: [`Missing required headers: ${missingHeaders.join(', ')}`]
    };
  }

  // Get column indices
  const getColumnIndex = (columnName: string) => header.indexOf(columnName);
  const descriptionIndex = getColumnIndex('description');
  const categoryIndex = getColumnIndex('category');
  const amountIndex = getColumnIndex('amount');
  const dateIndex = getColumnIndex('date');
  const isPublicIndex = getColumnIndex('is_public');

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = parseCSVLine(line);
    
    if (values.length < requiredHeaders.length) {
      errors.push(`Row ${i + 1}: Insufficient columns`);
      continue;
    }

    try {
      const description = values[descriptionIndex]?.trim();
      const category = values[categoryIndex]?.trim();
      const amountStr = values[amountIndex]?.trim();
      const date = values[dateIndex]?.trim();
      const isPublicStr = values[isPublicIndex]?.trim().toLowerCase();

      // Validate required fields
      if (!description) {
        errors.push(`Row ${i + 1}: Description is required`);
        continue;
      }
      if (!category) {
        errors.push(`Row ${i + 1}: Category is required`);
        continue;
      }
      if (!amountStr) {
        errors.push(`Row ${i + 1}: Amount is required`);
        continue;
      }
      if (!date) {
        errors.push(`Row ${i + 1}: Date is required`);
        continue;
      }

      // Parse and validate amount
      const amount = parseFloat(amountStr);
      if (isNaN(amount)) {
        errors.push(`Row ${i + 1}: Invalid amount "${amountStr}"`);
        continue;
      }

      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        errors.push(`Row ${i + 1}: Invalid date format "${date}". Use YYYY-MM-DD`);
        continue;
      }

      // Parse is_public
      const is_public = isPublicStr === 'true' || isPublicStr === '1';

      transactions.push({
        description,
        category,
        amount,
        date,
        is_public
      });

    } catch (error) {
      errors.push(`Row ${i + 1}: Parse error - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    success: errors.length === 0,
    transactions,
    errors
  };
}

// Helper function to parse a CSV line, handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  result.push(current);
  
  return result;
}