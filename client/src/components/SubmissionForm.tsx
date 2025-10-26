import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useAuth } from '../lib/auth-context';
import { COUNTRIES, getSubmissions, saveSubmissions, Submission } from '../lib/mock-data';
import { toast } from 'sonner@2.0.3';
import { Upload, Link2, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface SubmissionFormProps {
  onNavigate: (page: string) => void;
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({ onNavigate }) => {
  const { user, updateUser } = useAuth();
  const [submissionType, setSubmissionType] = useState<'url' | 'pdf'>('url');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [publisher, setPublisher] = useState('');
  const [country, setCountry] = useState('');
  const [category, setCategory] = useState<'primary' | 'secondary' | 'unreliable'>('secondary');
  const [wikipediaArticle, setWikipediaArticle] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        return;
      }
      setFileName(file.name);
    }
  };

  const validateUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to submit references');
      onNavigate('auth');
      return;
    }

    // Validation
    if (submissionType === 'url' && !validateUrl(url)) {
      toast.error('Please enter a valid URL');
      return;
    }

    if (submissionType === 'pdf' && !fileName) {
      toast.error('Please upload a PDF file');
      return;
    }

    if (!country) {
      toast.error('Please select a country');
      return;
    }

    if (!title || !publisher) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newSubmission: Submission = {
        id: Date.now().toString(),
        url: submissionType === 'url' ? url : `https://uploads.wikisource.org/${fileName}`,
        title,
        publisher,
        country,
        category,
        status: 'pending',
        submitterId: user.id,
        submitterName: user.username,
        wikipediaArticle: wikipediaArticle || undefined,
        fileName: submissionType === 'pdf' ? fileName : undefined,
        mediaType: submissionType,
        submittedDate: new Date().toISOString().split('T')[0],
      };

      const submissions = getSubmissions();
      submissions.unshift(newSubmission);
      saveSubmissions(submissions);

      // Award points for submission
      const isFirstSubmission = !user.badges.includes('first-submission');
      const newPoints = user.points + 10;
      const newBadges = isFirstSubmission
        ? [...user.badges, 'first-submission']
        : user.badges;

      updateUser({ points: newPoints, badges: newBadges });

      toast.success('Reference submitted successfully!');
      if (isFirstSubmission) {
        toast.success('🌟 Badge unlocked: First Submission!');
      }

      // Reset form
      setUrl('');
      setTitle('');
      setPublisher('');
      setCountry('');
      setCategory('secondary');
      setWikipediaArticle('');
      setFileName('');

      // Navigate to directory
      setTimeout(() => onNavigate('directory'), 1500);
    } catch (error) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>
              Please login to submit references for verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => onNavigate('auth')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="mb-2">Submit Reference for Verification</h1>
        <p className="text-gray-600">
          Help improve Wikipedia's source quality by submitting references for community review.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reference Details</CardTitle>
          <CardDescription>
            All fields marked with * are required
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Submission Type */}
            <div className="space-y-2">
              <Label>Submission Type *</Label>
              <RadioGroup
                value={submissionType}
                onValueChange={(value) => setSubmissionType(value as 'url' | 'pdf')}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="url" id="type-url" />
                  <Label htmlFor="type-url" className="cursor-pointer flex items-center space-x-2">
                    <Link2 className="h-4 w-4" />
                    <span>URL</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="type-pdf" />
                  <Label htmlFor="type-pdf" className="cursor-pointer flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>PDF Upload</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* URL or File Upload */}
            {submissionType === 'url' ? (
              <div className="space-y-2">
                <Label htmlFor="url">Source URL *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500">
                  Enter the complete URL of the reference source
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="file">Upload PDF File (Max 10MB) *</Label>
                <div className="flex items-center space-x-4">
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {fileName && (
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>{fileName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Reference Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder="Article or document title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Publisher */}
            <div className="space-y-2">
              <Label htmlFor="publisher">Publisher/Source *</Label>
              <Input
                id="publisher"
                type="text"
                placeholder="e.g., Nature, BBC, arXiv"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                required
              />
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">Country of Origin *</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Country-based verifiers will review this submission
              </p>
            </div>

            {/* Category */}
            <div className="space-y-3">
              <Label>Source Category *</Label>
              <RadioGroup
                value={category}
                onValueChange={(value) => setCategory(value as any)}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="primary" id="cat-primary" className="mt-1" />
                  <Label htmlFor="cat-primary" className="cursor-pointer flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xl">📗</span>
                      <span>Primary Source</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Original research, historical documents, raw data
                    </p>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="secondary" id="cat-secondary" className="mt-1" />
                  <Label htmlFor="cat-secondary" className="cursor-pointer flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xl">📘</span>
                      <span>Secondary Source</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Analysis, commentary, scholarly reviews
                    </p>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="unreliable" id="cat-unreliable" className="mt-1" />
                  <Label htmlFor="cat-unreliable" className="cursor-pointer flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xl">🚫</span>
                      <span>Potentially Unreliable</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Questionable editorial standards, unverified claims
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Wikipedia Article (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="wikipedia">Wikipedia Article URL (Optional)</Label>
              <Input
                id="wikipedia"
                type="url"
                placeholder="https://en.wikipedia.org/wiki/Article_name"
                value={wikipediaArticle}
                onChange={(e) => setWikipediaArticle(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Link to the Wikipedia article where this source is used
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                By submitting, you confirm this reference meets Wikipedia's verifiability standards.
                Submissions will be reviewed by country verifiers.
              </AlertDescription>
            </Alert>

            <div className="flex space-x-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-pulse" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Reference
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => onNavigate('directory')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
