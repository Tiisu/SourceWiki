import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Calendar, CalendarDays, Download, Filter, X } from 'lucide-react';
import { adminApi } from '../lib/api';
import { toast } from 'sonner';

interface ExportFilters {
  format: 'csv' | 'json';
  status: string;
  category: string;
  country: string;
  submitter: string;
  verifier: string;
  createdFrom: string;
  createdTo: string;
  verifiedFrom: string;
  verifiedTo: string;
  search: string;
}

interface ExportFilterOptions {
  countries: string[];
  submitters: Array<{ id: string; username: string; email: string }>;
  verifiers: Array<{ id: string; username: string; email: string }>;
  statusOptions: string[];
  categoryOptions: string[];
  formatOptions: string[];
}

interface ExportDialogProps {
  onExportComplete?: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ onExportComplete }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState<ExportFilterOptions | null>(null);
  const [filters, setFilters] = useState<ExportFilters>({
    format: 'csv',
    status: 'all',
    category: 'all',
    country: 'all',
    submitter: '',
    verifier: '',
    createdFrom: '',
    createdTo: '',
    verifiedFrom: '',
    verifiedTo: '',
    search: ''
  });

  useEffect(() => {
    if (open) {
      loadFilterOptions();
    }
  }, [open]);

  const loadFilterOptions = async () => {
    try {
      const response = await adminApi.getExportFilters();
      setFilterOptions(response);
    } catch (error) {
      console.error('Failed to load filter options:', error);
      toast.error('Failed to load filter options');
    }
  };

  const handleFilterChange = (key: keyof ExportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      format: 'csv',
      status: 'all',
      category: 'all',
      country: 'all',
      submitter: '',
      verifier: '',
      createdFrom: '',
      createdTo: '',
      verifiedFrom: '',
      verifiedTo: '',
      search: ''
    });
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      // Remove 'all' values from filters for cleaner export
      const exportFilters = { ...filters };
      if (exportFilters.status === 'all') delete (exportFilters as Record<string, any>).status;
      if (exportFilters.category === 'all') delete (exportFilters as Record<string, any>).category;
      if (exportFilters.country === 'all') delete (exportFilters as Record<string, any>).country;

      await adminApi.exportSubmissions(exportFilters);
      toast.success('Export completed successfully');
      setOpen(false);
      onExportComplete?.();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.category !== 'all') count++;
    if (filters.country !== 'all') count++;
    if (filters.submitter) count++;
    if (filters.verifier) count++;
    if (filters.createdFrom) count++;
    if (filters.createdTo) count++;
    if (filters.verifiedFrom) count++;
    if (filters.verifiedTo) count++;
    if (filters.search) count++;
    return count;
  };

  if (!filterOptions) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading export options...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Download className="h-4 w-4 mr-2" />
          Export
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Submissions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select
              value={filters.format}
              onValueChange={(value: string) => handleFilterChange('format', value as 'csv' | 'json')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.formatOptions.map(format => (
                  <SelectItem key={format} value={format}>
                    {format.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value: string) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {filterOptions.statusOptions.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={filters.category}
                onValueChange={(value: string) => handleFilterChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {filterOptions.categoryOptions.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select
                value={filters.country}
                onValueChange={(value: string) => handleFilterChange('country', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {filterOptions.countries.map(country => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search in title, publisher, URL..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* User Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="submitter">Submitter</Label>
              <Select
                value={filters.submitter}
                onValueChange={(value: string) => handleFilterChange('submitter', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All submitters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All submitters</SelectItem>
                  {filterOptions.submitters.map(submitter => (
                    <SelectItem key={submitter.id} value={submitter.id}>
                      {submitter.username} ({submitter.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verifier">Verifier</Label>
              <Select
                value={filters.verifier}
                onValueChange={(value: string) => handleFilterChange('verifier', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All verifiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All verifiers</SelectItem>
                  {filterOptions.verifiers.map(verifier => (
                    <SelectItem key={verifier.id} value={verifier.id}>
                      {verifier.username} ({verifier.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Created Date Range</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="From"
                  value={filters.createdFrom}
                  onChange={(e) => handleFilterChange('createdFrom', e.target.value)}
                />
                <Input
                  type="date"
                  placeholder="To"
                  value={filters.createdTo}
                  onChange={(e) => handleFilterChange('createdTo', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Verified Date Range</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="From"
                  value={filters.verifiedFrom}
                  onChange={(e) => handleFilterChange('verifiedFrom', e.target.value)}
                />
                <Input
                  type="date"
                  placeholder="To"
                  value={filters.verifiedTo}
                  onChange={(e) => handleFilterChange('verifiedTo', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {getActiveFilterCount() > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Active Filters</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.status !== 'all' && (
                  <Badge variant="secondary">
                    Status: {filters.status}
                  </Badge>
                )}
                {filters.category !== 'all' && (
                  <Badge variant="secondary">
                    Category: {filters.category}
                  </Badge>
                )}
                {filters.country !== 'all' && (
                  <Badge variant="secondary">
                    Country: {filters.country}
                  </Badge>
                )}
                {filters.submitter && (
                  <Badge variant="secondary">
                    Submitter: {filterOptions.submitters.find(s => s.id === filters.submitter)?.username}
                  </Badge>
                )}
                {filters.verifier && (
                  <Badge variant="secondary">
                    Verifier: {filterOptions.verifiers.find(v => v.id === filters.verifier)?.username}
                  </Badge>
                )}
                {filters.search && (
                  <Badge variant="secondary">
                    Search: "{filters.search}"
                  </Badge>
                )}
                {filters.createdFrom && (
                  <Badge variant="secondary">
                    Created from: {filters.createdFrom}
                  </Badge>
                )}
                {filters.createdTo && (
                  <Badge variant="secondary">
                    Created to: {filters.createdTo}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={loading}
              className="min-w-32"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {filters.format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
