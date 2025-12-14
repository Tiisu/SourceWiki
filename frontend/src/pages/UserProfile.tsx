import { useMemo, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import {
  Award,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  MapPin,
  Trophy,
  Star,
  Target,
  Activity,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { toast } from 'sonner';

/* ------------------ BADGES ------------------ */

const AVAILABLE_BADGES = [
  {
    id: 'first-submission',
    name: 'First Steps',
    icon: '🎯',
    pointsRequired: 10,
    description: 'Submitted your first reference',
  },
  {
    id: 'verified-10',
    name: 'Verified 10',
    icon: '✅',
    pointsRequired: 100,
    description: '10 verified submissions',
  },
  {
    id: 'credible-source',
    name: 'Credible Source',
    icon: '⭐',
    pointsRequired: 200,
    description: 'High credibility score',
  },
  {
    id: 'power-user',
    name: 'Power User',
    icon: '⚡',
    pointsRequired: 300,
    description: '50+ submissions',
  },
  {
    id: 'expert',
    name: 'Expert',
    icon: '🎓',
    pointsRequired: 500,
    description: 'Reach 500 points',
  },
  {
    id: 'top-contributor',
    name: 'Top Contributor',
    icon: '🏆',
    pointsRequired: 1000,
    description: 'Elite contributor',
  },
];

/* ------------------ TYPES ------------------ */

interface Submission {
  id: string;
  title: string;
  status: 'verified' | 'pending' | 'rejected';
  points?: number;
  submittedDate: string;
}

/* ------------------ HELPERS ------------------ */

const getCountryFlag = (country?: string) => {
  const flags: Record<string, string> = {
    Botswana: '🇧🇼',
    USA: '🇺🇸',
    UK: '🇬🇧',
    Kenya: '🇰🇪',
    Nigeria: '🇳🇬',
  };
  return country ? flags[country] ?? '🌍' : '🌍';
};

/* ------------------ COMPONENT ------------------ */

export const UserProfile = () => {
  const { user } = useAuth();

  /* ---------- SAFE USER ---------- */
  const safeUser = {
    username: user?.username ?? 'User',
    email: user?.email ?? '',
    role: user?.role ?? 'user',
    country: user?.country ?? '',
    joinDate: user?.joinDate ?? new Date().toISOString(),
    points: user?.points ?? 0,
    badges: user?.badges ?? [],
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  /* ------------------ FETCH SUBMISSIONS ------------------ */

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);

        /**
         * Mock submission data - Replace this later with real API call
         * using authenticated user ID
         */
        const mockSubmissions: Submission[] = [
          {
            id: '1',
            title: 'Traditional Medicine Reference - Morula Tree',
            status: 'verified',
            points: 50,
            submittedDate: '2024-11-15T10:30:00',
          },
          {
            id: '2',
            title: 'Cultural Practice - Setswana Wedding Customs',
            status: 'verified',
            points: 45,
            submittedDate: '2024-11-20T14:20:00',
          },
          {
            id: '3',
            title: 'Historical Event - Botswana Independence',
            status: 'pending',
            points: 0,
            submittedDate: '2024-12-01T09:15:00',
          },
          {
            id: '4',
            title: 'Traditional Music - Borankana Dance',
            status: 'verified',
            points: 40,
            submittedDate: '2024-12-05T16:45:00',
          },
          {
            id: '5',
            title: 'Language Reference - Setswana Proverbs',
            status: 'pending',
            points: 0,
            submittedDate: '2024-12-10T11:00:00',
          },
          {
            id: '6',
            title: 'Incomplete Citation',
            status: 'rejected',
            points: 0,
            submittedDate: '2024-12-08T13:30:00',
          },
        ];
        
        setSubmissions(mockSubmissions);
      } catch {
        toast.error('Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchSubmissions();
  }, [user]);

  /* ------------------ STATS ------------------ */

  const stats = useMemo(() => {
    const total = submissions.length;
    const verified = submissions.filter(s => s.status === 'verified').length;
    const pending = submissions.filter(s => s.status === 'pending').length;
    const rejected = submissions.filter(s => s.status === 'rejected').length;

    return {
      total,
      verified,
      pending,
      rejected,
      pointsEarned: submissions.reduce(
        (sum, s) => sum + (s.points ?? 0),
        0
      ),
    };
  }, [submissions]);

  /* ------------------ BADGE LOGIC ------------------ */

  const earnedBadges = useMemo(() => {
    return AVAILABLE_BADGES.filter(
      badge => safeUser.points >= badge.pointsRequired
    );
  }, [safeUser.points]);

  /* ------------------ LOADING ------------------ */

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  /* ------------------ RENDER ------------------ */

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6">

        {/* HEADER */}
        <h1 className="text-4xl font-bold mb-2">User Dashboard</h1>
        <p className="text-gray-600 mb-8">
          Track your submissions, points, and achievements
        </p>

        {/* USER SUMMARY */}
        <Card className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 ">
          <CardContent className="pt-6 flex flex-col md:flex-row justify-between">
            <div>
              <h2 className="text-3xl font-bold">{safeUser.username}</h2>
              <p className="capitalize text-blue-100">{safeUser.role}</p>

              <div className="flex gap-4 mt-4 text-sm flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" /> {safeUser.email}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {getCountryFlag(safeUser.country)}{' '}
                  {safeUser.country || 'Unknown'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined{' '}
                  {new Date(safeUser.joinDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="text-center mt-6 md:mt-0">
              <Trophy className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">
                {safeUser.points}
              </div>
              <div className="text-blue-100 text-sm">
                Total Points
              </div>
            </div>
          </CardContent>
        </Card>

        {/* COMPREHENSIVE STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-3xl font-bold text-green-700">{stats.verified}</div>
              <p className="text-sm text-green-600">Verified</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <div className="text-3xl font-bold text-yellow-700">{stats.pending}</div>
              <p className="text-sm text-yellow-600">Pending</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <div className="text-3xl font-bold text-red-700">{stats.rejected}</div>
              <p className="text-sm text-red-600">Rejected</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="pt-6 text-center">
              <Star className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-3xl font-bold text-purple-700">{earnedBadges.length}</div>
              <p className="text-sm text-purple-600">Badges Earned</p>
            </CardContent>
          </Card>
        </div>

        {/* ADDITIONAL STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Submissions</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Points from Submissions</p>
                  <p className="text-2xl font-bold">{stats.pointsEarned}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Success Rate</p>
                  <p className="text-2xl font-bold">
                    {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="mt-6">
            <div className="grid gap-6">
              {/* Points Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Points & Level Progress
                  </CardTitle>
                  <CardDescription>
                    Track your journey to becoming a top contributor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Current Points</span>
                      <span className="text-sm font-bold text-blue-600">{safeUser.points} pts</span>
                    </div>
                    <Progress value={(safeUser.points / 1000) * 100} className="h-3" />
                    <p className="text-xs text-gray-500 mt-1">
                      {1000 - safeUser.points} points until Top Contributor
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">From Submissions</p>
                      <p className="text-2xl font-bold text-blue-700">{stats.pointsEarned}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                      <p className="text-sm text-purple-600 font-medium">Badges Unlocked</p>
                      <p className="text-2xl font-bold text-purple-700">{earnedBadges.length}/{AVAILABLE_BADGES.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Badge */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-600" />
                    Next Badge
                  </CardTitle>
                  <CardDescription>
                    Keep contributing to unlock your next achievement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {earnedBadges.length < AVAILABLE_BADGES.length ? (
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-5xl">
                          {AVAILABLE_BADGES[earnedBadges.length].icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-lg">
                            {AVAILABLE_BADGES[earnedBadges.length].name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {AVAILABLE_BADGES[earnedBadges.length].description}
                          </p>
                        </div>
                      </div>
                      <Progress
                        value={
                          (safeUser.points /
                            AVAILABLE_BADGES[earnedBadges.length].pointsRequired) *
                          100
                        }
                        className="h-3"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        {AVAILABLE_BADGES[earnedBadges.length].pointsRequired - safeUser.points} points to go
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-600" />
                      <p className="font-bold text-lg mb-2">All Badges Earned! 🎉</p>
                      <p className="text-gray-600">You've unlocked every achievement. Amazing work!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {submissions.length > 0 ? (
                    <div className="space-y-3">
                      {submissions.slice(0, 3).map(sub => (
                        <div key={sub.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          {sub.status === 'verified' && <CheckCircle className="h-5 w-5 text-green-600" />}
                          {sub.status === 'pending' && <Clock className="h-5 w-5 text-yellow-600" />}
                          {sub.status === 'rejected' && <XCircle className="h-5 w-5 text-red-600" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{sub.title}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(sub.submittedDate).toLocaleDateString()}
                            </p>
                          </div>
                          {sub.points && sub.points > 0 && (
                            <span className="text-sm font-semibold text-blue-600">+{sub.points}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No activity yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* BADGES */}
          <TabsContent value="badges" className="mt-6">
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Badge Progress</p>
                    <p className="text-2xl font-bold">
                      {earnedBadges.length} / {AVAILABLE_BADGES.length}
                    </p>
                  </div>
                  <Award className="h-12 w-12 text-yellow-600" />
                </div>
                <Progress 
                  value={(earnedBadges.length / AVAILABLE_BADGES.length) * 100} 
                  className="mt-4 h-3"
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_BADGES.map(badge => {
                const earned = safeUser.points >= badge.pointsRequired;
                return (
                  <Card
                    key={badge.id}
                    className={`transition-all ${
                      earned 
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-md' 
                        : 'opacity-50 grayscale'
                    }`}
                  >
                    <CardContent className="text-center pt-6">
                      <div className="text-6xl mb-3">
                        {badge.icon}
                      </div>
                      <p className="font-bold text-lg mb-1">{badge.name}</p>
                      <p className="text-sm text-gray-600 mb-3">
                        {badge.description}
                      </p>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Star className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-semibold text-gray-700">
                          {badge.pointsRequired} points
                        </span>
                      </div>
                      {earned ? (
                        <Badge className="bg-green-600 hover:bg-green-700">
                          ✓ Earned
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-gray-400">
                          Locked
                        </Badge>
                      )}
                      {!earned && (
                        <p className="text-xs text-gray-500 mt-2">
                          {badge.pointsRequired - safeUser.points} more points needed
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* SUBMISSIONS */}
          <TabsContent value="submissions" className="mt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : submissions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 text-lg">No submissions yet</p>
                  <p className="text-gray-400 text-sm mt-2">Start contributing to earn points and badges!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {submissions.map(sub => (
                  <Card key={sub.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            {sub.status === 'verified' && (
                              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            )}
                            {sub.status === 'pending' && (
                              <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            )}
                            {sub.status === 'rejected' && (
                              <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div>
                              <p className="font-semibold text-gray-900">{sub.title}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {new Date(sub.submittedDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {sub.points !== undefined && sub.points > 0 && (
                            <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                              <Award className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-semibold text-blue-700">
                                +{sub.points} pts
                              </span>
                            </div>
                          )}
                          
                          <Badge
                            variant={
                              sub.status === 'verified'
                                ? 'default'
                                : sub.status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                            }
                            className="capitalize"
                          >
                            {sub.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

/* ------------------ STAT CARD ------------------ */

const Stat = ({ title, value }: { title: string; value: number }) => (
  <Card>
    <CardContent className="pt-6 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-sm text-gray-500">{title}</p>
    </CardContent>
  </Card>
);