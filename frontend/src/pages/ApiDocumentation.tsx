import { useState } from 'react';
import { ExternalLink, BookOpen, Code, FileJson, Zap, Shield, Users, Globe, BarChart3, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const SWAGGER_UI_URL = `${API_BASE_URL}/api/docs`;
const SWAGGER_JSON_URL = `${API_BASE_URL}/api/docs.json`;

export const ApiDocumentation: React.FC = () => {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const apiSections = [
    {
      name: 'Authentication',
      description: 'User registration, login, logout, and token management',
      icon: Shield,
      endpoints: ['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/me'],
      color: 'bg-blue-500'
    },
    {
      name: 'Submissions',
      description: 'Create, read, update, and verify Wikipedia source submissions',
      icon: BookOpen,
      endpoints: ['GET /api/submissions', 'POST /api/submissions', 'PUT /api/submissions/:id/verify'],
      color: 'bg-green-500'
    },
    {
      name: 'Users',
      description: 'User profiles, leaderboard, badges, and role management',
      icon: Users,
      endpoints: ['GET /api/users', 'GET /api/users/leaderboard', 'PUT /api/users/:id/role'],
      color: 'bg-purple-500'
    },
    {
      name: 'Admin',
      description: 'Administrative operations and dashboard analytics',
      icon: Settings,
      endpoints: ['GET /api/admin/dashboard', 'GET /api/admin/analytics', 'PUT /api/admin/users/:id'],
      color: 'bg-red-500'
    },
    {
      name: 'Countries',
      description: 'Country statistics and verifier management',
      icon: Globe,
      endpoints: ['GET /api/countries', 'GET /api/countries/:code/stats', 'POST /api/countries/:code/assign-verifier'],
      color: 'bg-yellow-500'
    },
    {
      name: 'Reports',
      description: 'Analytics and reporting for admins and verifiers',
      icon: BarChart3,
      endpoints: ['GET /api/reports/overview', 'GET /api/reports/country/:country', 'GET /api/reports/user/:userId'],
      color: 'bg-indigo-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Code className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
              <p className="text-gray-600 mt-1">
                Interactive API documentation powered by Swagger/OpenAPI
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-4">
            <Badge variant="secondary" className="text-sm">
              OpenAPI 3.0.0
            </Badge>
            <Badge variant="secondary" className="text-sm">
              REST API
            </Badge>
            <Badge variant="secondary" className="text-sm">
              JWT Authentication
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="interactive" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="interactive">
              <Zap className="h-4 w-4 mr-2" />
              Interactive Docs
            </TabsTrigger>
            <TabsTrigger value="overview">
              <BookOpen className="h-4 w-4 mr-2" />
              API Overview
            </TabsTrigger>
            <TabsTrigger value="quickstart">
              <Code className="h-4 w-4 mr-2" />
              Quick Start
            </TabsTrigger>
          </TabsList>

          {/* Interactive Documentation Tab */}
          <TabsContent value="interactive" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Swagger UI</CardTitle>
                    <CardDescription>
                      Interactive API documentation with live testing capabilities
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.open(SWAGGER_UI_URL, '_blank')}
                    className="flex items-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Open in New Tab</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative w-full" style={{ minHeight: '800px' }}>
                  {!iframeLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading Swagger UI...</p>
                      </div>
                    </div>
                  )}
                  <iframe
                    src={SWAGGER_UI_URL}
                    className="w-full border-0 rounded-lg"
                    style={{ minHeight: '800px', height: '100vh' }}
                    onLoad={() => setIframeLoaded(true)}
                    title="Swagger UI Documentation"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apiSections.map((section) => {
                const Icon = section.icon;
                return (
                  <Card key={section.name} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 ${section.color} rounded-lg`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-lg">{section.name}</CardTitle>
                      </div>
                      <CardDescription className="mt-2">
                        {section.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Key Endpoints:</p>
                        {section.endpoints.map((endpoint, idx) => (
                          <div
                            key={idx}
                            className="text-xs font-mono bg-gray-100 p-2 rounded text-gray-700"
                          >
                            {endpoint}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>API Base URL</CardTitle>
                <CardDescription>Base URL for all API requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <code className="flex-1 bg-gray-100 p-3 rounded-lg font-mono text-sm">
                    {API_BASE_URL}/api
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(`${API_BASE_URL}/api`)}
                  >
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Start Tab */}
          <TabsContent value="quickstart" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>Learn how to use the API</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">1. Authentication</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Most endpoints require authentication. Register a new user or login to get an access token.
                    </p>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <pre className="text-xs overflow-x-auto">
                        <code>{`POST ${API_BASE_URL}/api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "country": "US"
}`}</code>
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">2. Using the Access Token</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Include the JWT token in the Authorization header for protected endpoints.
                    </p>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <pre className="text-xs overflow-x-auto">
                        <code>{`GET ${API_BASE_URL}/api/auth/me
Authorization: Bearer YOUR_ACCESS_TOKEN`}</code>
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">3. Making Requests</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      All requests should include the Content-Type header and credentials for authenticated endpoints.
                    </p>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <pre className="text-xs overflow-x-auto">
                        <code>{`// Example: Create a submission
POST ${API_BASE_URL}/api/submissions
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "title": "Article Title",
  "url": "https://example.com/article",
  "country": "US"
}`}</code>
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Download OpenAPI Specification</CardTitle>
                  <CardDescription>Get the complete API specification in JSON format</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileJson className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium">OpenAPI 3.0 Specification</p>
                        <p className="text-sm text-gray-600">
                          {SWAGGER_JSON_URL}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => window.open(SWAGGER_JSON_URL, '_blank')}
                        className="flex items-center space-x-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>View JSON</span>
                      </Button>
                      <Button
                        onClick={async () => {
                          try {
                            const response = await fetch(SWAGGER_JSON_URL);
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'api-specification.json';
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                          } catch (error) {
                            console.error('Failed to download:', error);
                          }
                        }}
                        className="flex items-center space-x-2"
                      >
                        <FileJson className="h-4 w-4" />
                        <span>Download</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Response Format</CardTitle>
                  <CardDescription>Standard API response structure</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <pre className="text-xs overflow-x-auto">
                      <code>{`// Success Response
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message"
}

// Error Response
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

