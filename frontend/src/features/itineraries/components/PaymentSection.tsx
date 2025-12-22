import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Calendar,
  DollarSign,
  Percent,
  Clock,
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import itinerariesApi from '../../../api/itineraries';

interface PaymentRecord {
  id: string;
  itinerary_id: string;
  payment_type: string;
  amount: number;
  currency: string;
  payment_method?: string;
  reference_number?: string;
  paid_at?: string;
  notes?: string;
  confirmed_by?: string;
  created_at: string;
  updated_at: string;
}

interface PricingWithPayments {
  id: string;
  itinerary_id: string;
  base_package?: number;
  taxes_fees?: number;
  discount_code?: string;
  discount_amount?: number;
  discount_percent?: number;
  total?: number;
  currency: string;
  pricing_notes?: string;
  advance_enabled: boolean;
  advance_type?: string;
  advance_amount?: number;
  advance_percent?: number;
  advance_deadline?: string;
  final_deadline?: string;
  payments: PaymentRecord[];
  total_paid: number;
  balance_due: number;
  advance_required?: number;
  advance_paid: boolean;
}

interface PaymentSectionProps {
  itineraryId: string;
  currency: string;
  onPricingChange?: (total: number) => void;
}

const PAYMENT_TYPES = [
  { value: 'advance', label: 'Advance Payment' },
  { value: 'partial', label: 'Partial Payment' },
  { value: 'final', label: 'Final Payment' },
  { value: 'full', label: 'Full Payment' },
];

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

