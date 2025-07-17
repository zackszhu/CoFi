"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface CategorySelectorProps {
  uniqueCategories: string[];
  selectedCategories: string[];
  onSelectionChange: (categories: string[]) => void;
  className?: string;
}

export function CategorySelector({
  uniqueCategories,
  selectedCategories,
  onSelectionChange,
  className,
}: CategorySelectorProps) {
  // Debug rendering - commented out to prevent re-renders
  // console.log('CategorySelector: rendering', { uniqueCategories, selectedCategories });
  const handleCategorySelect = (category: string) => {
    const newSelection = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    // console.log('CategorySelector: handleCategorySelect', { category, oldSelection: selectedCategories, newSelection });
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    // console.log('CategorySelector: handleSelectAll', { uniqueCategories });
    onSelectionChange(uniqueCategories);
  };

  const handleSelectNone = () => {
    console.log('CategorySelector: handleSelectNone - clearing selections');
    // Explicitly create a new empty array to ensure we're not passing a reference issue
    const emptySelection: string[] = [];
    console.log('Empty selection array:', emptySelection);
    onSelectionChange(emptySelection);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`h-10 ${className}`}>
          Categories
          {selectedCategories.length > 0 && ` (${selectedCategories.length})`}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={selectedCategories.length === uniqueCategories.length}
          onCheckedChange={handleSelectAll}
          onSelect={(e) => e.preventDefault()}
        >
          Select All
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={selectedCategories.length === 0}
          onCheckedChange={handleSelectNone}
          onSelect={(e) => e.preventDefault()}
        >
          Select None
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {uniqueCategories.map((category) => (
          <DropdownMenuCheckboxItem
            key={category}
            checked={selectedCategories.includes(category)}
            onCheckedChange={() => handleCategorySelect(category)}
            onSelect={(e) => e.preventDefault()}
          >
            {category}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
