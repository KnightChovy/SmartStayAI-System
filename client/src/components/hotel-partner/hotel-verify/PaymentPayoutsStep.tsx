import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Lock, Info, Landmark } from 'lucide-react';

export function PaymentPayoutsStep({ onBack, onContinue }: { onBack?: () => void, onContinue?: () => void }) {
  const [accountHolder, setAccountHolder] = useState('Global Stay');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');

  const displayAccountNumber = accountNumber.length >= 4 
    ? `•••• •••• ${accountNumber.slice(-4)}` 
    : '•••• •••• 0000';
  const displayBankName = bankName || 'Pending';

  return (
    <div className="w-full bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] mt-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment & Payouts</h2>
        <p className="text-slate-600">
          Configure how you'll receive funds and manage billing information.
        </p>
      </div>

      {/* Security Banner */}
      <div className="bg-[#eff6ff] border border-blue-100 rounded-xl p-4 flex gap-3 mb-8">
        <div className="mt-0.5 shrink-0">
          <Lock className="w-5 h-5 text-blue-600" fill="currentColor" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-1">Secure Financial Information</h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            All payment data is encrypted using AES-256 and stored in compliance with PCI-DSS standards. Your banking details are strictly confidential.
          </p>
        </div>
      </div>

      <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); onContinue?.(); }}>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Bank Account Details Card */}
            <div className="border border-slate-200 rounded-xl p-6 shadow-sm bg-white">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Bank Account Details</h3>
              
              <div className="bg-slate-50 border-l-4 border-blue-600 rounded-r-lg p-3 flex gap-2.5 mb-6">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700">Account holder name should match the hotel business owner or legal representative.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Account Holder Name</Label>
                  <Input 
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Global Stay" 
                    className="h-11 border-slate-200" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Select onValueChange={setBankName} required>
                    <SelectTrigger className="h-11 border-slate-200 text-slate-700">
                      <SelectValue placeholder="Select a bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vietcombank">Vietcombank</SelectItem>
                      <SelectItem value="Techcombank">Techcombank</SelectItem>
                      <SelectItem value="MB Bank">MB Bank</SelectItem>
                      <SelectItem value="ACB">ACB</SelectItem>
                      <SelectItem value="BIDV">BIDV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input 
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="0000 0000 0000" 
                    className="h-11 border-slate-200" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bank Branch</Label>
                  <Input placeholder="Branch name or code" className="h-11 border-slate-200" required />
                </div>
                <div className="space-y-2 md:col-span-2 relative">
                  <div className="flex justify-between items-center">
                    <Label>Swift Code</Label>
                    <span className="text-xs text-slate-500">(Optional)</span>
                  </div>
                  <Input placeholder="8 or 11 characters" className="h-11 border-slate-200" />
                </div>
              </div>
            </div>

            {/* Tax Invoice Info Card */}
            <div className="border border-slate-200 rounded-xl p-6 shadow-sm bg-white">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-slate-900">Tax Invoice Info</h3>
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">Optional</span>
              </div>
              <p className="text-sm text-slate-500 mb-6">Provide tax details if you require formal invoices for platform fees.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Tax ID / VAT Number</Label>
                  <Input placeholder="e.g. US123456789" className="h-11 border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label>Registered Business Address</Label>
                  <Input placeholder="Full legal address" className="h-11 border-slate-200" />
                </div>
              </div>
            </div>

          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Payout Account Preview</h4>
            {/* ATM Card Design */}
            <div className="w-full aspect-[1.586/1] mx-auto bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xl text-white border border-slate-700/50 relative overflow-hidden flex flex-col justify-between group transform transition-transform hover:scale-[1.02] duration-300">
              {/* Decorative faint patterns */}
              <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/5 rounded-full blur-2xl sm:blur-3xl -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>
              <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-blue-500/10 rounded-full blur-xl sm:blur-2xl -ml-8 sm:-ml-10 -mb-8 sm:-mb-10 pointer-events-none"></div>

              {/* Top Row: Bank Name & Contactless */}
              <div className="relative z-10 flex justify-between items-start">
                <div className="font-bold text-[11px] sm:text-sm tracking-wide text-slate-100 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                  <span className="truncate max-w-[120px] sm:max-w-[150px]">{displayBankName}</span>
                </div>
                {/* Contactless Icon (Mock) */}
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 21.3C5.4 18 4 13.5 4.5 9.1" />
                  <path d="M13 21.8C9.5 17.5 8 11.5 9 6" />
                  <path d="M17.5 22.3C13.6 17 12 10.5 13.5 4.5" />
                  <path d="M22 22.8C18 16 16.5 9 18 3" />
                </svg>
              </div>

              {/* Middle: Chip & Card Number */}
              <div className="relative z-10 space-y-1.5 sm:space-y-2.5">
                {/* EMV Chip */}
                <div className="w-7 h-5 sm:w-9 sm:h-6 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 rounded-[3px] border border-yellow-500/50 opacity-90 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_20%,rgba(0,0,0,0.1)_20%,rgba(0,0,0,0.1)_25%,transparent_25%,transparent_75%,rgba(0,0,0,0.1)_75%,rgba(0,0,0,0.1)_80%,transparent_80%)]"></div>
                  <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_40%,rgba(0,0,0,0.1)_40%,rgba(0,0,0,0.1)_60%,transparent_60%)]"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 sm:w-5 h-2.5 sm:h-3 border border-black/10 rounded-[1px]"></div>
                </div>
                
                {/* Account Number */}
                <p className="text-xs sm:text-sm md:text-base font-mono tracking-widest text-slate-100 drop-shadow-sm font-semibold truncate">
                  {displayAccountNumber}
                </p>
              </div>

              {/* Bottom Row: Cardholder & Brand */}
              <div className="relative z-10 flex justify-between items-end">
                <div className="space-y-0.5">
                  <p className="text-[7px] sm:text-[8px] text-slate-400 uppercase tracking-widest font-semibold">Account Holder</p>
                  <p className="text-[10px] sm:text-xs font-semibold tracking-wider text-slate-100 truncate max-w-[120px] sm:max-w-[160px] uppercase">
                    {accountHolder || 'YOUR NAME'}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 sm:mb-1">Primary</span>
                  {/* Master/Visa style mock circles */}
                  <div className="flex -space-x-1.5">
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-red-500/80 mix-blend-screen"></div>
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-yellow-500/80 mix-blend-screen"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-8">
          <Button type="button" variant="outline" onClick={onBack} className="h-11 px-6 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex items-center gap-4">
            <Button type="button" variant="outline" className="h-11 px-6 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer hidden md:flex">
              Save Draft
            </Button>
            <Button type="submit" className="h-11 px-8 bg-role-partner-primary hover:bg-role-partner-secondary text-white cursor-pointer">
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

      </form>
    </div>
  );
}
