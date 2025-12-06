import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useAuth } from '../lib/auth-context';
import {
  getCategoryIcon,
  getCategoryColor,
  getCountryFlag,
  getCountryName,
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
  createdAt: string;
  updatedAt: string;
}
import { CheckCircle, XCircle, Eye, Clock, TrendingUp, Users, FileCheck } from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, [user]);

  const loadSubmissions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (user.role === 'verifier' || user.role === 'admin') {
        // Load all submissions for admin (all countries) or verifier (their country)
        const params = user.role === 'admin' ? {} : { country: user.country };
        const response = await submissionApi.getAll(params);
        if (response.success) {
          setSubmissions(response.submissions || response.data?.submissions || []);
        }
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (submission: Submission, status: 'approved' | 'rejected', credibility?: 'credible' | 'unreliable') => {
    if (!user) return;

    console.log('🔵 HANDLE VERIFY CALLED');
    console.log('🔵 Parameters received:', { status, credibility });
    console.log('🔵 Verification notes from state:', verificationNotes);
    console.log('🔵 About to send to API:', { 
      id: submission.id, 
      status, 
      credibility, 
      verificationNotes: verificationNotes || undefined 
    });

    setLoading(true);
    try {
      const response = await submissionApi.verify(
        submission.id,
        status,
        credibility,
        verificationNotes || undefined
      );

      if (response.success) {
        let message = '';
        if (status === 'rejected') {
          message = '❌ Reference Rejected (+5 points)';
        } else if (credibility === 'credible') {
          message = '✅ Marked as Credible (+5 points)';
        } else if (credibility === 'unreliable') {
          message = '🚫 Marked as Unreliable (+5 points)';
        }
        
        toast.success(message);
        
        // Update user points locally
        if (user) {
          user.points += 5;
        }
        
        // Reload submissions
        await loadSubmissions();
      }
    } catch (error) {
      toast.error('Failed to verify submission');
    } finally {
      setLoading(false);
      setSelectedSubmission(null);
      setVerificationNotes('');
      setShowDialog(false);
    }
  };

  const handleReject = async (submission: Submission) => {
    await handleVerify(submission, 'rejected');
  };

  const handleCredible = async (submission: Submission) => {
    console.log('🟢 CREDIBLE BUTTON CLICKED');
    console.log('🟢 Submission object:', submission);
    console.log('🟢 About to call handleVerify with: approved, credible');
    console.log('🟢 Verification notes state:', verificationNotes);
    console.log('🟢 All parameters being passed:', { submission: submission.id, status: 'approved', credibility: 'credible', notes: verificationNotes });
    await handleVerify(submission, 'approved', 'credible');
  };

  const handleUnreliable = async (submission: Submission) => {
    await handleVerify(submission, 'approved', 'unreliable');
  };

  const openVerificationDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setVerificationNotes('');
    setShowDialog(true);
  };

  const getPendingSubmissions = () => {
    return submissions.filter((s) => s.status === 'pending');
  };

  const getVerifiedSubmissions = () => {
    let filtered = submissions.filter((s) => s.status === 'approved' || s.status === 'rejected');

    if (filterCategory !== 'all') {
      filtered = filtered.filter((s) => s.category === filterCategory);
    }

    if (filterDate === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter((s) => {
        const verifiedDate = s.verifiedAt ? new Date(s.verifiedAt).toISOString().split('T')[0] : null;
        return verifiedDate === today;
      });
    } else if (filterDate === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter((s) => {
        if (!s.verifiedAt) return false;
        return new Date(s.verifiedAt) >= weekAgo;
      });
    }

    return filtered;
  };

  const getStats = () => {
    const total = submissions.length;
    const pending = submissions.filter((s) => s.status === 'pending').length;
    const verified = submissions.filter((s) => s.status === 'approved' || s.status === 'rejected').length;
    const approved = submissions.filter((s) => s.status === 'approved').length;

    return { total, pending, verified, approved };
  };

  if (!user || (user.role !== 'admin' && user.role !== 'verifier')) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need admin or verifier privileges to access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => onNavigate('landing')}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = getStats();
  const pendingSubmissions = getPendingSubmissions();
  const verifiedSubmissions = getVerifiedSubmissions();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="mb-2">
          {user.role === 'admin' ? 'Global Admin Dashboard' : 'Verification Dashboard'}
        </h1>
        <p className="text-gray-600">
          {user.role === 'admin' 
            ? 'Review and verify reference submissions from all countries'
            : `Review and verify reference submissions from ${getCountryName(user.country)}`
          }
        </p>
        {user.role === 'admin' && (
          <div className="mt-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              🌍 Global Access - All Countries
            </Badge>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Total Submissions</CardTitle>
              <FileCheck className="h-4 w-4 text-gray-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Verified</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.verified}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Approved</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.approved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="verified">Verified ({verifiedSubmissions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingSubmissions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg mb-2">No pending submissions</p>
                <p className="text-gray-500">All caught up! Great work.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingSubmissions.map((submission) => (
                <Card key={submission.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start space-x-3 mb-3">
                          <span className="text-2xl">{getCategoryIcon(submission.category)}</span>
                          <div className="flex-1">
                            <h3 className="mb-1">{submission.title}</h3>
                            <p className="text-gray-600 mb-2">{submission.publisher}</p>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge variant="outline" className={getCategoryColor(submission.category)}>
                                {submission.category}
                              </Badge>
                              <Badge variant="outline">
                                {getCountryFlag(submission.country)} {getCountryName(submission.country)}
                              </Badge>
                              <Badge variant="outline">
                                {submission.mediaType === 'pdf' ? '📄 PDF' : '🔗 URL'}
                              </Badge>
                            </div>
                            <a
                              href={submission.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline block mb-2"
                            >
                              {submission.url}
                            </a>
                            {submission.wikipediaArticle && (
                              <a
                                href={submission.wikipediaArticle}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-500 hover:underline block"
                              >
                                📖 Wikipedia Article
                              </a>
                            )}
                            <p className="text-sm text-gray-500 mt-2">
                              Submitted by {submission.submitterName} on {submission.submittedDate}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 min-w-[160px]">
                        <Button
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => openVerificationDialog(submission)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open(submission.url, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Source
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="verified">
          <div className="flex gap-4 mb-4">
            <Select value={filterDate} onValueChange={setFilterDate}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="primary">📗 Primary</SelectItem>
                <SelectItem value="secondary">📘 Secondary</SelectItem>
                <SelectItem value="unreliable">🚫 Unreliable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {verifiedSubmissions.map((submission) => (
              <Card key={submission.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{getCategoryIcon(submission.category)}</span>
                    <div className="flex-1">
                      <h3 className="mb-1">{submission.title}</h3>
                      <p className="text-gray-600 mb-2">{submission.publisher}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className={getCategoryColor(submission.category)}>
                          {submission.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            submission.status === 'approved' && submission.credibility === 'credible'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : submission.status === 'approved' && submission.credibility === 'unreliable'
                              ? 'bg-orange-100 text-orange-800 border-orange-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                          }
                        >
                          {submission.status === 'approved' 
                            ? submission.credibility === 'credible' 
                              ? '✅ Credible' 
                              : '🚫 Unreliable'
                            : '❌ Rejected'
                          }
                        </Badge>
                        <Badge variant="outline">
                          {getCountryFlag(submission.country)} {getCountryName(submission.country)}
                        </Badge>
                      </div>
                      <a
                        href={submission.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline block mb-2"
                      >
                        {submission.url}
                      </a>
                      {submission.verifierNotes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm">
                            <strong>Verification Notes:</strong> {submission.verifierNotes}
                          </p>
                        </div>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        Verified on {submission.verifiedAt ? new Date(submission.verifiedAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Verification Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verify Reference</DialogTitle>
            <DialogDescription>
              Review this submission and mark it as credible or unreliable
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <h4 className="mb-2">{selectedSubmission.title}</h4>
                <p className="text-gray-600 mb-2">{selectedSubmission.publisher}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className={getCategoryColor(selectedSubmission.category)}>
                    {getCategoryIcon(selectedSubmission.category)} {selectedSubmission.category}
                  </Badge>
                  <Badge variant="outline">
                    {getCountryFlag(selectedSubmission.country)}{' '}
                    {getCountryName(selectedSubmission.country)}
                  </Badge>
                </div>
                <a
                  href={selectedSubmission.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {selectedSubmission.url}
                </a>
              </div>

              <div className="space-y-2">
                <label className="text-sm">Verification Notes (Optional)</label>
                <Textarea
                  placeholder="Add notes about editorial standards, bias, verification status, etc."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => selectedSubmission && handleReject(selectedSubmission)}
              className="w-full sm:w-auto"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedSubmission && handleUnreliable(selectedSubmission)}
              className="w-full sm:w-auto"
            >
              🚫 Mark Unreliable
            </Button>
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              onClick={() => {
                console.log('🔥 BUTTON CLICKED - selectedSubmission:', selectedSubmission);
                if (selectedSubmission) {
                  handleCredible(selectedSubmission);
                }
              }}
            >
              ✅ Mark Credible
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
