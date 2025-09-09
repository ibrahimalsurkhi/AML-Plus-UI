import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, FileText, Trash2 } from 'lucide-react';

interface DraftConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDraft: () => void;
  onDeleteDraft: () => void;
  draftAge: number; // Age in hours
}

const DraftConfirmationDialog: React.FC<DraftConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onLoadDraft,
  onDeleteDraft,
  draftAge
}) => {
  const formatDraftAge = (hours: number): string => {
    if (hours < 1) {
      const minutes = Math.floor(hours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    if (hours < 24) {
      const roundedHours = Math.floor(hours);
      return `${roundedHours} hour${roundedHours !== 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  const handleLoadDraft = () => {
    onLoadDraft();
    onClose();
  };

  const handleDeleteDraft = () => {
    onDeleteDraft();
    onClose();
  };

  const handleStartFresh = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Draft Found
          </DialogTitle>
          <DialogDescription>
            We found a saved draft of your rule from{' '}
            <span className="font-medium text-gray-700">
              {formatDraftAge(draftAge)}
            </span>
            . What would you like to do?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Clock className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            Draft saved {formatDraftAge(draftAge)}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleLoadDraft}
            className="w-full justify-start"
            variant="default"
          >
            <FileText className="h-4 w-4 mr-2" />
            Load Draft and Continue Editing
          </Button>
          
          <Button
            onClick={handleDeleteDraft}
            className="w-full justify-start"
            variant="outline"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Draft and Start Fresh
          </Button>
          
          <Button
            onClick={handleStartFresh}
            className="w-full justify-start"
            variant="ghost"
          >
            Start Fresh (Keep Draft)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DraftConfirmationDialog;
