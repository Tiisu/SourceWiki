import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../lib/auth-context';
import { submissionApi, userApi } from '../lib/api';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsResponse, leaderboardResponse] = await Promise.all([
        submissionApi.getStats(),
        userApi.getLeaderboard(undefined, 5)
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }

      if (leaderboardResponse.success) {
        setLeaderboard(leaderboardResponse.users);
      }
    } catch (error) {
      // Silently fail, use default values
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-100 rounded-full">
              <BookOpen className="h-16 w-16 text-blue-600" />
            </div>
          </div>
          <h1 className="mb-4 text-gray-900">
            Community-Driven Reference Verification for Wikipedia
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Help maintain the quality and reliability of Wikipedia sources through collaborative verification.
            Join thousands of editors in ensuring accurate, trustworthy references.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Button size="lg" onClick={() => onNavigate('submit')} className="flex items-center space-x-2">
                  <span>Submit a Reference</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => onNavigate('directory')}>
                  Browse Directory
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" onClick={() => onNavigate('auth')} className="flex items-center space-x-2">
                  <span>Get Started</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => onNavigate('directory')}>
                  Explore Sources
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle>{loading ? '...' : stats.approved || 0}</CardTitle>
              <CardDescription>Verified Sources</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle>{loading ? '...' : leaderboard.length}</CardTitle>
              <CardDescription>Active Contributors</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <TrendingUp className="h-10 w-10 text-purple-600" />
              </div>
              <CardTitle>{loading ? '...' : stats.total || 0}</CardTitle>
              <CardDescription>Total Submissions</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mt-24">
          <h2 className="text-center mb-12 text-gray-900">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="mb-2">Submit References</h3>
              <p className="text-gray-600">
                Upload URLs or PDFs of sources you've used in Wikipedia articles. Categorize them as
                primary, secondary, or potentially unreliable.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="mb-2">Community Verification</h3>
              <p className="text-gray-600">
                Country-based verifiers review submissions for credibility, editorial standards, and
                reliability using established Wikipedia guidelines.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="mb-2">Build Reputation</h3>
              <p className="text-gray-600">
                Earn points and badges for contributions. Become a country expert and help maintain
                the world's largest encyclopedia.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24">
          <h2 className="text-center mb-12 text-gray-900">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>📗 Source Categorization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Classify sources as primary (original research), secondary (analysis/commentary), or
                  unreliable based on Wikipedia standards.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🌍 Country-Based Review</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Verifiers review sources from their region, ensuring cultural context and local
                  expertise in source evaluation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🔍 Searchable Directory</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Browse and search verified sources by country, category, publisher, or reliability
                  status for easy reference.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🏆 Gamification System</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Earn points and unlock badges as you contribute. Track your progress and compete on
                  country leaderboards.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Leaderboard Preview */}
        <div className="mt-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-gray-900">Top Contributors</h2>
            <Button variant="outline" onClick={() => onNavigate('directory')}>
              View All
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                        Country
                      </th>
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                        Verified
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaderboard.map((entry, index) => (
                      <tr key={entry.id || entry.username}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {index === 0 && <span className="text-xl mr-2">🥇</span>}
                            {index === 1 && <span className="text-xl mr-2">🥈</span>}
                            {index === 2 && <span className="text-xl mr-2">🥉</span>}
                            <span>{index + 1}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{entry.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{entry.country}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{entry.points}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{entry.badges?.length || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-blue-50 rounded-lg p-12 text-center">
          <h2 className="mb-4 text-gray-900">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join our community of Wikipedia editors dedicated to maintaining high-quality,
            verifiable references.
          </p>
          {!user && (
            <Button size="lg" onClick={() => onNavigate('auth')} className="flex items-center space-x-2 mx-auto">
              <span>Create Free Account</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
