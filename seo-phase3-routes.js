export const PHASE3_ROUTE_SEO = {
  '/petrol-price-sierra-leone': {
    title: 'Petrol Price in Sierra Leone Today | Salone Fuel Monitor',
    description: 'Check the latest available official petrol price in Sierra Leone, its effective date, recent history and related fuel-market context.',
    heading: 'Petrol Price in Sierra Leone Today',
    intro: 'Check the latest available official petrol (PMS) pump price in Sierra Leone together with the effective date of the price record. Use this page to move from the current petrol price to recent historical changes, fuel stations, regional comparisons and the methodology behind Salone Fuel Monitor data.',
    schemaType: 'WebPage',
    changefreq: 'daily',
    priority: '0.95',
    index: true,
    authority: {
      eyebrow: 'Sierra Leone petrol price guide',
      sections: [
        {
          heading: 'How to read the current petrol price',
          paragraphs: [
            'Salone Fuel Monitor treats the effective date as the authoritative date for a national petrol-price record. The latest displayed petrol price is therefore the most recent confirmed positive petrol value in the official price timeline, not simply the newest document when that document contains no petrol value.',
            'This matters when different fuels are updated independently. A record can contain a new diesel or kerosene price while petrol is blank. In that case, the petrol page continues to identify the latest confirmed petrol price and shows the date on which that petrol value became effective.'
          ]
        },
        {
          heading: 'Petrol price history and market context',
          paragraphs: [
            'The current price is only one point in Sierra Leone’s fuel-price history. The historical trend page preserves each effective-date record so users can see when petrol rose, fell or remained unchanged across successive official price events.',
            'For wider context, users can compare Sierra Leone with selected West African markets and review global crude-oil movements. These comparisons help explain the market environment without implying that changes in international oil prices automatically produce the same change at the pump.'
          ]
        }
      ],
      faqs: [
        { question: 'What is the petrol price in Sierra Leone today?', answer: 'This page displays the latest available confirmed petrol price in the Salone Fuel Monitor official price timeline and shows its effective date. Always read the amount together with that date.' },
        { question: 'What does PMS mean?', answer: 'PMS is a common petroleum-industry abbreviation for Premium Motor Spirit, the product generally referred to as petrol or gasoline.' },
        { question: 'Why can the petrol effective date differ from diesel?', answer: 'Salone Fuel Monitor treats each fuel independently. If an official price record does not contain a confirmed petrol value, that missing value is not treated as a new petrol price.' }
      ],
      relatedLinks: [
        ['/price-trends', 'View Sierra Leone fuel price history'],
        ['/diesel-price-sierra-leone', 'Check the latest diesel price'],
        ['/kerosene-price-sierra-leone', 'Check the latest kerosene price'],
        ['/stations', 'Find fuel stations in Sierra Leone'],
        ['/data-methodology', 'Read data sources and methodology']
      ],
      sources: [['https://pra.gov.sl/', 'National Petroleum Regulatory Authority (NPRA)']]
    }
  },
  '/diesel-price-sierra-leone': {
    title: 'Diesel Price in Sierra Leone Today | Salone Fuel Monitor',
    description: 'Check the latest available official diesel price in Sierra Leone, its effective date, recent history and regional fuel-price context.',
    heading: 'Diesel Price in Sierra Leone Today',
    intro: 'Check the latest available official diesel (AGO) pump price in Sierra Leone and the effective date attached to that confirmed value. The page connects the current diesel price with historical changes, regional comparisons, transport-cost context and Salone Fuel Monitor methodology.',
    schemaType: 'WebPage',
    changefreq: 'daily',
    priority: '0.95',
    index: true,
    authority: {
      eyebrow: 'Sierra Leone diesel price guide',
      sections: [
        {
          heading: 'Latest confirmed diesel price by effective date',
          paragraphs: [
            'Diesel is used across transport, logistics, commercial operations and electricity generation, so changes in the official pump price can have broad cost implications. Salone Fuel Monitor displays the latest confirmed positive diesel value in the official price timeline together with its effective date.',
            'A blank or zero diesel entry is treated as no diesel price recorded for that price event. It is not interpreted as free fuel and it does not replace the most recent confirmed diesel price on this dedicated page.'
          ]
        },
        {
          heading: 'Use diesel history to understand changes',
          paragraphs: [
            'Recent diesel-price records help users distinguish a one-off announcement from a wider trend. The Fuel Price History page provides the full effective-date sequence for petrol, diesel and kerosene, while the transport-fare and market-intelligence pages provide additional context for how fuel-cost changes can affect businesses and mobility.',
            'Regional comparisons can also show how Sierra Leone diesel prices sit alongside selected West African markets. Those comparisons should be read with their dates, exchange-rate assumptions and country-specific pricing systems in mind.'
          ]
        }
      ],
      faqs: [
        { question: 'What is the diesel price in Sierra Leone today?', answer: 'This page displays the latest available confirmed diesel price in the Salone Fuel Monitor official price timeline, together with the date on which that price became effective.' },
        { question: 'What does AGO mean?', answer: 'AGO commonly refers to Automotive Gas Oil, the petroleum product generally called diesel.' },
        { question: 'Does a blank diesel value mean NLe 0?', answer: 'No. A blank, null or zero entry is treated as no confirmed diesel price for that specific effective-date record and is not presented as an NLe 0 pump price.' }
      ],
      relatedLinks: [
        ['/price-trends', 'View Sierra Leone diesel price history'],
        ['/petrol-price-sierra-leone', 'Check the latest petrol price'],
        ['/transport-prices', 'Review transport fares in Sierra Leone'],
        ['/regional-comparison', 'Compare West Africa fuel prices'],
        ['/data-methodology', 'Read data sources and methodology']
      ],
      sources: [['https://pra.gov.sl/', 'National Petroleum Regulatory Authority (NPRA)']]
    }
  },
  '/kerosene-price-sierra-leone': {
    title: 'Kerosene Price in Sierra Leone | Salone Fuel Monitor',
    description: 'Check the latest available kerosene price in Sierra Leone, its effective date and historical fuel-price records from Salone Fuel Monitor.',
    heading: 'Kerosene Price in Sierra Leone',
    intro: 'Check the latest available confirmed kerosene (DPK) price in Sierra Leone and the effective date associated with that value. When a newer fuel-price event contains no kerosene value, Salone Fuel Monitor does not turn the missing entry into an NLe 0 price or falsely label it as a new kerosene announcement.',
    schemaType: 'WebPage',
    changefreq: 'daily',
    priority: '0.9',
    index: true,
    authority: {
      eyebrow: 'Sierra Leone kerosene price guide',
      sections: [
        {
          heading: 'How missing kerosene prices are handled',
          paragraphs: [
            'Kerosene may not be included in every fuel-price event. Salone Fuel Monitor treats each fuel independently, so a blank, null or zero kerosene field means that no confirmed kerosene price was entered for that effective date.',
            'The dedicated kerosene page therefore looks back through the effective-date timeline for the latest confirmed positive kerosene value. Historical charts also avoid plotting a missing kerosene entry as a real zero-price event.'
          ]
        },
        {
          heading: 'Follow kerosene changes over time',
          paragraphs: [
            'The Fuel Price History page provides the broader timeline for kerosene alongside petrol and diesel. This allows users to compare how the fuels move over time without assuming that all three are updated on exactly the same dates.',
            'For transparency, every displayed amount should be read together with its effective date and, where relevant, the original regulatory announcement.'
          ]
        }
      ],
      faqs: [
        { question: 'What is the latest kerosene price in Sierra Leone?', answer: 'This page displays the most recent confirmed positive kerosene value available in the Salone Fuel Monitor official price timeline and shows its effective date.' },
        { question: 'What does DPK mean?', answer: 'DPK commonly refers to Dual Purpose Kerosene, the kerosene product used in the fuel-price records.' },
        { question: 'Why might kerosene have an older effective date than petrol or diesel?', answer: 'A newer official fuel-price record may contain no confirmed kerosene value. Salone Fuel Monitor does not invent a replacement value, so the latest confirmed kerosene record can have an earlier effective date.' }
      ],
      relatedLinks: [
        ['/price-trends', 'View Sierra Leone kerosene price history'],
        ['/petrol-price-sierra-leone', 'Check the latest petrol price'],
        ['/diesel-price-sierra-leone', 'Check the latest diesel price'],
        ['/data-methodology', 'Read data sources and methodology']
      ],
      sources: [['https://pra.gov.sl/', 'National Petroleum Regulatory Authority (NPRA)']]
    }
  },
  '/my-garage': {
    title: 'My Garage | Vehicle & Fuel Tracker | Salone Fuel Monitor',
    description: 'Manage personal vehicles, trips, fuel fill-ups, maintenance records and PDF reports with My Garage on Salone Fuel Monitor.',
    heading: 'My Garage — Personal Vehicle and Fuel Tracker',
    intro: 'Use My Garage to keep your personal vehicle records together, including trips, fuel purchases, maintenance history and downloadable reports.',
    schemaType: 'WebPage',
    changefreq: 'monthly',
    priority: '0.75',
    index: true
  },
  '/data-methodology': {
    title: 'Fuel Data Sources & Methodology | Salone Fuel Monitor',
    description: 'Learn how Salone Fuel Monitor handles official Sierra Leone fuel prices, effective dates, missing values, regional comparisons and corrections.',
    heading: 'Fuel Data Sources and Methodology',
    intro: 'Salone Fuel Monitor is designed to make fuel-price information easier to understand without hiding how the data is handled. This methodology explains the role of official sources, why effective dates are authoritative, how missing fuel values are treated, how regional comparisons should be interpreted and how users can report corrections.',
    schemaType: 'WebPage',
    changefreq: 'monthly',
    priority: '0.75',
    index: true,
    authority: {
      eyebrow: 'Transparency behind the data',
      sections: [
        {
          heading: 'Official national price records',
          paragraphs: [
            'For Sierra Leone national pump-price context, Salone Fuel Monitor references public petroleum-pricing information from the National Petroleum Regulatory Authority (NPRA). The platform presents this information in a format designed for comparison, historical tracking and public access.',
            'Salone Fuel Monitor is an information platform and does not replace the original regulator. Where a user needs the primary legal or regulatory announcement, the original NPRA publication should be consulted alongside the platform.'
          ]
        },
        {
          heading: 'Effective dates and multiple updates in one month',
          paragraphs: [
            'The effective date is the authoritative timeline field for official fuel-price records. More than one price event can occur in the same calendar month, so month labels are used for display and grouping rather than to collapse records into a single monthly value.',
            'This approach preserves the actual sequence of price changes and allows a historical record to be corrected later without creating a false duplicate month or replacing another valid event.'
          ]
        },
        {
          heading: 'Missing, blank and zero values',
          paragraphs: [
            'Each fuel is handled independently. A blank, null or zero value means no confirmed price was recorded for that fuel on that effective date. It is not treated as a real NLe 0 price and Salone Fuel Monitor does not automatically carry the previous value forward and present it as newly announced.',
            'Dedicated petrol, diesel and kerosene pages identify the latest confirmed positive value for that specific fuel. Historical charts preserve gaps where a fuel value is missing instead of manufacturing a price event.'
          ]
        },
        {
          heading: 'Regional comparisons and market context',
          paragraphs: [
            'Regional fuel-price comparisons place selected West African markets on a common per-litre and currency basis where possible. Exchange rates, data dates, taxes, subsidies, local pricing rules and market structures can differ significantly, so a regional ranking should be treated as a price comparison rather than a complete measure of affordability.',
            'Global crude-oil comparisons are also contextual. Brent, WTI and OPEC movements can influence the international petroleum environment, but local pump prices can also reflect refined-product costs, exchange rates, freight, storage, taxes, margins and the timing of national price reviews.'
          ]
        }
      ],
      faqs: [
        { question: 'Why does Salone Fuel Monitor use effective dates?', answer: 'Effective dates preserve the real sequence of official price events, including multiple updates within the same month.' },
        { question: 'Does Salone Fuel Monitor carry a previous fuel price forward when a field is blank?', answer: 'No. A blank, null or zero value is treated as no confirmed price for that fuel on that effective date, not as a newly announced price.' },
        { question: 'How can I report an incorrect price or station record?', answer: 'Use the Contact page to report a suspected error or correction. Include the affected page, fuel or station and, where possible, the source supporting the correction.' }
      ],
      relatedLinks: [
        ['/petrol-price-sierra-leone', 'Latest petrol price in Sierra Leone'],
        ['/diesel-price-sierra-leone', 'Latest diesel price in Sierra Leone'],
        ['/kerosene-price-sierra-leone', 'Latest kerosene price in Sierra Leone'],
        ['/price-trends', 'Fuel price history by effective date'],
        ['/contact', 'Report a correction or data issue']
      ],
      sources: [['https://pra.gov.sl/', 'National Petroleum Regulatory Authority (NPRA)']]
    }
  }
};

export function normalizePhase3Path(pathname = '/') {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function getPhase3SeoForPath(pathname = '/') {
  return PHASE3_ROUTE_SEO[normalizePhase3Path(pathname)] || null;
}
