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
            
            <div className="bg-gradient-to-br from-[#1a2332] to-[#0f172a] rounded-xl p-6 shadow-lg text-white border border-slate-800 relative overflow-hidden">
              {/* Decorative faint pattern/glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <Landmark className="w-8 h-8 text-slate-300" />
                  <span className="text-[10px] font-bold uppercase bg-white/20 px-2 py-1.5 rounded-md text-white border border-white/10">Primary</span>
                </div>
                
                <div className="space-y-1 mb-10">
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider">Account Holder</p>
                  <p className="text-lg font-bold truncate text-white">{accountHolder || 'Not provided'}</p>
                </div>

                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider">Account Ending In</p>
                    <p className="text-sm font-semibold tracking-widest text-slate-200">{displayAccountNumber}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider">Bank</p>
                    <p className="text-sm font-semibold truncate max-w-[80px] text-slate-200">{displayBankName}</p>
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
