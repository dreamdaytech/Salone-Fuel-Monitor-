import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Database, ExternalLink, FileCheck2, Globe2, ShieldCheck } from 'lucide-react';

const sections = [
  {
    icon: FileCheck2,
    title: 'Official national fuel-price source',
    body: 'For Sierra Leone national pump-price context, Salone Fuel Monitor references public petroleum-pricing information from the National Petroleum Regulatory Authority (NPRA). We present that information in a format designed for public access, historical comparison and analysis. Salone Fuel Monitor does not replace the original regulator, and users who require the primary regulatory announcement should consult the original NPRA publication.'
  },
  {
    icon: CalendarDays,
    title: 'Effective date is the authoritative timeline',
    body: 'Fuel prices can change more than once within the same calendar month. Salone Fuel Monitor therefore uses the effective date of a price record as the authoritative timeline field. Month and year labels are useful for display and grouping, but they do not collapse multiple valid price events into one monthly record.'
  },
  {
    icon: Database,
    title: 'Blank, null and zero fuel values',
    body: 'Petrol, diesel and kerosene are handled independently. A blank, null or zero value means no confirmed price was recorded for that fuel on that effective date. It is not treated as an NLe 0 pump price, and the platform does not automatically carry the previous value forward and present it as newly announced.'
  },
  {
    icon: Globe2,
    title: 'Regional and global comparisons',
    body: 'Regional comparisons place selected West African fuel prices on a common per-litre and currency basis where possible. Data dates, exchange rates, taxes, subsidies and local pricing systems can differ, so regional rankings should be interpreted as price comparisons rather than complete measures of affordability. Global crude-oil comparisons are contextual and do not imply a one-to-one relationship between crude prices and Sierra Leone pump prices.'
  }
];

export default function DataMethodology() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-slate-950 via-[#005aa0] to-[#1EB53A] text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-blue-50">
              <ShieldCheck className="h-4 w-4" /> Transparency behind the data
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">Fuel Data Sources and Methodology</h1>
            <p className="mt-5 text-lg leading-8 text-blue-50">
              How Salone Fuel Monitor handles official Sierra Leone pump prices, effective dates, missing values, historical records, regional comparisons and corrections.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <h2 className="text-2xl font-bold text-slate-950">Our approach to fuel-price transparency</h2>
          <div className="mt-5 space-y-4 leading-7 text-slate-700">
            <p>
              Salone Fuel Monitor is designed to make fuel-price information easier to find and understand without hiding how the data is handled. The platform combines official national pump-price context with historical records, station information, transport fares, regional comparisons and global market indicators.
            </p>
            <p>
              Every data type has limitations. A national pump price is different from station availability, a regional ranking depends on the date and currency basis used, and a global crude-oil benchmark is only one part of the local pricing environment. We therefore keep the methodology visible so users can interpret the platform responsibly.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          {sections.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-slate-950">{title}</h2>
              <p className="mt-3 leading-7 text-slate-700">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <h2 className="text-2xl font-bold text-slate-950">How the dedicated fuel pages choose the latest price</h2>
          <div className="mt-5 space-y-4 leading-7 text-slate-700">
            <p>
              The petrol, diesel and kerosene pages do not assume that the newest fuel-price document contains a valid value for every fuel. Instead, each page searches the effective-date timeline for the most recent confirmed positive value for that specific fuel.
            </p>
            <p>
              This prevents a newer record with a blank kerosene field, for example, from replacing the latest confirmed kerosene price with a false zero. It also means the effective date shown for petrol, diesel and kerosene can legitimately differ when the source records do not update all fuels together.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link to="/petrol-price-sierra-leone" className="group rounded-2xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/40">
              <p className="font-bold text-slate-950">Petrol price</p>
              <p className="mt-1 text-sm text-slate-500">Latest confirmed PMS value</p>
              <ArrowRight className="mt-3 h-4 w-4 text-blue-600 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/diesel-price-sierra-leone" className="group rounded-2xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/40">
              <p className="font-bold text-slate-950">Diesel price</p>
              <p className="mt-1 text-sm text-slate-500">Latest confirmed AGO value</p>
              <ArrowRight className="mt-3 h-4 w-4 text-blue-600 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/kerosene-price-sierra-leone" className="group rounded-2xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/40">
              <p className="font-bold text-slate-950">Kerosene price</p>
              <p className="mt-1 text-sm text-slate-500">Latest confirmed DPK value</p>
              <ArrowRight className="mt-3 h-4 w-4 text-blue-600 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Corrections and updates</h2>
            <p className="mt-3 leading-7 text-slate-700">
              If a historical record is corrected, the goal is to preserve the original effective date rather than manufacture a new price event. If you believe a price, station record or other item is incorrect, contact Salone Fuel Monitor with the affected page and any supporting source.
            </p>
            <Link to="/contact" className="mt-5 inline-flex items-center gap-2 font-bold text-blue-700 hover:underline">
              Report a correction <ArrowRight className="h-4 w-4" />
            </Link>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Primary source reference</h2>
            <p className="mt-3 leading-7 text-slate-700">
              For official petroleum-pricing announcements and regulatory information, consult the National Petroleum Regulatory Authority alongside Salone Fuel Monitor.
            </p>
            <a href="https://pra.gov.sl/" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 font-bold text-blue-700 hover:underline">
              Visit NPRA <ExternalLink className="h-4 w-4" />
            </a>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-blue-100 bg-blue-50 p-6 text-sm leading-6 text-blue-950">
          <strong>Important:</strong> Salone Fuel Monitor is an information and transparency platform. Regulatory announcements, legal requirements and official pricing decisions should always be verified against the relevant primary authority when used for formal decision-making.
        </section>
      </div>
    </div>
  );
}
