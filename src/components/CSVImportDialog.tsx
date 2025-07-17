"use client";

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";

interface CSVImportDialogProps {
  onImportSuccess: () => void;
}

interface ImportResult {
  message: string;
  imported?: number;
  total?: number;
  errors?: string[];
}

const CSVImportDialog: React.FC<CSVImportDialogProps> = ({ onImportSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
        setResult(null);
      } else {
        setError('Please select a CSV file');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        onImportSuccess();
      } else {
        setError(data.message || 'Import failed');
        if (data.errors) {
          setResult({ message: data.message, errors: data.errors });
        }
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Import error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFile(null);
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    } else {
      setIsOpen(open);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Transactions from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with your transactions. The file should have columns: description, category, amount, date, is_public.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={isUploading}
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>{result.message}</span>
              </div>
              
              {result.imported !== undefined && result.total !== undefined && (
                <div className="text-sm text-muted-foreground">
                  Imported {result.imported} out of {result.total} transactions
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-destructive">Errors:</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {result.errors.map((err, index) => (
                      <div key={index} className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                        {err}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <div><strong>Expected CSV format:</strong></div>
            <div>description,category,amount,date,is_public</div>
            <div><strong>Date format:</strong> YYYY-MM-DD</div>
            <div><strong>Amount:</strong> Positive for income, negative for expenses</div>
            <div><strong>is_public:</strong> true/false</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
          >
            {isUploading ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CSVImportDialog;