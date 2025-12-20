import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Calendar, User, CheckCircle, XCircle, Clock, Globe, MapPin, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { COUNTRIES, getCountryName, getCountryFlag, getSubmissions, getCategoryIcon, getReliabilityColor, getStatusColor } from '../lib/mock-data';
import { fetchWikidataCountryMetadata, WikidataCountryMetadata } from '../lib/wikidata-service';
import { submissionApi } from '../lib/api';

interface CountryPageProps {}

export const CountryPage: React.FC<CountryPageProps> = () => {
  const { countryCode } = useParams<{ countryCode: string }>();
  const [countrySubmissions, setCountrySubmissions] = useState<any[]>([]);
  const [countryMetadata, setCountryMetadata] = useState<WikidataCountryMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [metadataLoading, setMetadataLoading] = useState(true);

  const country = COUNTRIES.find(c => c.code === countryCode);
  const countryName = country ? country.name : 'Unknown Country';
  const countryFlag = country ? country.flag : '🌍';

  useEffect(() => {
    const loadCountryData = async () => {
      if (!countryCode) return;
      
      setLoading(true);
      setMetadataLoading(true);
      
      try {
        // Try to fetch from backend API first, fallback to local storage
        try {
          const response = await submissionApi.getAll({ country: countryCode });
          if (response.submissions) {
            setCountrySubmissions(response.submissions);
          } else {
            // Fallback to local storage
            const allSubmissions = getSubmissions();
            const filtered = allSubmissions.filter(sub => sub.country === countryCode);
            setCountrySubmissions(filtered);
          }
        } catch (apiError) {
          console.log('API not available, using local data');
          const allSubmissions = getSubmissions();
          const filtered = allSubmissions.filter(sub => sub.country === countryCode);
          setCountrySubmissions(filtered);
        }
        
        // Fetch Wikidata metadata
        const metadata = await fetchWikidataCountryMetadata(countryCode, countryName);
        setCountryMetadata(metadata);
      } catch (error) {
        console.error('Error loading country data:', error);
      } finally {
        setLoading(false);
        setMetadataLoading(false);
      }
    };

    loadCountryData();
  }, [countryCode, countryName]);

  if (!country) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Country Not Found</h1>
            <p className="text-gray-600 mb-4">The requested country could not be found.</p>
            <Link to="/directory">
              <Button>Back to Directory</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filter submissions by status
  const verifiedSources = countrySubmissions.filter(sub => 
    (sub.status === 'verified' || sub.status === 'approved') && 
    (sub.reliability === 'credible' || sub.credibility === 'credible')
  );
  const pendingSources = countrySubmissions.filter(sub => sub.status === 'pending');
  const unreliableSources = countrySubmissions.filter(sub => 
    sub.reliability === 'unreliable' || sub.credibility === 'unreliable' || sub.status === 'rejected'
  );

  if (loading || metadataLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="flex items-center space-x-4 mb-8">
              <div className="h-16 w-16 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4 mb-4">
            <Link to="/directory">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Directory</span>
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-6xl">{countryFlag}</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {countryMetadata?.officialName || countryName}
              </h1>
              {countryMetadata?.description && (
                <p className="text-gray-600 mt-1">{countryMetadata.description}</p>
              )}
              <p className="text-lg text-gray-600">Reference Directory and Citations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Country Metadata */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Capital</div>
                <div className="font-medium">{countryMetadata?.capital || 'N/A'}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Region</div>
                <div className="font-medium">{countryMetadata?.region || 'N/A'}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Population</div>
                <div className="font-medium">{countryMetadata?.population || 'N/A'}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ExternalLink className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Sources</div>
                <div className="font-medium">{countrySubmissions.length} total</div>
              </div>
            </div>
          </div>
          
          {/* Wikipedia/Wikidata Links */}
          <div className="mt-4 flex items-center space-x-4">
            <a
              href={countryMetadata?.wikipediaUrl || `https://en.wikipedia.org/wiki/${countryName.replace(/ /g, '_')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
            >
              <span>📖</span>
              <span>Wikipedia Article</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href={countryMetadata?.wikidataUrl || 'https://www.wikidata.org/'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
            >
              <span>🗃️</span>
              <span>Wikidata</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{verifiedSources.length}</div>
                  <div className="text-sm text-gray-600">Verified Sources</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{pendingSources.length}</div>
                  <div className="text-sm text-gray-600">Pending Review</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{unreliableSources.length}</div>
                  <div className="text-sm text-gray-600">Unreliable Sources</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{countrySubmissions.length}</div>
                  <div className="text-sm text-gray-600">Total Submissions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reference List */}
        <Tabs defaultValue="verified" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="verified">
              Verified Sources ({verifiedSources.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending Review ({pendingSources.length})
            </TabsTrigger>
            <TabsTrigger value="unreliable">
              Unreliable Sources ({unreliableSources.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verified" className="space-y-4">
            {verifiedSources.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No verified sources yet</h3>
                  <p className="text-gray-600">Sources for {countryName} are being reviewed.</p>
                </CardContent>
              </Card>
            ) : (
              verifiedSources.map((submission) => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 flex items-center space-x-2">
                          <span>{getCategoryIcon(submission.category)}</span>
                          <span>{submission.title}</span>
                        </CardTitle>
                        <CardDescription className="space-y-1">
                          <div><strong>Publisher:</strong> {submission.publisher}</div>
                          <div><strong>Submitted:</strong> {submission.submittedDate}</div>
                          {submission.verifiedDate && (
                            <div><strong>Verified:</strong> {submission.verifiedDate}</div>
                          )}
                          {submission.wikipediaArticle && (
                            <a
                              href={submission.wikipediaArticle}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                            >
                              <span>📖 Wikipedia Article</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status}
                        </Badge>
                        <Badge className={getReliabilityColor(submission.reliability)}>
                          {submission.reliability}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>By {submission.submitterName}</span>
                        <Badge variant="outline">{submission.category}</Badge>
                      </div>
                      <a
                        href={submission.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <span>View Source</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    {submission.verifierNotes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <div className="text-sm text-gray-700">
                          <strong>Verifier Notes:</strong> {submission.verifierNotes}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingSources.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending sources</h3>
                  <p className="text-gray-600">All sources for {countryName} have been reviewed.</p>
                </CardContent>
              </Card>
            ) : (
              pendingSources.map((submission) => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 flex items-center space-x-2">
                          <span>{getCategoryIcon(submission.category)}</span>
                          <span>{submission.title}</span>
                        </CardTitle>
                        <CardDescription className="space-y-1">
                          <div><strong>Publisher:</strong> {submission.publisher}</div>
                          <div><strong>Submitted:</strong> {submission.submittedDate}</div>
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>By {submission.submitterName}</span>
                        <Badge variant="outline">{submission.category}</Badge>
                      </div>
                      <a
                        href={submission.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <span>View Source</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="unreliable" className="space-y-4">
            {unreliableSources.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No unreliable sources</h3>
                  <p className="text-gray-600">All sources for {countryName} are deemed reliable.</p>
                </CardContent>
              </Card>
            ) : (
              unreliableSources.map((submission) => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow border-red-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 flex items-center space-x-2">
                          <span>{getCategoryIcon(submission.category)}</span>
                          <span>{submission.title}</span>
                        </CardTitle>
                        <CardDescription className="space-y-1">
                          <div><strong>Publisher:</strong> {submission.publisher}</div>
                          <div><strong>Submitted:</strong> {submission.submittedDate}</div>
                        </CardDescription>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status}
                        </Badge>
                        <Badge className={getReliabilityColor(submission.reliability)}>
                          {submission.reliability}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>By {submission.submitterName}</span>
                        <Badge variant="outline">{submission.category}</Badge>
                      </div>
                      <a
                        href={submission.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <span>View Source</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    {submission.verifierNotes && (
                      <div className="mt-3 p-3 bg-red-50 rounded-md border border-red-200">
                        <div className="text-sm text-red-700">
                          <strong>Verifier Notes:</strong> {submission.verifierNotes}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
