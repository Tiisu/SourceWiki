import { useState, useEffect, useMemo } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  getSubmissions,
  Submission,
  COUNTRIES,
  getCategoryIcon,
  getCategoryColor,
  getCountryFlag,
  getCountryName,
  getReliabilityColor,
} from '../lib/mock-data';
import { Search, Filter, ExternalLink, Calendar, Globe, BookOpen } from 'lucide-react';

interface PublicDirectoryProps {
  onNavigate: (page: string) => void;
}

export const PublicDirectory: React.FC<PublicDirectoryProps> = ({ onNavigate }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterReliability, setFilterReliability] = useState<string>('all');
  const [filterMediaType, setFilterMediaType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = () => {
    const allSubmissions = getSubmissions();
    // Only show verified sources in public directory
    const verified = allSubmissions.filter((s) => s.status === 'verified');
    setSubmissions(verified);
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

    // Reliability filter
    if (filterReliability !== 'all') {
      filtered = filtered.filter((s) => s.reliability === filterReliability);
    }

    // Media type filter
    if (filterMediaType !== 'all') {
      filtered = filtered.filter((s) => s.mediaType === filterMediaType);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return (b.verifiedDate || '').localeCompare(a.verifiedDate || '');
        case 'date-asc':
          return (a.verifiedDate || '').localeCompare(b.verifiedDate || '');
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
    filterReliability,
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
            <div className="text-2xl">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Credible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">{stats.credible}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-blue-600">{stats.countries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Primary Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-purple-600">{stats.primary}</div>
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
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Select value={filterCountry} onValueChange={setFilterCountry}>
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

            <Select value={filterCategory} onValueChange={setFilterCategory}>
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

            <Select value={filterReliability} onValueChange={setFilterReliability}>
              <SelectTrigger>
                <SelectValue placeholder="All Reliability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reliability</SelectItem>
                <SelectItem value="credible">✅ Credible</SelectItem>
                <SelectItem value="unreliable">❌ Unreliable</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterMediaType} onValueChange={setFilterMediaType}>
              <SelectTrigger>
                <SelectValue placeholder="All Media Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Media Types</SelectItem>
                <SelectItem value="url">🔗 URL</SelectItem>
                <SelectItem value="pdf">📄 PDF</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
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
              Showing {filteredAndSortedSubmissions.length} of {submissions.length} sources
            </div>
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                Table
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filteredAndSortedSubmissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg mb-2">No sources found</p>
            <p className="text-gray-500">Try adjusting your search or filters</p>
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
                    {submission.reliability === 'credible' ? '✅' : '❌'}
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
                    {submission.mediaType === 'pdf' ? '📄' : '🔗'}
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
                  <span>Verified {submission.verifiedDate}</span>
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
                    <TableHead>Reliability</TableHead>
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
                          className={getReliabilityColor(submission.reliability)}
                        >
                          {submission.reliability === 'credible' ? '✅ Credible' : '❌ Unreliable'}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {submission.verifiedDate}
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
