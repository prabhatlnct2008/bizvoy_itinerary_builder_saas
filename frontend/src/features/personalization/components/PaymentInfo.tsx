import { QrCode, Building2, CreditCard, Info } from 'lucide-react';
import { PaymentInfo as PaymentInfoType } from '../../../types/personalization';

interface PaymentInfoProps {
  paymentInfo: PaymentInfoType | null | undefined;
}

export const PaymentInfo = ({ paymentInfo }: PaymentInfoProps) => {
  if (!paymentInfo) {
    return null;
  }

  const {
    qr_code_url,
    company_name,
    bank_name,
    account_number,
    routing_number,
    payment_notes,
  } = paymentInfo;

  return (
    <div className="bg-game-card rounded-xl p-6 mb-6">
      <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5" />
        Payment Information
      </h3>

      <div className="space-y-6">
        {/* QR Code */}
        {qr_code_url && (
          <div className="flex flex-col items-center bg-white rounded-lg p-4">
            <div className="mb-3 flex items-center gap-2 text-gray-700">
              <QrCode className="w-5 h-5" />
              <span className="font-semibold">Scan to Pay</span>
            </div>
            <img
              src={qr_code_url}
              alt="Payment QR Code"
              className="w-48 h-48"
            />
          </div>
        )}

        {/* Divider */}
        {qr_code_url && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-gray-400 text-sm">OR</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>
        )}

        {/* Bank Details */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Bank Transfer Details
          </h4>

          <div className="grid grid-cols-1 gap-3">
            {/* Company Name */}
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Account Name</div>
              <div className="text-white font-semibold">
                {company_name || 'Payment details will be shared by your agent'}
              </div>
            </div>

            {/* Bank Name */}
            {bank_name && (
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Bank</div>
                <div className="text-white font-semibold">
                  {bank_name}
                </div>
              </div>
            )}

            {/* Account Number */}
            {account_number && (
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Account Number</div>
                <div className="text-white font-semibold font-mono">
                  {account_number}
                </div>
              </div>
            )}

            {/* Routing Number */}
            {routing_number && (
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Routing Number</div>
                <div className="text-white font-semibold font-mono">
                  {routing_number}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Notes */}
        {payment_notes && (
          <div className="bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200">
              {payment_notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
