import { BadgeCheck, CalendarCheck, Wallet } from "lucide-react";

export function VerificationBenefitsCard() {
  const benefits = [
    {
      icon: <BadgeCheck className="w-5 h-5 text-role-partner-primary" />,
      title: "Build guest trust",
      description: "Verified properties receive 3x more views and higher conversion rates."
    },
    {
      icon: <CalendarCheck className="w-5 h-5 text-role-partner-primary" />,
      title: "Receive bookings",
      description: "Your calendar becomes active for guests to book immediately."
    },
    {
      icon: <Wallet className="w-5 h-5 text-role-partner-primary" />,
      title: "Enable payouts",
      description: "Link your bank account securely to receive automated weekly transfers."
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full">
      <h2 className="text-lg font-bold text-slate-900 mb-5">Verification Benefits</h2>
      
      <div className="space-y-4">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex gap-4 items-start">
            <div className="shrink-0 w-10 h-10 rounded-full bg-role-partner-light flex items-center justify-center mt-0.5">
              {benefit.icon}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-0.5 text-sm">{benefit.title}</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
