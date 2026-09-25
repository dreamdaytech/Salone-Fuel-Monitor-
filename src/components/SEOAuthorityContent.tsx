import { Link, useLocation } from 'react-router-dom';
import { getAuthorityContent } from '../../seo-content.js';
import { getPhase3SeoForPath } from '../../seo-phase3-routes.js';

type AuthoritySection = {
  heading: string;
  paragraphs: string[];
};

type AuthorityFaq = {
  question: string;
  answer: string;
};

type AuthorityContent = {
  eyebrow?: string;
  sections?: AuthoritySection[];
  faqs?: AuthorityFaq[];
  relatedLinks?: Array<[string, string]>;
  sources?: Array<[string, string]>;
};

export default function SEOAuthorityContent() {
  const location = useLocation();
  const phase3Meta = getPhase3SeoForPath(location.pathname) as { authority?: AuthorityContent } | null;
  const content = (getAuthorityContent(location.pathname) as AuthorityContent | null) || phase3Meta?.authority || null;

  if (!content) return null;

  return (
    <section
      aria-label="Fuel information and search guide"
      className="border-t border-slate-200 bg-white"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {content.eyebrow && (
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {content.eyebrow}
            </p>
          )}
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Fuel price information you can understand and verify
          </h2>
        </div>

        {content.sections && content.sections.length > 0 && (
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {content.sections.map((section) => (
              <article key={section.heading} className="rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{section.heading}</h3>
                <div className="mt-3 space-y-3 text-[15px] leading-7 text-slate-700">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}

        {content.faqs && content.faqs.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-slate-900">Frequently asked questions</h2>
            <div className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50 px-5">
              {content.faqs.map((faq) => (
                <details key={faq.question} className="group py-4">
                  <summary className="cursor-pointer list-none font-medium text-slate-900 marker:hidden">
                    <span className="flex items-center justify-between gap-4">
                      {faq.question}
                      <span aria-hidden="true" className="text-xl text-slate-500 transition-transform group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {content.relatedLinks && content.relatedLinks.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Related fuel information</h2>
              <ul className="mt-3 space-y-2">
                {content.relatedLinks.map(([href, label]) => (
                  <li key={href}>
                    <Link className="font-medium text-primary hover:underline" to={href}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {content.sources && content.sources.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Official source reference</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                For primary regulatory announcements and official petroleum information, consult the original source alongside Salone Fuel Monitor.
              </p>
              <ul className="mt-3 space-y-2">
                {content.sources.map(([href, label]) => (
                  <li key={href}>
                    <a
                      className="font-medium text-primary hover:underline"
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
