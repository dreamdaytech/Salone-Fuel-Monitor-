import React from 'react';
import { ExternalLink, MessageCircle } from 'lucide-react';

const socialLinks = [
  {
    label: 'Facebook',
    shortLabel: 'FB',
    href: 'https://www.facebook.com/salonefuelmonitor/',
    description: 'Follow our latest fuel updates, articles and announcements.',
  },
  {
    label: 'TikTok',
    shortLabel: 'TT',
    href: 'https://www.tiktok.com/@salonefuelmonitor',
    description: 'Watch short fuel-price updates, explainers and platform highlights.',
  },
  {
    label: 'WhatsApp Channel',
    shortLabel: 'WA',
    href: 'https://whatsapp.com/channel/0029Vb9SnPdJuyAEbHMPcy2x',
    description: 'Join our channel for direct Salone Fuel Monitor updates.',
  },
];

export default function ContactSocialLinks() {
  return (
    <section className="bg-white border-t border-gray-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-primary mb-4">
            <MessageCircle className="h-4 w-4" />
            Follow Salone Fuel Monitor
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 tracking-tight">
            Stay connected with us
          </h2>
          <p className="mt-4 text-gray-500 text-base sm:text-lg">
            Follow our official social channels for fuel-price updates, market information, platform news and public announcements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Follow Salone Fuel Monitor on ${social.label}`}
              className="group rounded-2xl border border-gray-100 bg-surface-50 p-5 transition-all hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-extrabold text-white shadow-sm">
                  {social.shortLabel}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-surface-900 group-hover:text-primary transition-colors">
                      {social.label}
                    </h3>
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    {social.description}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
