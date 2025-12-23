import React, { useState } from 'react';
import { Mail, Phone, Globe, Building2, Sparkles, Shield, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

export interface CompanyProfile {
  company_name?: string | null;
  tagline?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
  payment_qr_url?: string | null;
  payment_note?: string | null;
}

export interface Pricing {
  base_package?: number | null;
  taxes_fees?: number | null;
  discount_code?: string | null;
  discount_amount?: number | null;
  discount_percent?: number | null;
  total?: number | null;
  currency?: string;
  advance_enabled?: boolean;
  advance_type?: string | null;
  advance_amount?: number | null;
  advance_percent?: number | null;
  advance_deadline?: string | null;
  final_deadline?: string | null;
}

export interface PaymentRecord {
  id: string;
  payment_type: string;
  amount: number;
  currency: string;
  paid_at?: string | null;
}

export interface PaymentSummary {
  total_amount: number;
  total_paid: number;
  balance_due: number;
  currency: string;
  advance_required?: number | null;
  advance_paid: boolean;
  advance_deadline?: string | null;
  final_deadline?: string | null;
  payments: PaymentRecord[];
}

interface ItineraryFooterProps {
  companyProfile?: CompanyProfile | null;
  pricing?: Pricing | null;
  paymentSummary?: PaymentSummary | null;
  totalPrice?: number | null;
  baseUrl: string;
  priceCurrency?: string;
}

const ItineraryFooter: React.FC<ItineraryFooterProps> = ({
  companyProfile,
  pricing,
  paymentSummary,
  totalPrice,
  baseUrl,
  priceCurrency,
}) => {
  const [discountCode, setDiscountCode] = useState('');

  const formatPrice = (amount?: number | null, currency?: string) => {
    const value = amount ?? 0;
    const curr = currency || pricing?.currency || priceCurrency || 'USD';
    return `${curr} ${value.toLocaleString()}`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Use payment summary if available, otherwise fall back to pricing
  const displayTotal = paymentSummary?.total_amount ?? pricing?.total ?? totalPrice;
  const displayPaid = paymentSummary?.total_paid ?? 0;
  const displayBalance = paymentSummary?.balance_due ?? displayTotal ?? 0;
  const hasPayments = paymentSummary && paymentSummary.payments.length > 0;
  const qrAmount = displayBalance > 0 ? displayBalance : displayTotal ?? 0;
  const qrCurrency = paymentSummary?.currency || pricing?.currency || priceCurrency;

  return (
    <section className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-3xl p-8 md:p-10">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        {/* Left Column - Company Info */}
        <div>
          <div className="flex items-center gap-4 mb-4">
            {companyProfile?.logo_url ? (
              <img
                src={`${baseUrl}${companyProfile.logo_url}`}
                alt={companyProfile.company_name || 'Company'}
                className="w-16 h-16 rounded-xl object-cover bg-slate-700"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center">
                <Building2 className="w-9 h-9 text-slate-400" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-white">
                {companyProfile?.company_name || 'Travel Agency'}
              </h3>
              {companyProfile?.tagline && (
                <p className="text-amber-400 text-sm">{companyProfile.tagline}</p>
              )}
            </div>
          </div>

          {companyProfile?.description && (
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              {companyProfile.description}
            </p>
          )}

          {/* Contact Info */}
          <div className="space-y-3">
            {companyProfile?.email && (
              <a
                href={`mailto:${companyProfile.email}`}
                className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
              >
                <Mail className="w-5 h-5 text-slate-300" />
                <span className="text-sm">{companyProfile.email}</span>
              </a>
            )}
            {companyProfile?.phone && (
              <a
                href={`tel:${companyProfile.phone}`}
                className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
              >
                <Phone className="w-5 h-5 text-slate-300" />
                <span className="text-sm">{companyProfile.phone}</span>
              </a>
            )}
            {companyProfile?.website_url && (
              <a
                href={companyProfile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
              >
                <Globe className="w-5 h-5 text-slate-300" />
                <span className="text-sm">{companyProfile.website_url}</span>
              </a>
            )}
          </div>
        </div>

        {/* Right Column - Price Summary */}
        {pricing && (
          <div className="bg-white rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h4 className="font-bold text-slate-900">Price Summary</h4>
            </div>

            <div className="space-y-3 mb-4">
              {pricing.base_package !== undefined && pricing.base_package !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Base Package</span>
                  <span className="text-slate-900 font-medium">
                    {formatPrice(pricing.base_package, pricing.currency)}
                  </span>
                </div>
              )}
              {pricing.taxes_fees !== undefined && pricing.taxes_fees !== null && pricing.taxes_fees > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Taxes & Fees</span>
                  <span className="text-slate-900 font-medium">
                    {formatPrice(pricing.taxes_fees, pricing.currency)}
                  </span>
                </div>
              )}
              {pricing.discount_amount !== undefined && pricing.discount_amount !== null && pricing.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Discount</span>
                  <span className="text-emerald-600 font-medium">
                    -{formatPrice(pricing.discount_amount, pricing.currency)}
                  </span>
                </div>
              )}
              {pricing.discount_percent !== undefined && pricing.discount_percent !== null && pricing.discount_percent > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Discount ({pricing.discount_percent}%)</span>
                  <span className="text-emerald-600 font-medium">Applied</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t border-slate-200 pt-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-900 font-bold">Total</span>
                <span className="text-2xl font-bold text-amber-500">
                  {formatPrice(displayTotal, pricing.currency)}
                </span>
              </div>
            </div>

            {/* Payment Status Section */}
            {paymentSummary && (displayPaid > 0 || pricing.advance_enabled) && (
              <div className="border-t border-slate-200 pt-4 mb-4 space-y-3">
                {/* Amount Paid */}
                {displayPaid > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Paid
                    </span>
                    <span className="text-emerald-600 font-medium">
                      {formatPrice(displayPaid, paymentSummary.currency)}
                    </span>
                  </div>
                )}

                {/* Balance Due */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-900 font-bold">Balance Due</span>
                  <span className={`text-xl font-bold ${displayBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {formatPrice(displayBalance, paymentSummary.currency)}
                  </span>
                </div>

                {/* Advance Payment Status */}
                {pricing.advance_enabled && paymentSummary.advance_required && (
                  <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                    paymentSummary.advance_paid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {paymentSummary.advance_paid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Advance payment received</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        <span>Advance required: {formatPrice(paymentSummary.advance_required, paymentSummary.currency)}</span>
                      </>
                    )}
                  </div>
                )}

                {/* Payment Deadlines */}
                {(paymentSummary.advance_deadline || paymentSummary.final_deadline) && (
                  <div className="space-y-2 text-sm">
                    {paymentSummary.advance_deadline && !paymentSummary.advance_paid && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>Advance due: {formatDate(paymentSummary.advance_deadline)}</span>
                      </div>
                    )}
                    {paymentSummary.final_deadline && displayBalance > 0 && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>Final payment due: {formatDate(paymentSummary.final_deadline)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Records - inline pills below balance */}
                {hasPayments && (
                  <div className="space-y-2 text-sm">
                    {[...paymentSummary!.payments]
                      .sort((a, b) => {
                        const da = a.paid_at ? new Date(a.paid_at).getTime() : 0;
                        const db = b.paid_at ? new Date(b.paid_at).getTime() : 0;
                        return db - da;
                      })
                      .map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-3 bg-emerald-50 text-emerald-700 rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-500 text-lg leading-none">•</span>
                            <span className="capitalize">{p.payment_type}</span>
                            {p.paid_at && <span className="text-emerald-600">· {formatDate(p.paid_at)}</span>}
                          </div>
                          <span className="font-semibold">
                            {formatPrice(p.amount, p.currency || paymentSummary?.currency)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Discount Code */}
            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-600 mb-2">Have a discount code?</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Section */}
      {companyProfile?.payment_qr_url && (
        <div className="mt-8 pt-8 border-t border-slate-700">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                Ready to Confirm?
              </h4>
              <p className="text-slate-300 text-sm max-w-md mb-3">
                Scan the QR code to complete your payment securely. Your booking will be confirmed
                instantly.
              </p>
              {companyProfile.payment_note && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <Shield className="w-5 h-5" />
                  <span>{companyProfile.payment_note}</span>
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <img
                src={`${baseUrl}${companyProfile.payment_qr_url}`}
                alt="Payment QR"
                className="w-32 h-32 md:w-40 md:h-40"
              />
              {displayBalance > 0 ? (
                <p className="text-sm font-medium text-amber-500 mt-2">
                  Scan to Pay {formatPrice(qrAmount, qrCurrency)}
                </p>
              ) : (
                <p className="text-sm font-semibold text-emerald-600 mt-2">Payment completed</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ItineraryFooter;
