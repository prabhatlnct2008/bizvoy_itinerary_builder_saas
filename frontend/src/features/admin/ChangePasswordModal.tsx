import React, { useState } from 'react';
import { Key, Mail, Copy, Check } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { AdminUser } from '../../types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onSubmit: (userId: string, passwordMode: 'auto' | 'manual', manualPassword: string | undefined, sendEmail: boolean) => Promise<string | null>;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  user,
  onSubmit,
}) => {
  const [passwordMode, setPasswordMode] = useState<'auto' | 'manual'>('auto');
  const [manualPassword, setManualPassword] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setPasswordMode('auto');
    setManualPassword('');
    setSendEmail(true);
    setGeneratedPassword(null);
    setCopied(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validate manual password
    if (passwordMode === 'manual') {
      if (!manualPassword || manualPassword.trim().length < 8) {
        alert('Password must be at least 8 characters long');
        return;
      }
    }

    try {
      setLoading(true);
      const newPassword = await onSubmit(
        user.id,
        passwordMode,
        passwordMode === 'manual' ? manualPassword.trim() : undefined,
        sendEmail
      );

      // If email was not sent, show the password
      if (!sendEmail && newPassword) {
        setGeneratedPassword(newPassword);
      } else {
        handleClose();
      }
    } catch (error) {
      // Error is handled by parent
    } finally {
      setLoading(false);
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    if (passwordMode === 'auto') {
      return true; // Auto mode is always valid
    }
    // Manual mode requires 8+ character password
    return manualPassword.trim().length >= 8;
  };

  const handleCopyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) return null;

  // If password was generated and email not sent, show the password
  if (generatedPassword) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Password Changed Successfully"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Please save this password securely. You will need to share it with the user manually.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              New Password for {user.full_name}
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={generatedPassword}
                readOnly
                className="flex-1 font-mono"
              />
              <Button
                variant="secondary"
                onClick={handleCopyPassword}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change User Password"
      size="md"
    >
      <div className="space-y-6">
        {/* User Info */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-text-primary">{user.full_name}</p>
          <p className="text-sm text-text-secondary">{user.email}</p>
        </div>

        {/* Password Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-3">
            Password Generation Mode
          </label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="passwordMode"
                value="auto"
                checked={passwordMode === 'auto'}
                onChange={(e) => setPasswordMode(e.target.value as 'auto')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary-600" />
                  <span className="font-medium text-text-primary">Generate Automatically</span>
                </div>
                <p className="text-sm text-text-muted mt-1">
                  System will create a secure random password (12 characters with letters, numbers, and symbols)
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="passwordMode"
                value="manual"
                checked={passwordMode === 'manual'}
                onChange={(e) => setPasswordMode(e.target.value as 'manual')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary-600" />
                  <span className="font-medium text-text-primary">Set Manually</span>
                </div>
                <p className="text-sm text-text-muted mt-1">
                  Specify a custom password (minimum 8 characters)
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Manual Password Input */}
        {passwordMode === 'manual' && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              New Password *
            </label>
            <Input
              type="text"
              value={manualPassword}
              onChange={(e) => setManualPassword(e.target.value)}
              placeholder="Enter password (min 8 characters)"
              className="font-mono"
            />
            <p className="mt-1 text-xs text-text-muted">
              Minimum 8 characters required
            </p>
          </div>
        )}

        {/* Email Notification Checkbox */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-text-primary">Send Email Notification</span>
              </div>
              <p className="text-sm text-text-secondary mt-1">
                {sendEmail
                  ? `An email with the new password will be sent to ${user.email}`
                  : 'You will need to manually share the password with the user'}
              </p>
            </div>
          </label>
        </div>

        {/* Warning if email disabled */}
        {!sendEmail && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> After changing the password, you will be shown the new password. Make sure to save it securely and share it with the user.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !isFormValid()}
          >
            <Key className="h-4 w-4 mr-2" />
            {loading ? 'Changing Password...' : 'Change Password'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ChangePasswordModal;
