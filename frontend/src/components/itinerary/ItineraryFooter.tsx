import React, { useState } from 'react';
import { Mail, Phone, Globe, Building2, Sparkles, Shield } from 'lucide-react';

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
  total?: number | null;
  currency?: string;
}

interface ItineraryFooterProps {
  companyProfile?: CompanyProfile | null;
  pricing?: Pricing | null;
  totalPrice?: number | null;
  baseUrl: string;
  priceCurrency?: string;
}

const ItineraryFooter: React.FC<ItineraryFooterProps> = ({
  companyProfile,
  pricing,
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
                <Building2 className="w-8 h-8 text-slate-400" />
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
                <Mail className="w-5 h-5 text-slate-400" />
                <span className="text-sm">{companyProfile.email}</span>
              </a>
            )}
            {companyProfile?.phone && (
              <a
                href={`tel:${companyProfile.phone}`}
                className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
              >
                <Phone className="w-5 h-5 text-slate-400" />
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
                <Globe className="w-5 h-5 text-slate-400" />
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
            </div>

            {/* Total */}
            <div className="border-t border-slate-200 pt-4 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-slate-900 font-bold">Total</span>
                <span className="text-2xl font-bold text-amber-500">
                  {formatPrice(pricing.total || totalPrice, pricing.currency)}
                </span>
              </div>
            </div>

            {/* Discount Code */}
            <div>
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
              <h4 className="text-xl font-bold text-white mb-2">Ready to Confirm?</h4>
              <p className="text-slate-300 text-sm max-w-md mb-3">
                Scan the QR code to complete your payment securely. Your booking will be confirmed
                instantly.
              </p>
              {companyProfile.payment_note && (
                <div className="flex items-center gap-2 text-emerald-400 text-xs">
                  <Shield className="w-4 h-4" />
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
              <p className="text-sm font-medium text-amber-500 mt-2">
                Scan to Pay {formatPrice(pricing?.total || totalPrice, pricing?.currency)}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ItineraryFooter;
