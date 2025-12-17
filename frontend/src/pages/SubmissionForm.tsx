import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { useAuth } from '../lib/auth-context';
import { COUNTRIES, PUBLISHER_SUGGESTIONS } from '../lib/mock-data';
import { submissionApi } from '../lib/api';
import { toast } from 'sonner';
import { 
  Upload, 
  Link2, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X,
  Search,
  Globe,
  Building,
  Hash,
  Clock,
  File
} from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';


// Validation schema
const submissionSchema = z.object({
  submissionType: z.enum(['url', 'pdf']),
  url: z.string().optional(),
  file: z.any().optional(),
  fileName: z.string().optional(),
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .refine((val: string) => !/^\s*$/.test(val), 'Title cannot be empty'),
  publisher: z.string()
    .min(2, 'Publisher must be at least 2 characters')
    .max(100, 'Publisher must not exceed 100 characters')
    .refine((val: string) => !/^\s*$/.test(val), 'Publisher cannot be empty'),
  country: z.string(),
  category: z.enum(['primary', 'secondary', 'unreliable']),
  wikipediaArticle: z.string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
}).refine((data: any) => {
  if (data.submissionType === 'url') {
    return data.url && data.url.length > 0;
  }
  return data.file && data.fileName;
}, {
  message: 'Please provide a URL or upload a file',
  path: ['submissionType'],
}).refine((data: any) => {
  if (data.submissionType === 'url' && data.url) {
    try {
      new URL(data.url);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}, {
  message: 'Please enter a valid URL',
  path: ['url'],
}).refine((data: any) => {
  if (data.submissionType === 'pdf' && data.file) {
    return data.file.type === 'application/pdf' && data.file.size <= 10 * 1024 * 1024;
  }
  return true;
}, {
  message: 'File must be a PDF and less than 10MB',
  path: ['file'],
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

export const SubmissionForm: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [publisherSearch, setPublisherSearch] = useState('');
  const [showPublisherSuggestions, setShowPublisherSuggestions] = useState(false);

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    mode: 'onChange',
    defaultValues: {
      submissionType: 'url',
      title: '',
      publisher: '',
      country: '',
      category: 'secondary',
      wikipediaArticle: '',
    },
  });

  const watchedSubmissionType = form.watch('submissionType');
  const watchedPublisher = form.watch('publisher');
  const watchedFile = form.watch('file');

  // Filter publisher suggestions based on search
  const filteredPublishers = useMemo(() => {
    if (!publisherSearch || publisherSearch.length < 2) return [];
    return PUBLISHER_SUGGESTIONS
      .filter(publisher => 
        publisher.toLowerCase().includes(publisherSearch.toLowerCase()) &&
        !publisher.toLowerCase().startsWith(watchedPublisher.toLowerCase())
      )
      .slice(0, 8); // Limit to 8 suggestions
  }, [publisherSearch, watchedPublisher]);

  // Handle file selection
  const handleFileChange = (file: File | undefined) => {
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        form.setError('file', {
          type: 'manual',
          message: 'File size must be less than 10MB'
        });
        return;
      }
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        form.setError('file', {
          type: 'manual',
          message: 'Only PDF files are allowed'
        });
        return;
      }
      // Clear any previous file errors
      form.clearErrors('file');
      form.setValue('file', file);
      form.setValue('fileName', file.name);
    } else {
      form.setValue('file', undefined);
      form.setValue('fileName', '');
    }
  };

  // Handle publisher selection
  const handlePublisherSelect = (publisher: string) => {
    form.setValue('publisher', publisher);
    setPublisherSearch('');
    setShowPublisherSuggestions(false);
  };

  // Handle publisher input change
  const handlePublisherChange = (value: string) => {
    form.setValue('publisher', value);
    setPublisherSearch(value);
    setShowPublisherSuggestions(value.length >= 2);
  };

  // URL validation helper
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const onSubmit = async (data: SubmissionFormData) => {
    if (!user) {
      toast.error('Please login to submit references');
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      const response = await submissionApi.create({
        url: data.submissionType === 'url' ? data.url! : `https://uploads.wikisource.org/${data.fileName}`,
        title: data.title,
        publisher: data.publisher,
        country: data.country,
        category: data.category,
        wikipediaArticle: data.wikipediaArticle || undefined,
        fileType: data.submissionType,
        fileName: data.submissionType === 'pdf' ? data.fileName : undefined,
      });

      if (response.success) {
        toast.success('Reference submitted successfully! (+10 points)');

        // Update user points locally
        updateUser({ points: user.points + 10 });

        // Reset form
        form.reset();

        // Navigate to directory
        setTimeout(() => navigate('/directory'), 1500);
      } else {
        // Handle API validation errors
        if (response.errors && response.errors.length > 0) {
          response.errors.forEach((error: { field: string; message: string }) => {
            form.setError(error.field as keyof SubmissionFormData, {
              type: 'server',
              message: error.message,
            });
          });
        } else if (response.message) {
          toast.error(response.message);
        } else {
          toast.error('Submission failed. Please check your input and try again.');
        }
      }
    } catch (error: any) {
      if (error.message) {
        toast.error(`Submission failed: ${error.message}`);
      } else {
        toast.error('Submission failed. Please check your connection and try again.');
      }
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
            <Button onClick={() => navigate('/auth')}>Go to Login</Button>
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
            All fields marked with * are required. Validation happens in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Submission Type */}
              <FormField
                control={form.control}
                name="submissionType"
                render={({ field }: { field: any }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Submission Type *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* URL or File Upload */}
              {watchedSubmissionType === 'url' ? (

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }: { field: any }) => (
                    <FormItem className="space-y-2">
                      <FormLabel htmlFor="url">Source URL *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            id="url"
                            type="url"
                            placeholder="https://example.com/article"
                            {...field}
                            className={`pr-10 ${
                              field.value && isValidUrl(field.value) 
                                ? 'border-green-500 focus-visible:ring-green-500' 
                                : field.value && !isValidUrl(field.value)
                                ? 'border-red-500 focus-visible:ring-red-500'
                                : ''
                            }`}
                          />
                          {field.value && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {isValidUrl(field.value) ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription className="flex items-center space-x-1">
                        <Globe className="h-3 w-3" />
                        <span>Enter the complete URL of the reference source</span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (

                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { value, onChange, ...field } }: { field: any }) => (
                    <FormItem className="space-y-2">
                      <FormLabel htmlFor="file">Upload PDF File (Max 10MB) *</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <Input
                            id="file"
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleFileChange(e.target.files?.[0])}
                            className="cursor-pointer"
                            {...field}
                          />
                          {watchedFile && (
                            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <File className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-800">{watchedFile.name}</span>
                                <span className="text-xs text-green-600">
                                  ({(watchedFile.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFileChange(undefined)}
                                className="text-green-600 hover:text-green-800"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription className="flex items-center space-x-1">
                        <FileText className="h-3 w-3" />
                        <span>Only PDF files are accepted, maximum size 10MB</span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}


              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }: { field: any }) => (
                  <FormItem className="space-y-2">
                    <FormLabel htmlFor="title">Reference Title *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          id="title"
                          type="text"
                          placeholder="Article or document title"
                          {...field}
                          className={`pr-20 ${
                            field.value && field.value.length >= 3 && field.value.length <= 200
                              ? 'border-green-500 focus-visible:ring-green-500'
                              : field.value && (field.value.length < 3 || field.value.length > 200)
                              ? 'border-red-500 focus-visible:ring-red-500'
                              : ''
                          }`}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                          {field.value && field.value.length >= 3 && field.value.length <= 200 && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <span className={`text-xs ${
                            field.value.length > 200 
                              ? 'text-red-500' 
                              : field.value.length >= 3 
                              ? 'text-green-600' 
                              : 'text-gray-400'
                          }`}>
                            {field.value.length}/200
                          </span>
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription className="flex items-center space-x-1">
                      <Hash className="h-3 w-3" />
                      <span>Descriptive title that clearly identifies the source</span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />


              {/* Publisher with Auto-completion */}
              <FormField
                control={form.control}
                name="publisher"
                render={({ field }: { field: any }) => (
                  <FormItem className="space-y-2">
                    <FormLabel htmlFor="publisher">Publisher/Source *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          id="publisher"
                          type="text"
                          placeholder="e.g., Nature, BBC, arXiv"
                          value={field.value}
                          onChange={(e) => handlePublisherChange(e.target.value)}
                          onFocus={() => setShowPublisherSuggestions(field.value.length >= 2)}
                          onBlur={() => setTimeout(() => setShowPublisherSuggestions(false), 200)}
                          className={`pr-10 ${
                            field.value && field.value.length >= 2 && field.value.length <= 100
                              ? 'border-green-500 focus-visible:ring-green-500'
                              : field.value && (field.value.length < 2 || field.value.length > 100)
                              ? 'border-red-500 focus-visible:ring-red-500'
                              : ''
                          }`}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {field.value && field.value.length >= 2 && field.value.length <= 100 && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        
                        {/* Publisher Suggestions Dropdown */}
                        {showPublisherSuggestions && filteredPublishers.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredPublishers.map((publisher, index) => (
                              <button
                                key={index}
                                type="button"
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 border-b border-gray-100 last:border-b-0"
                                onClick={() => handlePublisherSelect(publisher)}
                              >
                                <Building className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{publisher}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription className="flex items-center space-x-1">
                      <Building className="h-3 w-3" />
                      <span>Organization or person who published the content</span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Country */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }: { field: any }) => (
                  <FormItem className="space-y-2">
                    <FormLabel htmlFor="country">Country of Origin *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger 
                          id="country"
                          className={field.value ? 'border-green-500' : ''}
                        >
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
                    </FormControl>
                    <FormDescription>
                      Country-based verifiers will review this submission
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }: { field: any }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Source Category *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Wikipedia Article (Optional) */}
              <FormField
                control={form.control}
                name="wikipediaArticle"
                render={({ field }: { field: any }) => (
                  <FormItem className="space-y-2">
                    <FormLabel htmlFor="wikipedia">Wikipedia Article URL (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          id="wikipedia"
                          type="url"
                          placeholder="https://en.wikipedia.org/wiki/Article_name"
                          {...field}
                          className={`pr-10 ${
                            field.value && isValidUrl(field.value)
                              ? 'border-green-500 focus-visible:ring-green-500'
                              : field.value && !isValidUrl(field.value)
                              ? 'border-red-500 focus-visible:ring-red-500'
                              : ''
                          }`}
                        />
                        {field.value && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {isValidUrl(field.value) ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Link to the Wikipedia article where this source is used
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form Validation Status */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Real-time Validation Active</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Fields are validated as you type</li>
                      <li>• Visual indicators show validation status</li>
                      <li>• Form submission requires all valid fields</li>
                      <li>• Character limits are enforced with live counters</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  By submitting, you confirm this reference meets Wikipedia's verifiability standards.
                  Submissions will be reviewed by country verifiers.
                </AlertDescription>
              </Alert>

              <div className="flex space-x-4">
                <Button 
                  type="submit" 
                  disabled={loading || !form.formState.isValid} 
                  className="flex-1"
                >
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
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/directory')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

