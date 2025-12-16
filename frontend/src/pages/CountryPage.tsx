import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Calendar, User, CheckCircle, XCircle, Clock, Globe, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { COUNTRIES, getCountryName, getCountryFlag, getSubmissions, getCategoryIcon, getReliabilityColor, getStatusColor } from '../lib/mock-data';

interface CountryPageProps {}

export const CountryPage: React.FC<CountryPageProps> = () => {
  const { countryCode } = useParams<{ countryCode: string }>();
  const [countrySubmissions, setCountrySubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const country = COUNTRIES.find(c => c.code === countryCode);
  const countryName = country ? country.name : 'Unknown Country';
  const countryFlag = country ? country.flag : '🌍';

  useEffect(() => {
    const loadCountryData = () => {
      setLoading(true);
      const allSubmissions = getSubmissions();
      const filtered = allSubmissions.filter(sub => sub.country === countryCode);
      setCountrySubmissions(filtered);
      setLoading(false);
    };

    loadCountryData();
  }, [countryCode]);

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
  const verifiedSources = countrySubmissions.filter(sub => sub.status === 'verified' && sub.reliability === 'credible');
  const pendingSources = countrySubmissions.filter(sub => sub.status === 'pending');
  const unreliableSources = countrySubmissions.filter(sub => sub.reliability === 'unreliable');


  // Get country-specific metadata
  const getCountryMetadata = (code: string, name: string) => {
    const metadataMap: { [key: string]: any } = {
      'GH': { population: '31.4 million', capital: 'Accra', languages: 'English', region: 'West Africa' },
      'NG': { population: '223.8 million', capital: 'Abuja', languages: 'English', region: 'West Africa' },
      'KE': { population: '55.1 million', capital: 'Nairobi', languages: 'English, Swahili', region: 'East Africa' },
      'ZA': { population: '60.6 million', capital: 'Pretoria (Executive), Cape Town (Legislative), Bloemfontein (Judicial)', languages: '11 official languages', region: 'Southern Africa' },
      'EG': { population: '112.7 million', capital: 'Cairo', languages: 'Arabic', region: 'North Africa' },
      'ET': { population: '126.5 million', capital: 'Addis Ababa', languages: 'Amharic, English', region: 'East Africa' },
      'MA': { population: '37.8 million', capital: 'Rabat', languages: 'Arabic, Berber', region: 'North Africa' },
      'TN': { population: '12.5 million', capital: 'Tunis', languages: 'Arabic', region: 'North Africa' },
      'UG': { population: '50.3 million', capital: 'Kampala', languages: 'English, Swahili', region: 'East Africa' },
      'TZ': { population: '67.4 million', capital: 'Dodoma (official), Dar es Salaam (largest city)', languages: 'Swahili, English', region: 'East Africa' },
      'RW': { population: '14.1 million', capital: 'Kigali', languages: 'Kinyarwanda, English, French', region: 'East Africa' },
      'MZ': { population: '34.6 million', capital: 'Maputo', languages: 'Portuguese', region: 'Southern Africa' },
      'MG': { population: '31.1 million', capital: 'Antananarivo', languages: 'Malagasy, French, English', region: 'Southern Africa' },
      'US': { population: '339.1 million', capital: 'Washington, D.C.', languages: 'English', region: 'North America' },
      'GB': { population: '67.8 million', capital: 'London', languages: 'English', region: 'Europe' },
      'CA': { population: '40.1 million', capital: 'Ottawa', languages: 'English, French', region: 'North America' },
      'AU': { population: '26.5 million', capital: 'Canberra', languages: 'English', region: 'Oceania' },
      'DE': { population: '84.3 million', capital: 'Berlin', languages: 'German', region: 'Europe' },
      'FR': { population: '65.6 million', capital: 'Paris', languages: 'French', region: 'Europe' },
      'ES': { population: '47.5 million', capital: 'Madrid', languages: 'Spanish', region: 'Europe' },
      'IT': { population: '59.0 million', capital: 'Rome', languages: 'Italian', region: 'Europe' },
      'JP': { population: '125.4 million', capital: 'Tokyo', languages: 'Japanese', region: 'Asia' },
      'IN': { population: '1.42 billion', capital: 'New Delhi', languages: 'Hindi, English, 22 official languages', region: 'Asia' },
      'BR': { population: '216.4 million', capital: 'Brasília', languages: 'Portuguese', region: 'South America' },
      'MX': { population: '128.5 million', capital: 'Mexico City', languages: 'Spanish', region: 'North America' },
      'KR': { population: '51.8 million', capital: 'Seoul', languages: 'Korean', region: 'Asia' },
      'CN': { population: '1.41 billion', capital: 'Beijing', languages: 'Mandarin', region: 'Asia' }
    };
    
    const metadata = metadataMap[code] || { population: 'Unknown', capital: 'Unknown', languages: 'Unknown', region: 'Unknown' };
    
    return {
      ...metadata,
      wikipedia: `https://en.wikipedia.org/wiki/${name.replace(' ', '_')}`,
      wikidata: `https://www.wikidata.org/wiki/Q${Math.floor(Math.random() * 1000000)}`
    };
  };

  const countryMetadata = getCountryMetadata(countryCode!, countryName);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-300 rounded"></div>
              ))}
            </div>
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
              <h1 className="text-3xl font-bold text-gray-900">{countryName}</h1>
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
                <div className="font-medium">{countryMetadata.capital}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Region</div>
                <div className="font-medium">{countryMetadata.region}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Population</div>
                <div className="font-medium">{countryMetadata.population}</div>
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
              href={countryMetadata.wikipedia}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
            >
              <span>📖</span>
              <span>Wikipedia Article</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href={countryMetadata.wikidata}
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
