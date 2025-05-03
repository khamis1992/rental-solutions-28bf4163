
import React, { useState } from 'react';
import { useLicensePlateChangeHandler } from '@/hooks/traffic-fines/use-license-plate-change-handler';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createLogger } from '@/utils/error-logger';

const logger = createLogger('license-plate-change-alert');

interface LicensePlateChangeAlertProps {
  oldLicensePlate: string;
  newLicensePlate: string;
  vehicleId: string;
  onComplete?: () => void;
}

const LicensePlateChangeAlert: React.FC<LicensePlateChangeAlertProps> = ({
  oldLicensePlate,
  newLicensePlate,
  vehicleId,
  onComplete
}) => {
  const [visible, setVisible] = useState(true);
  const { findAssociatedFines, handleLicensePlateChange, isProcessing } = useLicensePlateChangeHandler();
  const [fineCount, setFineCount] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  
  const checkForFines = async () => {
    try {
      const fines = await findAssociatedFines(oldLicensePlate);
      setFineCount(fines.length);
      setChecked(true);
      logger.info(`Found ${fines.length} traffic fines associated with license plate ${oldLicensePlate}`);
    } catch (error) {
      logger.error('Error checking for associated fines:', error);
      setFineCount(0);
      setChecked(true);
    }
  };
  
  const handleReassignment = async () => {
    try {
      const result = await handleLicensePlateChange({
        oldLicensePlate,
        newLicensePlate,
        vehicleId
      });
      
      logger.info('License plate change reassignment completed:', result);
      
      if (onComplete) {
        onComplete();
      }
      
      setVisible(false);
    } catch (error) {
      logger.error('Error during fine reassignment:', error);
    }
  };
  
  const handleDismiss = () => {
    setVisible(false);
    if (onComplete) {
      onComplete();
    }
  };
  
  // Don't render if alert was dismissed
  if (!visible) return null;
  
  return (
    <Alert variant="warning" className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle>License plate changed</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          The license plate for this vehicle has been updated from <strong>{oldLicensePlate}</strong>{' '}
          to <strong>{newLicensePlate}</strong>.
        </p>
        
        {!checked ? (
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={checkForFines}>
              Check for associated traffic fines
            </Button>
          </div>
        ) : fineCount === null ? (
          <p>Checking for associated traffic fines...</p>
        ) : fineCount === 0 ? (
          <p>No traffic fines were found associated with the old license plate.</p>
        ) : (
          <div className="space-y-2">
            <p>
              <strong>{fineCount}</strong> traffic {fineCount === 1 ? 'fine was' : 'fines were'}{' '}
              found associated with the old license plate.
            </p>
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleReassignment} 
                disabled={isProcessing} 
                size="sm"
              >
                {isProcessing ? 'Updating...' : 'Update traffic fines'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                Skip
              </Button>
            </div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default LicensePlateChangeAlert;
