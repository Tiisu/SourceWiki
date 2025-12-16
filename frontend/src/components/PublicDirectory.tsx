import { useState, useEffect, useMemo } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Skeleton } from './ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  COUNTRIES,
  getCategoryIcon,
  getCategoryColor,
  getCountryFlag,
  getCountryName,
  getReliabilityColor,
  getStatusColor,
} from '../lib/mock-data';
import { submissionApi } from '../lib/api';
import { toast } from 'sonner';

interface Submission {
  id: string;
  url: string;
  title: string;
  publisher: string;
  country: string;
  category: string;
  status: string;
  submitter?: any;
  verifier?: any;
  wikipediaArticle?: string;
  verifierNotes?: string;
  verifiedAt?: string;
  reliability?: string;
  fileType?: string;
  fileName?: string;
  createdAt: string;
  updatedAt: string;
}
import { Search, Filter, ExternalLink, Calendar, Globe, BookOpen } from 'lucide-react';
import React from 'react';

interface PublicDirectoryProps {
  onNavigate: (page: string) => void;
}

export const PublicDirectory: React.FC<PublicDirectoryProps> = ({ onNavigate }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('approved');
  const [filterMediaType, setFilterMediaType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadSubmissions();
  }, [filterCountry, filterCategory, filterStatus, searchQuery, page]);

  const loadSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await submissionApi.getAll({
        country: filterCountry !== 'all' ? filterCountry : undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchQuery || undefined,
        page,
        limit: 20,
      });

      if (response.success) {
        setSubmissions(response.submissions || []);
        setTotalPages(response.pages || 1);
      } else {
        setError('Failed to load submissions');
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      setError('Failed to load submissions. Please try again.');
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedSubmissions = useMemo(() => {
    let filtered = [...submissions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.publisher.toLowerCase().includes(query) ||
          s.url.toLowerCase().includes(query)
      );
    }

    // Country filter
    if (filterCountry !== 'all') {
      filtered = filtered.filter((s) => s.country === filterCountry);
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter((s) => s.category === filterCategory);
    }

    // Status filter (already applied in API call, but keep for client-side filtering)
    if (filterStatus !== 'all') {
      filtered = filtered.filter((s) => s.status === filterStatus);
    }

    // Media type filter
    if (filterMediaType !== 'all') {
      filtered = filtered.filter((s) => s.fileType === filterMediaType);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return (b.verifiedAt || b.updatedAt || b.createdAt || '').localeCompare(
            a.verifiedAt || a.updatedAt || a.createdAt || ''
          );
        case 'date-asc':
          return (a.verifiedAt || a.updatedAt || a.createdAt || '').localeCompare(
            b.verifiedAt || b.updatedAt || b.createdAt || ''
          );
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    submissions,
    searchQuery,
    filterCountry,
    filterCategory,
    filterStatus,
    filterMediaType,
    sortBy,
  ]);

  const stats = useMemo(() => {
    const total = filteredAndSortedSubmissions.length;
    const credible = filteredAndSortedSubmissions.filter((s) => s.reliability === 'credible').length;
    const countries = new Set(filteredAndSortedSubmissions.map((s) => s.country)).size;
    const primary = filteredAndSortedSubmissions.filter((s) => s.category === 'primary').length;

    return { total, credible, countries, primary };
  }, [filteredAndSortedSubmissions]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-8 w-1/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="mb-2">Verified Reference Directory</h1>
        <p className="text-gray-600">
          Browse and search community-verified sources for Wikipedia articles
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Total Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl">{stats.total}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Credible</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl text-green-600">{stats.credible}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Countries</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl text-blue-600">{stats.countries}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Primary Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl text-purple-600">{stats.primary}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Search & Filter</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by title, publisher, or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Select value={filterCountry} onValueChange={setFilterCountry} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="primary">📗 Primary</SelectItem>
                <SelectItem value="secondary">📘 Secondary</SelectItem>
                <SelectItem value="unreliable">🚫 Unreliable</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">✅ Approved</SelectItem>
                <SelectItem value="pending">⏳ Pending</SelectItem>
                <SelectItem value="rejected">❌ Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterMediaType} onValueChange={setFilterMediaType} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="All Media Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Media Types</SelectItem>
                <SelectItem value="url">🔗 URL</SelectItem>
                <SelectItem value="pdf">📄 PDF</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="title-asc">Title A-Z</SelectItem>
                <SelectItem value="title-desc">Title Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {loading ? (
                <Skeleton className="h-4 w-48" />
              ) : (
                `Showing ${filteredAndSortedSubmissions.length} of ${submissions.length} sources`
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                disabled={loading}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                disabled={loading}
              >
                Table
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadSubmissions}
                className="mt-2"
                disabled={loading}
              >
                Retry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredAndSortedSubmissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg mb-2">No sources found</p>
            <p className="text-gray-500">
              {error ? 'There was an error loading submissions.' : 'Try adjusting your search or filters'}
            </p>
            {!error && (
              <Button variant="outline" onClick={loadSubmissions} className="mt-4">
                Refresh
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedSubmissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-3xl">{getCategoryIcon(submission.category)}</span>
                  <Badge
                    variant="outline"
                    className={getReliabilityColor(submission.reliability)}
                  >
                    {submission.reliability === 'credible' ? '✅' : submission.reliability === 'unreliable' ? '❌' : '❓'}
                  </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2">{submission.title}</CardTitle>
                <CardDescription>{submission.publisher}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={getCategoryColor(submission.category)}>
                    {submission.category}
                  </Badge>
                  <Badge variant="outline">
                    {getCountryFlag(submission.country)} {submission.country}
                  </Badge>
                  <Badge variant="outline">
                    {submission.fileType === 'pdf' ? '📄' : '🔗'}
                  </Badge>
                  <Badge variant="outline" className={getStatusColor(submission.status)}>
                    {submission.status}
                  </Badge>
                </div>

                <a
                  href={submission.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span className="truncate">View Source</span>
                </a>

                {submission.wikipediaArticle && (
                  <a
                    href={submission.wikipediaArticle}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:underline"
                  >
                    <BookOpen className="h-3 w-3" />
                    <span className="truncate">Wikipedia Article</span>
                  </a>
                )}

                <div className="flex items-center space-x-2 text-xs text-gray-500 pt-2 border-t">
                  <Calendar className="h-3 w-3" />
                  <span>Verified {formatDate(submission.verifiedAt)}</span>
                </div>

                {submission.verifierNotes && (
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    <p className="line-clamp-2">{submission.verifierNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Publisher</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="flex items-center space-x-2">
                            <span>{getCategoryIcon(submission.category)}</span>
                            <span className="truncate">{submission.title}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{submission.publisher}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCountryFlag(submission.country)} {submission.country}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getCategoryColor(submission.category)}>
                          {submission.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(submission.status)}
                        >
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(submission.verifiedAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(submission.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
