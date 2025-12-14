import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { useAuth } from '../lib/auth-context';
import { useSocket } from '../lib/socket-context';
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

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
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

  // Set up Socket.io event listeners
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    // Listen for new submissions
    const handleNewSubmission = (data: any) => {
      console.log('New submission received via Socket.io:', data);
      
      const newSubmission = data.submission;
      
      // Check if this submission should be shown to the current verifier
      // Admins see all, verifiers see their country's submissions
      const shouldShow = user.role === 'admin' || 
                        (user.role === 'verifier' && user.country === newSubmission.country);
      
      if (shouldShow) {
        toast.info(data.message || 'New submission received', {
          description: `${newSubmission.title} from ${newSubmission.country}`,
          duration: 5000,
        });
        
        // Add the new submission to the list immediately (at the top)
        setSubmissions((prev) => {
          // Check if submission already exists (avoid duplicates)
          const exists = prev.some(s => {
            const prevId = s.id || s._id;
            const newId = newSubmission.id || newSubmission._id;
            return prevId === newId;
          });
          
          if (exists) {
            return prev; // Already in list
          }
          
          // Add to the beginning of the list
          return [newSubmission, ...prev];
        });
        
        // Also reload after a short delay to ensure we have complete data
        setTimeout(() => {
          loadSubmissions();
        }, 500);
      }
    };

    // Listen for submission updates (verification, etc.)
    const handleSubmissionUpdated = (data: any) => {
      console.log('Submission updated:', data);
      
      const updatedSubmission = data.submission;
      
      if (data.action === 'verified') {
        toast.success('Submission verified', {
          description: `${updatedSubmission.title} has been ${updatedSubmission.status}`,
          duration: 5000,
        });
      } else if (data.action === 'created') {
        // This is handled by handleNewSubmission, but we can also handle it here for completeness
        return;
      }
      
      // Update the submission in the list if it exists, or remove if it's no longer pending
      setSubmissions((prev) => {
        const submissionId = updatedSubmission.id || updatedSubmission._id;
        const index = prev.findIndex((s) => 
          (s.id === submissionId) || (s._id === submissionId)
        );
        
        if (index !== -1) {
          const updated = [...prev];
          // If status is no longer pending and we're on the pending tab, remove it
          if (updatedSubmission.status !== 'pending') {
            updated.splice(index, 1);
          } else {
            // Update the submission
            updated[index] = { ...updated[index], ...updatedSubmission };
          }
          return updated;
        }
        
        // If not found and it's a new pending submission, add it
        if (updatedSubmission.status === 'pending') {
          const shouldShow = user?.role === 'admin' || 
                            (user?.role === 'verifier' && user?.country === updatedSubmission.country);
          if (shouldShow) {
            return [updatedSubmission, ...prev];
          }
        }
        
        return prev;
      });
      
      // Reload to ensure we have the latest data
      loadSubmissions();
    };

    // Listen for submission verified events
    const handleSubmissionVerified = (data: any) => {
      console.log('Submission verified event:', data);
      toast.success(data.message || 'Submission verified');
      loadSubmissions();
    };

    // Register event listeners
    socket.on('new-submission', handleNewSubmission);
    socket.on('submission-updated', handleSubmissionUpdated);
    socket.on('submission-verified', handleSubmissionVerified);

    // Cleanup on unmount
    return () => {
      socket.off('new-submission', handleNewSubmission);
      socket.off('submission-updated', handleSubmissionUpdated);
      socket.off('submission-verified', handleSubmissionVerified);
    };
  }, [socket, isConnected, user, loadSubmissions]);


  const handleVerify = async (submission: Submission, status: 'approved' | 'rejected', credibility?: 'credible' | 'unreliable') => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await submissionApi.verify(
        submission.id,
        status,
        credibility,
        verificationNotes || undefined
      );

      if (response.success) {
        toast.success(
          `Reference ${status === 'approved' ? '✅ Approved' : '❌ Rejected'} (+5 points)`
        );
        
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

  const openVerificationDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setVerificationNotes('');
    setShowDialog(true);
  };

  const getPendingSubmissions = () => {
    return submissions.filter((s) => s.status === 'pending');
  };

  const getVerifiedSubmissions = () => {
    let filtered = submissions.filter((s) => s.status === 'verified');

    if (filterCategory !== 'all') {
      filtered = filtered.filter((s) => s.category === filterCategory);
    }

    if (filterDate === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter((s: any) => s.verifiedDate === today);
    } else if (filterDate === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      filtered = filtered.filter((s: any) => s.verifiedDate && s.verifiedDate >= weekAgoStr);
    }

    return filtered;
  };

  const getStats = () => {
    const total = submissions.length;
    const pending = submissions.filter((s) => s.status === 'pending').length;
    const verified = submissions.filter((s) => s.status === 'verified').length;
    const credible = submissions.filter((s: any) => s.reliability === 'credible').length;

    return { total, pending, verified, credible };
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
            <Button onClick={() => navigate('/')}>Go to Home</Button>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2">Verification Dashboard</h1>
            <p className="text-gray-600">
              Review and verify reference submissions from the community
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
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
              <CardTitle className="text-sm">Credible Sources</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.credible}</div>
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
              {pendingSubmissions.map((submission: any) => (
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
            {verifiedSubmissions.map((submission: any) => (
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
                            submission.reliability === 'credible'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                          }
                        >
                          {submission.reliability === 'credible' ? '✅ Credible' : '❌ Unreliable'}
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
                        Verified on {submission.verifiedDate}
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
              onClick={() => selectedSubmission && handleVerify(selectedSubmission, 'approved', 'unreliable')}
              className="w-full sm:w-auto"
            >
              🚫 Mark Unreliable
            </Button>
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              onClick={() => selectedSubmission && handleVerify(selectedSubmission, 'approved', 'credible')}
            >
              ✅ Mark Credible
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