const PaymentSection: React.FC<PaymentSectionProps> = ({
  itineraryId,
  currency: defaultCurrency,
  onPricingChange,
}) => {
  const [pricing, setPricing] = useState<PricingWithPayments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Local form state
  const [discountPercent, setDiscountPercent] = useState<string>('');
  const [advanceEnabled, setAdvanceEnabled] = useState(false);
  const [advanceType, setAdvanceType] = useState<string>('fixed');
  const [advanceAmount, setAdvanceAmount] = useState<string>('');
  const [advancePercent, setAdvancePercent] = useState<string>('');
  const [advanceDeadline, setAdvanceDeadline] = useState<string>('');
  const [finalDeadline, setFinalDeadline] = useState<string>('');

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_type: 'advance',
    amount: '',
    currency: defaultCurrency,
    payment_method: '',
    reference_number: '',
    paid_at: '',
    notes: '',
  });

  const fetchPricing = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await itinerariesApi.getItineraryPricing(itineraryId);
      setPricing(data);

      // Initialize form state
      setDiscountPercent(data.discount_percent?.toString() || '');
      setAdvanceEnabled(data.advance_enabled || false);
      setAdvanceType(data.advance_type || 'fixed');
      setAdvanceAmount(data.advance_amount?.toString() || '');
      setAdvancePercent(data.advance_percent?.toString() || '');
      setAdvanceDeadline(data.advance_deadline ? data.advance_deadline.split('T')[0] : '');
      setFinalDeadline(data.final_deadline ? data.final_deadline.split('T')[0] : '');
    } catch (error: any) {
      console.error('Failed to load pricing:', error);
      toast.error('Failed to load payment details');
    } finally {
      setIsLoading(false);
    }
  }, [itineraryId]);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  const handleSavePricing = async () => {
    try {
      setIsSaving(true);
      const updateData: any = {
        discount_percent: discountPercent ? parseFloat(discountPercent) : null,
        advance_enabled: advanceEnabled,
        advance_type: advanceEnabled ? advanceType : null,
        advance_amount: advanceEnabled && advanceType === 'fixed' ? parseFloat(advanceAmount) || null : null,
        advance_percent: advanceEnabled && advanceType === 'percent' ? parseFloat(advancePercent) || null : null,
        advance_deadline: advanceEnabled && advanceDeadline ? `${advanceDeadline}T00:00:00` : null,
        final_deadline: finalDeadline ? `${finalDeadline}T00:00:00` : null,
      };

      const data = await itinerariesApi.updateItineraryPricing(itineraryId, updateData);
      setPricing(data);
      toast.success('Payment settings saved');

      if (onPricingChange && data.total) {
        onPricingChange(data.total);
      }
    } catch (error: any) {
      toast.error('Failed to save payment settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPayment = () => {
    setEditingPayment(null);
    setPaymentForm({
      payment_type: 'advance',
      amount: '',
      currency: pricing?.currency || defaultCurrency,
      payment_method: '',
      reference_number: '',
      paid_at: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsPaymentModalOpen(true);
  };

  const handleEditPayment = (payment: PaymentRecord) => {
    setEditingPayment(payment);
    setPaymentForm({
      payment_type: payment.payment_type,
      amount: payment.amount.toString(),
      currency: payment.currency,
      payment_method: payment.payment_method || '',
      reference_number: payment.reference_number || '',
      paid_at: payment.paid_at ? payment.paid_at.split('T')[0] : '',
      notes: payment.notes || '',
    });
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setIsSaving(true);
      const paymentData = {
        payment_type: paymentForm.payment_type,
        amount: parseFloat(paymentForm.amount),
        currency: paymentForm.currency || pricing?.currency || defaultCurrency,
        payment_method: paymentForm.payment_method || undefined,
        reference_number: paymentForm.reference_number || undefined,
        paid_at: paymentForm.paid_at ? `${paymentForm.paid_at}T00:00:00` : undefined,
        notes: paymentForm.notes || undefined,
      };

      if (editingPayment) {
        await itinerariesApi.updatePayment(itineraryId, editingPayment.id, paymentData);
        toast.success('Payment updated');
      } else {
        await itinerariesApi.createPayment(itineraryId, paymentData);
        toast.success('Payment recorded');
      }

      setIsPaymentModalOpen(false);
      fetchPricing();
    } catch (error: any) {
      toast.error('Failed to save payment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment record?')) {
      return;
    }

    try {
      await itinerariesApi.deletePayment(itineraryId, paymentId);
      toast.success('Payment deleted');
      fetchPricing();
    } catch (error: any) {
      toast.error('Failed to delete payment');
    }
  };

  const formatCurrency = (amount: number | undefined, curr?: string) => {
    if (amount === undefined || amount === null) return '-';
    const c = curr || pricing?.currency || defaultCurrency;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: c,
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-primary">Payment & Schedule</h2>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-primary">Payment & Schedule</h2>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-sm text-muted mb-1">Total Amount</div>
          <div className="text-xl font-bold text-primary">
            {formatCurrency(pricing?.total)}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-sm text-green-700 mb-1">Paid</div>
          <div className="text-xl font-bold text-green-600">
            {formatCurrency(pricing?.total_paid)}
          </div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 text-center">
          <div className="text-sm text-amber-700 mb-1">Balance Due</div>
          <div className="text-xl font-bold text-amber-600">
            {formatCurrency(pricing?.balance_due)}
          </div>
        </div>
        <div className={`rounded-lg p-4 text-center ${pricing?.advance_paid ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className={`text-sm mb-1 ${pricing?.advance_paid ? 'text-green-700' : 'text-red-700'}`}>
            Advance Status
          </div>
          <div className={`text-xl font-bold ${pricing?.advance_paid ? 'text-green-600' : 'text-red-600'}`}>
            {pricing?.advance_enabled
              ? (pricing?.advance_paid ? 'Paid' : 'Pending')
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="border-t border-border pt-6 mb-6">
        <h3 className="font-medium text-primary mb-4 flex items-center gap-2">
          <Percent className="w-4 h-4" />
          Payment Settings
        </h3>

        <div className="grid grid-cols-2 gap-6">
          {/* Discount Section */}
          <div className="space-y-4">
            <Input
              label="Discount (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              placeholder="e.g., 10"
              className="w-full"
            />
          </div>

          {/* Final Deadline */}
          <div className="space-y-4">
            <Input
              label="Final Payment Deadline"
              type="date"
              value={finalDeadline}
              onChange={(e) => setFinalDeadline(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Advance Payment Section */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="advance-enabled"
              checked={advanceEnabled}
              onChange={(e) => setAdvanceEnabled(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="advance-enabled" className="font-medium text-primary cursor-pointer">
              Require Advance Payment
            </label>
          </div>

          {advanceEnabled && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Advance Type
                </label>
                <select
                  value={advanceType}
                  onChange={(e) => setAdvanceType(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="fixed">Fixed Amount</option>
                  <option value="percent">Percentage</option>
                </select>
              </div>

              <div>
                {advanceType === 'fixed' ? (
                  <Input
                    label="Advance Amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    placeholder="e.g., 5000"
                  />
                ) : (
                  <Input
                    label="Advance Percent (%)"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={advancePercent}
                    onChange={(e) => setAdvancePercent(e.target.value)}
                    placeholder="e.g., 20"
                  />
                )}
              </div>

              <div>
                <Input
                  label="Advance Deadline"
                  type="date"
                  value={advanceDeadline}
                  onChange={(e) => setAdvanceDeadline(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={handleSavePricing} isLoading={isSaving} size="sm">
            Save Payment Settings
          </Button>
        </div>
      </div>

      {/* Payments List */}
      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-primary flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Payment Records
          </h3>
          <Button size="sm" onClick={handleAddPayment}>
            <Plus className="w-4 h-4 mr-1" />
            Record Payment
          </Button>
        </div>

        {(!pricing?.payments || pricing.payments.length === 0) ? (
          <div className="text-center py-8 text-muted border border-dashed border-border rounded-lg">
            No payments recorded yet. Click "Record Payment" to add one.
          </div>
        ) : (
          <div className="space-y-3">
            {pricing.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded font-medium ${
                      payment.payment_type === 'advance' ? 'bg-blue-100 text-blue-700' :
                      payment.payment_type === 'final' ? 'bg-green-100 text-green-700' :
                      payment.payment_type === 'full' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {PAYMENT_TYPES.find(t => t.value === payment.payment_type)?.label || payment.payment_type}
                    </span>
                    <span className="font-bold text-primary">
                      {formatCurrency(payment.amount, payment.currency)}
                    </span>
                    {payment.payment_method && (
                      <span className="text-sm text-muted">
                        via {PAYMENT_METHODS.find(m => m.value === payment.payment_method)?.label || payment.payment_method}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted">
                    {payment.paid_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(payment.paid_at)}
                      </span>
                    )}
                    {payment.reference_number && (
                      <span>Ref: {payment.reference_number}</span>
                    )}
                    {payment.notes && (
                      <span className="truncate max-w-xs">{payment.notes}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditPayment(payment)}
                    className="p-2 text-muted hover:text-primary-600 hover:bg-primary-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePayment(payment.id)}
                    className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={editingPayment ? 'Edit Payment' : 'Record Payment'}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Payment Type
              </label>
              <select
                value={paymentForm.payment_type}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_type: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {PAYMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Amount"
              type="number"
              min="0"
              step="0.01"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              placeholder="Enter amount"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Payment Method
              </label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select method</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Payment Date"
              type="date"
              value={paymentForm.paid_at}
              onChange={(e) => setPaymentForm({ ...paymentForm, paid_at: e.target.value })}
            />
          </div>

          <Input
            label="Reference Number"
            value={paymentForm.reference_number}
            onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
            placeholder="e.g., UTR, Transaction ID"
          />

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Notes
            </label>
            <textarea
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePayment} isLoading={isSaving}>
              {editingPayment ? 'Update' : 'Save'} Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentSection;
