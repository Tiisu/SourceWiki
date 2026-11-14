import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Upload, Link2, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
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
import {
  CharacterCount,
  FormErrorAlert,
  applyServerErrors,
  focusFirstInvalid,
} from '../components/form-helpers';
import { useAuth } from '../lib/auth-context';
import { COUNTRIES } from '../lib/mock-data';
import { describeApiError, submissionApi } from '../lib/api';
import {
  LIMITS,
  hostnameOf,
  normalizeUrl,
  validateCountry,
  validatePdf,
  validatePublisher,
  validateSourceUrl,
  validateTitle,
  validateWikipediaArticle,
} from '../lib/validation';

interface SubmissionValues {
  submissionType: 'url' | 'pdf';
  url: string;
  fileName: string;
  title: string;
  publisher: string;
  country: string;
  category: 'primary' | 'secondary' | 'unreliable';
  wikipediaArticle: string;
}

const SUBMISSION_FIELDS = [
  'url',
  'fileName',
  'title',
  'publisher',
  'country',
  'category',
  'wikipediaArticle',
] as const;

export const SubmissionForm: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [publisherList, setPublisherList] = useState<string[]>([]);
  const [hostPublishers, setHostPublishers] = useState<Map<string, string>>(new Map());

  const form = useForm<SubmissionValues>({
    mode: 'onTouched',
    defaultValues: {
      submissionType: 'url',
      url: '',
      fileName: '',
      title: '',
      publisher: '',
      country: '',
      category: 'secondary',
      wikipediaArticle: '',
    },
  });

  const submissionType = form.watch('submissionType');
  const watchedUrl = form.watch('url');
  const watchedTitle = form.watch('title');
  const watchedPublisher = form.watch('publisher');
  const watchedFileName = form.watch('fileName');

  useEffect(() => {
    let active = true;
    submissionApi
      .getAll({ status: 'approved', limit: 100 })
      .then((res) => {
        if (!active || !res?.submissions) return;
        const publishers = new Set<string>();
        const hostMap = new Map<string, string>();
        for (const sub of res.submissions) {
          if (typeof sub.publisher === 'string' && sub.publisher.trim()) {
            const pub = sub.publisher.trim();
            publishers.add(pub);
            if (typeof sub.url === 'string') {
              const host = hostnameOf(sub.url);
              if (host && !hostMap.has(host)) {
                hostMap.set(host, pub);
              }
            }
          }
        }
        setPublisherList(Array.from(publishers).sort((a, b) => a.localeCompare(b)));
        setHostPublishers(hostMap);
      })
      .catch(() => {
        // Suggestions are optional; ignore network errors
      });

    return () => {
      active = false;
    };
  }, []);

  const suggestedPublisher = useMemo(() => {
    if (submissionType !== 'url') return null;
    const host = hostnameOf(watchedUrl);
    if (!host) return null;
    const match = hostPublishers.get(host);
    if (!match || match.toLowerCase() === watchedPublisher.trim().toLowerCase()) {
      return null;
    }
    return match;
  }, [submissionType, watchedUrl, watchedPublisher, hostPublishers]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServerError(null);
    const file = e.target.files?.[0];
    if (!file) {
      form.setValue('fileName', '', { shouldValidate: true });
      return;
    }

    const result = validatePdf(file);
    if (result !== true) {
      form.setValue('fileName', '');
      form.setError('fileName', { type: 'manual', message: result });
      return;
    }

    form.setValue('fileName', file.name, { shouldValidate: true, shouldDirty: true });
    form.clearErrors('fileName');
  };

  const onSubmit = async (values: SubmissionValues) => {
    if (!user) {
      toast.error('Please login to submit references');
      navigate('/auth');
      return;
    }

    setServerError(null);
    const normalizedUrl =
      values.submissionType === 'url'
        ? normalizeUrl(values.url)
        : `https://uploads.wikisource.org/${values.fileName}`;
    const normalizedWiki = values.wikipediaArticle.trim()
      ? normalizeUrl(values.wikipediaArticle)
      : undefined;

    try {
      const response = await submissionApi.create({
        url: normalizedUrl,
        title: values.title.trim(),
        publisher: values.publisher.trim(),
        country: values.country,
        category: values.category,
        wikipediaArticle: normalizedWiki,
        fileType: values.submissionType,
        fileName: values.submissionType === 'pdf' ? values.fileName : undefined,
      });

      if (response.success) {
        toast.success('Reference submitted successfully! (+10 points)');
        updateUser({ points: user.points + 10 });
      }

      form.reset();
      setTimeout(() => navigate('/directory'), 1500);
    } catch (error) {
      const apiErr = describeApiError(error, 'Submission failed. Please try again.');
      const unplaced = applyServerErrors(form, SUBMISSION_FIELDS, apiErr);
      if (unplaced) {
        setServerError(unplaced);
      }
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
            All fields marked with * are required
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              noValidate
              onSubmit={form.handleSubmit(onSubmit, (_errors, e) => focusFirstInvalid(e))}
              className="space-y-6"
            >
              {/* Submission Type */}
              <FormField
                control={form.control}
                name="submissionType"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Submission Type *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={(value: string) => {
                          setServerError(null);
                          const next = value as 'url' | 'pdf';
                          field.onChange(next);
                          form.clearErrors(['url', 'fileName']);
                        }}
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
                  </FormItem>
                )}
              />

              {/* URL or File Upload */}
              {submissionType === 'url' ? (
                <FormField
                  control={form.control}
                  name="url"
                  rules={{
                    validate: (value) =>
                      form.getValues('submissionType') === 'url' ? validateSourceUrl(value) : true,
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source URL *</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://example.com/article"
                          {...field}
                          onChange={(e) => {
                            setServerError(null);
                            field.onChange(e);
                          }}
                          onBlur={(e) => {
                            const normalized = normalizeUrl(e.target.value);
                            if (normalized !== e.target.value) {
                              form.setValue('url', normalized, { shouldValidate: true });
                            }
                            field.onBlur();
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the complete URL of the reference source
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="fileName"
                  rules={{
                    validate: (value) =>
                      form.getValues('submissionType') === 'pdf'
                        ? value !== '' || 'Please upload a PDF file'
                        : true,
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="file">Upload PDF File (Max 10MB) *</FormLabel>
                      <div className="flex items-center space-x-4">
                        <FormControl>
                          <Input
                            id="file"
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleFileChange}
                            onBlur={field.onBlur}
                            className="cursor-pointer"
                          />
                        </FormControl>
                        {watchedFileName && (
                          <div className="flex items-center space-x-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>{watchedFileName}</span>
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                rules={{ validate: validateTitle }}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Reference Title *</FormLabel>
                      <CharacterCount value={watchedTitle} max={LIMITS.titleMax} />
                    </div>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Article or document title"
                        {...field}
                        onChange={(e) => {
                          setServerError(null);
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Publisher */}
              <FormField
                control={form.control}
                name="publisher"
                rules={{ validate: validatePublisher }}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Publisher/Source *</FormLabel>
                      <CharacterCount value={watchedPublisher} max={LIMITS.publisherMax} />
                    </div>
                    <FormControl>
                      <Input
                        type="text"
                        list="publisher-suggestions"
                        placeholder="e.g., Nature, BBC, arXiv"
                        autoComplete="organization"
                        {...field}
                        onChange={(e) => {
                          setServerError(null);
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <datalist id="publisher-suggestions">
                      {publisherList.map((pub) => (
                        <option key={pub} value={pub} />
                      ))}
                    </datalist>
                    {suggestedPublisher && (
                      <p className="text-xs text-muted-foreground">
                        Matched from URL:{' '}
                        <button
                          type="button"
                          className="text-blue-600 hover:underline font-medium cursor-pointer"
                          onClick={() =>
                            form.setValue('publisher', suggestedPublisher, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                        >
                          Use {suggestedPublisher}
                        </button>
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Country */}
              <FormField
                control={form.control}
                name="country"
                rules={{ validate: validateCountry }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country of Origin *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(val: string) => {
                        setServerError(null);
                        field.onChange(val);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.flag} {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Source Category *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={(value: string) =>
                          field.onChange(value as 'primary' | 'secondary' | 'unreliable')
                        }
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
                rules={{ validate: validateWikipediaArticle }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wikipedia Article URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://en.wikipedia.org/wiki/Article_name"
                        {...field}
                        onChange={(e) => {
                          setServerError(null);
                          field.onChange(e);
                        }}
                        onBlur={(e) => {
                          if (e.target.value.trim()) {
                            const normalized = normalizeUrl(e.target.value);
                            if (normalized !== e.target.value) {
                              form.setValue('wikipediaArticle', normalized, {
                                shouldValidate: true,
                              });
                            }
                          }
                          field.onBlur();
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Link to the Wikipedia article where this source is used
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormErrorAlert message={serverError} />

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  By submitting, you confirm this reference meets Wikipedia's verifiability standards.
                  Submissions will be reviewed by country verifiers.
                </AlertDescription>
              </Alert>

              <div className="flex space-x-4">
                <Button type="submit" disabled={form.formState.isSubmitting} className="flex-1">
                  {form.formState.isSubmitting ? (
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
                <Button type="button" variant="outline" onClick={() => navigate('/directory')}>
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
