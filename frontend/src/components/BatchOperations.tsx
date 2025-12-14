import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Users, CheckCircle, XCircle, Trash2, AlertTriangle, Eye } from 'lucide-react';
import { adminApi } from '../lib/api';
import { toast } from 'sonner';

interface Submission {
  _id: string;
  title: string;
  publisher: string;
  country: string;
  status: string;
  category: string;
  submitter?: { username: string };
  createdAt: string;
}

interface BatchOperationsProps {
  submissions: Submission[];
  selectedSubmissionIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onOperationsComplete?: () => void;
}

type BatchOperation = 'approve' | 'reject' | 'delete' | 'updateStatus';

export const BatchOperations: React.FC<BatchOperationsProps> = ({
  submissions,
  selectedSubmissionIds,
  onSelectionChange,
  onOperationsComplete
}) => {
  const [operation, setOperation] = useState<BatchOperation | ''>('');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [verifierNotes, setVerifierNotes] = useState('');
  const [newStatus, setNewStatus] = useState<'approved' | 'rejected'>('approved');

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(submissions.map(sub => sub._id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectSubmission = (submissionId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedSubmissionIds, submissionId]);
    } else {
      onSelectionChange(selectedSubmissionIds.filter(id => id !== submissionId));
    }
  };

  const getOperationPreview = async () => {
    if (!operation || selectedSubmissionIds.length === 0) return;
    
    try {
      const preview = await adminApi.getBatchOperationPreview({
        submissionIds: selectedSubmissionIds
      });
      setPreviewData(preview);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to get preview:', error);
      toast.error('Failed to load operation preview');
    }
  };

  const executeBatchOperation = async () => {
    if (!operation || selectedSubmissionIds.length === 0) return;
    
    setLoading(true);
    try {
      let result;
      
      switch (operation) {
        case 'approve':
          result = await adminApi.batchApproveSubmissions({
            submissionIds: selectedSubmissionIds,
            verifierNotes: verifierNotes || undefined
          });
          break;
          
        case 'reject':
          result = await adminApi.batchRejectSubmissions({
            submissionIds: selectedSubmissionIds,
            verifierNotes: verifierNotes || undefined
          });
          break;
          
        case 'delete':
          result = await adminApi.batchDeleteSubmissions({
            submissionIds: selectedSubmissionIds
          });
          break;
          
        case 'updateStatus':
          result = await adminApi.batchUpdateStatus({
            submissionIds: selectedSubmissionIds,
            status: newStatus,
            verifierNotes: verifierNotes || undefined
          });
          break;
      }
      
      toast.success(result.message || 'Batch operation completed successfully');
      onSelectionChange([]);
      setOperation('');
      setVerifierNotes('');
      setShowPreview(false);
      onOperationsComplete?.();
    } catch (error) {
      console.error('Batch operation failed:', error);
      toast.error(error instanceof Error ? error.message : 'Batch operation failed');
    } finally {
      setLoading(false);
    }
  };

  const getOperationIcon = (op: BatchOperation) => {
    switch (op) {
      case 'approve': return <CheckCircle className="h-4 w-4" />;
      case 'reject': return <XCircle className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'updateStatus': return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getOperationLabel = (op: BatchOperation) => {
    switch (op) {
      case 'approve': return 'Approve';
      case 'reject': return 'Reject';
      case 'delete': return 'Delete';
      case 'updateStatus': return 'Update Status';
    }
  };

  const getOperationVariant = (op: BatchOperation) => {
    switch (op) {
      case 'approve': return 'default';
      case 'reject': return 'destructive';
      case 'delete': return 'destructive';
      case 'updateStatus': return 'outline';
    }
  };

  const canExecuteOperation = () => {
    if (!operation || selectedSubmissionIds.length === 0) return false;
    
    // For updateStatus, need valid status
    if (operation === 'updateStatus' && !newStatus) return false;
    
    return true;
  };

  return (
    <div className="space-y-4">
      {/* Selection Header */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center space-x-4">
          <Checkbox
            checked={selectedSubmissionIds.length === submissions.length && submissions.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm font-medium">
            {selectedSubmissionIds.length} of {submissions.length} selected
          </span>
        </div>
        
        {selectedSubmissionIds.length > 0 && (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {selectedSubmissionIds.length} selected
            </Badge>
          </div>
        )}
      </div>

      {/* Batch Operation Buttons */}
      {selectedSubmissionIds.length > 0 && (
        <div className="flex flex-wrap gap-2 p-4 border rounded-lg">
          <span className="text-sm font-medium mr-2">Batch Operations:</span>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOperation('approve')}
            disabled={operation === 'approve'}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Approve
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOperation('reject')}
            disabled={operation === 'reject'}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOperation('updateStatus')}
            disabled={operation === 'updateStatus'}
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Update Status
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Batch Delete</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {selectedSubmissionIds.length} submissions? 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setOperation('delete');
                    executeBatchOperation();
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Operation Configuration */}
      {operation && selectedSubmissionIds.length > 0 && (
        <div className="p-4 border rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              {getOperationIcon(operation)}
              Configure {getOperationLabel(operation)} Operation
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOperation('');
                setVerifierNotes('');
                setShowPreview(false);
              }}
            >
              ×
            </Button>
          </div>

          {operation === 'updateStatus' && (
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={(value: 'approved' | 'rejected') => setNewStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="verifierNotes">
              {operation === 'delete' ? 'Deletion Reason (Optional)' : 'Notes (Optional)'}
            </Label>
            <Input
              id="verifierNotes"
              placeholder={
                operation === 'delete' 
                  ? 'Reason for deletion...'
                  : `Notes for ${operation}...`
              }
              value={verifierNotes}
              onChange={(e) => setVerifierNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={getOperationPreview}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            
            <Button
              onClick={executeBatchOperation}
              disabled={loading || !canExecuteOperation()}
              variant={getOperationVariant(operation)}
              className="min-w-32"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  {getOperationIcon(operation)}
                  <span className="ml-1">
                    {getOperationLabel(operation)} ({selectedSubmissionIds.length})
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Operation Preview */}
      {showPreview && previewData && (
        <div className="p-4 border rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Operation Preview
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(false)}
            >
              ×
            </Button>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              {previewData.totalCount} submissions will be affected
            </div>
            
            {Object.entries(previewData.statusGroups || {}).map(([status, submissions]: [string, any]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm">
                  {status.charAt(0).toUpperCase() + status.slice(1)}: {submissions.length}
                </span>
                <Badge variant="outline">{submissions.length}</Badge>
              </div>
            ))}
          </div>

          <div className="max-h-32 overflow-y-auto">
            <div className="text-xs text-muted-foreground mb-2">
              First 10 submissions:
            </div>
            {previewData.submissions?.slice(0, 10).map((submission: any) => (
              <div key={submission.id} className="text-xs py-1">
                <span className="font-medium">{submission.title}</span>
                <span className="text-muted-foreground">
                  {' '}by {submission.submitter} ({submission.status})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchOperations;
