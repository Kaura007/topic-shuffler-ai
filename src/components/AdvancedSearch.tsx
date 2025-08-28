import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Filter, X, Tag, Calendar, Building, User, FileText } from 'lucide-react';

interface Department {
  id: string;
  name: string;
}

interface SearchFilters {
  query: string;
  year: string;
  department: string;
  tags: string[];
  author: string;
}

interface AdvancedSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  departments: Department[];
  availableYears: number[];
  availableTags: string[];
  availableAuthors: string[];
  isLoading?: boolean;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  filters,
  onFiltersChange,
  departments,
  availableYears,
  availableTags,
  availableAuthors,
  isLoading = false
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  useEffect(() => {
    if (tagInput.length > 0) {
      const suggestions = availableTags
        .filter(tag => 
          tag.toLowerCase().includes(tagInput.toLowerCase()) &&
          !filters.tags.includes(tag)
        )
        .slice(0, 5);
      setSuggestedTags(suggestions);
    } else {
      setSuggestedTags([]);
    }
  }, [tagInput, availableTags, filters.tags]);

  const handleAddTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      onFiltersChange({
        ...filters,
        tags: [...filters.tags, tag]
      });
    }
    setTagInput('');
    setSuggestedTags([]);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onFiltersChange({
      ...filters,
      tags: filters.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      query: '',
      year: 'all',
      department: 'all',
      tags: [],
      author: 'all'
    });
    setTagInput('');
  };

  const hasActiveFilters = filters.query || filters.year !== 'all' || filters.department !== 'all' || filters.tags.length > 0 || filters.author !== 'all';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            <Dialog open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Advanced
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Advanced Search Options</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Author Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Author
                    </label>
                    <Select value={filters.author} onValueChange={(value) => onFiltersChange({ ...filters, author: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All authors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All authors</SelectItem>
                        {availableAuthors.map((author) => (
                          <SelectItem key={author} value={author}>
                            {author}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tags Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          placeholder="Type to search tags..."
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && tagInput.trim()) {
                              e.preventDefault();
                              handleAddTag(tagInput.trim());
                            }
                          }}
                        />
                        {suggestedTags.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-10 bg-background border border-border rounded-md mt-1 max-h-32 overflow-y-auto">
                            {suggestedTags.map((tag) => (
                              <button
                                key={tag}
                                className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                                onClick={() => handleAddTag(tag)}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {filters.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {filters.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                              {tag}
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Popular Tags */}
                  {availableTags.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Popular Tags</label>
                      <div className="flex flex-wrap gap-1">
                        {availableTags.slice(0, 10).map((tag) => (
                          <Button
                            key={tag}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddTag(tag)}
                            disabled={filters.tags.includes(tag)}
                            className="h-7 text-xs"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Search in titles, abstracts, and content
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter keywords to search..."
                value={filters.query}
                onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
                className="pl-9"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Year
              </label>
              <Select value={filters.year} onValueChange={(value) => onFiltersChange({ ...filters, year: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building className="h-4 w-4" />
                Department
              </label>
              <Select value={filters.department} onValueChange={(value) => onFiltersChange({ ...filters, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {filters.query && (
                <Badge variant="outline">
                  Search: "{filters.query}"
                </Badge>
              )}
              {filters.year !== 'all' && (
                <Badge variant="outline">
                  Year: {filters.year}
                </Badge>
              )}
              {filters.department !== 'all' && (
                <Badge variant="outline">
                  Department: {filters.department}
                </Badge>
              )}
              {filters.author !== 'all' && (
                <Badge variant="outline">
                  Author: {filters.author}
                </Badge>
              )}
              {filters.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedSearch;