import React from 'react';
import type { ProfileDetailsData } from '../components/drawer';
import type { Angle } from '../components/profile/ProfileCard';

export interface Profile {
  id: string;
  name: string;
  angles: Angle[];
  status: 'vetted' | 'unvetted';
  content: React.ReactNode | null; // Not used anymore, kept for type compatibility
  contentHtml?: string | null; // HTML string from Quill editor - this is the source of truth (null when cleared)
  // Profile details for drawer
  profileDetails?: ProfileDetailsData;
}

// Helper function to convert React node to Quill-compliant HTML
export const convertToQuillHtml = (node: React.ReactNode): string => {
  if (typeof node === 'string') {
    return node;
  }
  if (typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(convertToQuillHtml).join('');
  }
  if (React.isValidElement(node)) {
    const props = node.props;
    const children = props.children;
    
    // Handle lists - Quill expects <ul> and <li> tags
    if (node.type === 'ul') {
      const items = React.Children.toArray(children);
      const listItems = items.map((child) => {
        if (React.isValidElement(child) && child.type === 'li') {
          const liContent = convertToQuillHtml(child.props.children);
          return `<li>${liContent}</li>`;
        }
        return '';
      }).join('');
      return `<ul>${listItems}</ul>`;
    }
    if (node.type === 'li') {
      const content = convertToQuillHtml(children);
      return `<li>${content}</li>`;
    }
    if (node.type === 'p') {
      const content = convertToQuillHtml(children);
      return `<p>${content}</p>`;
    }
    if (node.type === 'span') {
      const content = convertToQuillHtml(children);
      return `<span>${content}</span>`;
    }
    if (node.type === 'br') {
      return '<br />';
    }
    
    // For other elements, recursively convert children
    return convertToQuillHtml(children);
  }
  return '';
};

// Initial profiles data with Quill-compliant HTML content
export const initialProfiles: Profile[] = [
  // Angle 1: GLP-1 Formers (3 profiles)
  {
    id: 'jennifer-walsh',
    name: "Jennifer Walsh",
    angles: [{ number: 1, label: 'GLP-1 Formers' }],
    status: "unvetted",
    content: (
      <ul>
        <li>Former Senior Director of Commercial Strategy at Novo Nordisk</li>
        <li>Led market access and pricing strategy for Ozempic and Wegovy</li>
        <li>Deep knowledge of GLP-1 market dynamics and competitive landscape</li>
      </ul>
    ),
    profileDetails: {
      id: 'jennifer-walsh',
      name: 'Jennifer Walsh',
      isCustomRecruit: true,
      biography: 'Jennifer Walsh is a former Senior Director of Commercial Strategy at Novo Nordisk (03/2018-09/2024), where she led market access and pricing strategy for Ozempic and Wegovy across North America. She was responsible for developing commercial strategies, managing payer relationships, and analyzing competitive dynamics in the GLP-1 market. Prior to that, she served as Director of Market Access at Eli Lilly (06/2014-03/2018), focusing on Trulicity launch and market expansion strategies.',
      jobHistory: [
        { id: 'job-1', companyName: 'Novo Nordisk A/S', role: 'Senior Director of Commercial Strategy', dateRange: '03/2018 - 09/2024', isSelected: false },
        { id: 'job-2', companyName: 'Eli Lilly and Company', role: 'Director of Market Access', dateRange: '06/2014 - 03/2018', isSelected: false },
        { id: 'job-3', companyName: 'Pfizer Inc.', role: 'Senior Manager, Health Economics', dateRange: '08/2010 - 06/2014', isSelected: false },
      ],
      screeners: [], // Unvetted profiles have no business/angle screeners
      pastScreeners: [
        { id: 'past-screener-1', question: 'Can you speak to the $ content of elastomer in GLP-1 pens, vials, and KwikPen and quantify how much higher/lower formats are relative to one another? Please elaborate on your ability to do so for our client.', answer: 'I can speak to commercial aspects and market dynamics, but technical specifications around elastomer content would be outside my direct expertise from my commercial role.', responseDate: '08/24/2025' },
        { id: 'past-screener-2', question: 'Can you discuss which drugs utilize multi-dose pens (i.e. KwikPen/FlexTouch) vs. single-use pens by drug and geography? Can you also discuss expectations for which drugs may convert to multi-dose in the future and over what time horizon this could happen?', answer: 'Yes, I have extensive knowledge of device strategies across Novo Nordisk and Eli Lilly portfolios. Multi-dose pens are preferred for patient convenience and cost-effectiveness. I can discuss geographic variations and future conversion timelines based on market trends.', isKeyQuestion: true, responseDate: '08/22/2025' },
        { id: 'past-screener-3', question: 'Are you able to speak to the GLP-1 channel for elastomer? West\'s GLP-1 revenues appear to be growing faster than the market – is this stocking? Is it growth in biosimilars or compounding?', answer: 'From a commercial perspective, the growth is driven by strong demand outpacing supply. It\'s not stocking - the market is genuinely constrained by manufacturing capacity. Biosimilars are still early stage, so most growth is from branded products.', responseDate: '08/20/2025' },
        { id: 'past-screener-4', question: 'What are the key manufacturing constraints to producing more injectables (API vs. fill/finish vs. anything else)? During a potential consult, can you provide a quantitative view on GLP-1 injectables growth over the next 3-5 year?', answer: 'From my commercial experience, device manufacturing and fill/finish capacity are the primary bottlenecks. API supply has been less of an issue. I can provide market growth projections based on payer dynamics, patient demand, and competitive landscape analysis.', isKeyQuestion: true, responseDate: '08/18/2025' },
        { id: 'past-screener-5', question: 'Do you know West\'s GLP-1 exposure to OUS, biosimilars, compounding, etc?', answer: 'I have general market knowledge but not specific details on West\'s exposure breakdown. I can speak to overall market trends and geographic dynamics from my commercial experience.', responseDate: '08/16/2025' },
      ],
    },
  },
  {
    id: 'michael-chen',
    name: "Dr. Michael Chen",
    angles: [{ number: 1, label: 'GLP-1 Formers' }],
    status: "unvetted",
    content: (
      <ul>
        <li>Former Vice President of Medical Affairs at Eli Lilly</li>
        <li>Led clinical development and medical strategy for Trulicity and Mounjaro</li>
        <li>Expertise in GLP-1 clinical outcomes and real-world evidence</li>
      </ul>
    ),
    profileDetails: {
      id: 'michael-chen',
      name: 'Dr. Michael Chen',
      isCustomRecruit: true,
      biography: 'Dr. Michael Chen is a former Vice President of Medical Affairs at Eli Lilly (01/2017-11/2024), where he led clinical development and medical strategy for Trulicity and Mounjaro. He was responsible for overseeing clinical trials, real-world evidence generation, and medical communications. Previously, he served as Senior Medical Director at Novo Nordisk (05/2012-01/2017), focusing on Victoza and Saxenda medical affairs. He has extensive experience in diabetes and metabolic disease therapeutics.',
      jobHistory: [
        { id: 'job-1', companyName: 'Eli Lilly and Company', role: 'Vice President of Medical Affairs', dateRange: '01/2017 - 11/2024', isSelected: false },
        { id: 'job-2', companyName: 'Novo Nordisk A/S', role: 'Senior Medical Director', dateRange: '05/2012 - 01/2017', isSelected: false },
        { id: 'job-3', companyName: 'Merck & Co.', role: 'Medical Director, Diabetes', dateRange: '08/2008 - 05/2012', isSelected: false },
      ],
      screeners: [], // Unvetted profiles have no business/angle screeners
      pastScreeners: [
        { id: 'past-screener-1', question: 'Can you speak to the $ content of elastomer in GLP-1 pens, vials, and KwikPen and quantify how much higher/lower formats are relative to one another? Please elaborate on your ability to do so for our client.', answer: 'My expertise is in clinical and medical aspects rather than technical device specifications. I can speak to clinical performance and patient experience differences between formats.', responseDate: '08/24/2025' },
        { id: 'past-screener-2', question: 'Can you discuss which drugs utilize multi-dose pens (i.e. KwikPen/FlexTouch) vs. single-use pens by drug and geography? Can you also discuss expectations for which drugs may convert to multi-dose in the future and over what time horizon this could happen?', answer: 'Yes, I have deep knowledge of device strategies from my time at both Eli Lilly and Novo Nordisk. Trulicity uses KwikPen, while Mounjaro uses single-use pens. I can discuss the clinical and patient preference factors driving device selection and future conversion strategies.', isKeyQuestion: true, responseDate: '08/22/2025' },
        { id: 'past-screener-3', question: 'Are you able to speak to the GLP-1 channel for elastomer? West\'s GLP-1 revenues appear to be growing faster than the market – is this stocking? Is it growth in biosimilars or compounding?', answer: 'The growth reflects genuine market demand driven by strong clinical outcomes and expanding indications. Biosimilars are not yet a significant factor. Compounding exists but is limited by regulatory constraints.', responseDate: '08/20/2025' },
        { id: 'past-screener-4', question: 'What are the key manufacturing constraints to producing more injectables (API vs. fill/finish vs. anything else)? During a potential consult, can you provide a quantitative view on GLP-1 injectables growth over the next 3-5 year?', answer: 'From a medical perspective, device manufacturing and fill/finish are the primary constraints. I can provide growth projections based on clinical trial data, indication expansion, and patient population analysis over the next 3-5 years.', isKeyQuestion: true, responseDate: '08/18/2025' },
        { id: 'past-screener-5', question: 'Do you know West\'s GLP-1 exposure to OUS, biosimilars, compounding, etc?', answer: 'I have general knowledge of the supply chain but not specific details on West\'s exposure. I can speak to overall market dynamics and geographic variations from a clinical perspective.', responseDate: '08/16/2025' },
      ],
    },
  },
  {
    id: 'sarah-thompson',
    name: "Sarah Thompson",
    angles: [{ number: 1, label: 'GLP-1 Formers' }],
    status: "vetted",
    content: (
      <ul>
        <li>Former Head of Global Supply Chain at Novo Nordisk</li>
        <li>Managed end-to-end supply chain operations for Ozempic and Wegovy</li>
        <li>Expertise in GLP-1 manufacturing capacity and supply chain constraints</li>
      </ul>
    ),
    profileDetails: {
      id: 'sarah-thompson',
      name: 'Sarah Thompson',
      isCustomRecruit: true,
      biography: 'Sarah Thompson is a former Head of Global Supply Chain at Novo Nordisk (04/2016-12/2024), where she managed end-to-end supply chain operations for Ozempic and Wegovy. She was responsible for manufacturing capacity planning, supplier relationships, and ensuring product availability across global markets. Previously, she served as Director of Operations at Eli Lilly (09/2011-04/2016), focusing on Trulicity manufacturing and supply chain optimization. She has extensive experience in pharmaceutical supply chain management and manufacturing operations.',
      jobHistory: [
        { id: 'job-1', companyName: 'Novo Nordisk A/S', role: 'Head of Global Supply Chain', dateRange: '04/2016 - 12/2024', isSelected: false },
        { id: 'job-2', companyName: 'Eli Lilly and Company', role: 'Director of Operations', dateRange: '09/2011 - 04/2016', isSelected: false },
        { id: 'job-3', companyName: 'Sanofi', role: 'Senior Manager, Supply Chain Planning', dateRange: '06/2007 - 09/2011', isSelected: false },
      ],
      screeners: [
        { id: 'screener-1', question: 'Can you speak to the $ content of elastomer in GLP-1 pens, vials, and KwikPen and quantify how much higher/lower formats are relative to one another? Please elaborate on your ability to do so for our client.', answer: 'I can speak to cost structures and supply chain dynamics, but specific elastomer content percentages would require technical specifications from engineering teams. I can discuss relative cost differences between formats from a supply chain perspective.', isKeyQuestion: false },
        { id: 'screener-2', question: 'Can you discuss which drugs utilize multi-dose pens (i.e. KwikPen/FlexTouch) vs. single-use pens by drug and geography? Can you also discuss expectations for which drugs may convert to multi-dose in the future and over what time horizon this could happen?', answer: 'Yes, I have extensive knowledge from managing supply chains at both Novo Nordisk and Eli Lilly. Ozempic uses FlexTouch, Trulicity uses KwikPen. I can discuss device selection criteria, geographic variations, and conversion timelines based on manufacturing capacity and market demand.', isKeyQuestion: true },
        { id: 'screener-3', question: 'Are you able to speak to the GLP-1 channel for elastomer? West\'s GLP-1 revenues appear to be growing faster than the market – is this stocking? Is it growth in biosimilars or compounding?', answer: 'The growth is driven by genuine demand exceeding supply capacity. It\'s not stocking - we were constantly supply-constrained. Biosimilars are still early stage, so most growth is from branded products. Device manufacturing capacity is the key bottleneck.', isKeyQuestion: false },
        { id: 'screener-4', question: 'What are the key manufacturing constraints to producing more injectables (API vs. fill/finish vs. anything else)? During a potential consult, can you provide a quantitative view on GLP-1 injectables growth over the next 3-5 year?', answer: 'Device manufacturing and fill/finish capacity are the primary constraints. API supply has been more manageable. I can provide detailed growth projections based on manufacturing capacity expansion plans, demand forecasts, and supply chain dynamics over the next 3-5 years.', isKeyQuestion: true },
        { id: 'screener-5', question: 'Do you know West\'s GLP-1 exposure to OUS, biosimilars, compounding, etc?', answer: 'I have knowledge of West as a key supplier in the GLP-1 supply chain, but specific exposure breakdowns would be proprietary. I can speak to overall supplier relationships and market dynamics.', isKeyQuestion: false },
        { id: 'angle-screener-1', question: 'What was your experience working at Novo Nordisk during the GLP-1 market expansion?', answer: 'I was at Novo Nordisk during the rapid expansion of Ozempic and Wegovy. The supply chain challenges were unprecedented - we were constantly balancing demand forecasting, manufacturing capacity, and supplier relationships. The device manufacturing constraints were particularly challenging.', isKeyQuestion: true },
        { id: 'angle-screener-2', question: 'How did your role at Eli Lilly prepare you to understand GLP-1 supply chain dynamics?', answer: 'At Eli Lilly, I managed Trulicity operations and saw firsthand how device selection and manufacturing capacity impact market availability. The experience gave me deep insights into the entire GLP-1 value chain from API to patient delivery.', isKeyQuestion: false },
      ],
      pastScreeners: [
        { id: 'past-screener-1', question: 'What are the key competitive advantages of GLP-1 therapies compared to traditional diabetes and obesity treatments?', answer: 'GLP-1 therapies offer superior efficacy in both glycemic control and weight management, with cardiovascular benefits that traditional treatments lack. They provide once-weekly dosing convenience and have demonstrated significant real-world outcomes in patient populations.', isKeyQuestion: true, responseDate: '08/24/2025' },
        { id: 'past-screener-2', question: 'How do you see the GLP-1 market evolving over the next 5 years in terms of patient access and pricing dynamics?', answer: 'Patient access will expand as more indications are approved and manufacturing capacity increases. Pricing will face pressure from payers and potential biosimilars, but the clinical value proposition should maintain premium pricing for branded products.', isKeyQuestion: true, responseDate: '08/22/2025' },
        { id: 'past-screener-3', question: 'What are the primary barriers to GLP-1 adoption in primary care settings?', answer: 'Key barriers include injection device training requirements, gastrointestinal side effect management, cost concerns, and prior authorization complexity. However, these are being addressed through better patient support programs and simplified dosing regimens.', responseDate: '08/20/2025' },
        { id: 'past-screener-4', question: 'Can you discuss the manufacturing scale-up challenges specific to GLP-1 injectables?', answer: 'The primary challenges are device manufacturing capacity, fill/finish line availability, and maintaining quality standards at scale. API production has been more manageable, but the entire supply chain needs synchronized expansion to meet demand.', isKeyQuestion: true, responseDate: '08/18/2025' },
        { id: 'past-screener-5', question: 'What role do device innovations play in GLP-1 market differentiation?', answer: 'Device innovations are critical for patient experience and adherence. Features like auto-injectors, smaller needles, and multi-dose formats significantly impact patient preference and can drive market share in competitive segments.', responseDate: '08/16/2025' },
      ],
    },
  },
  // Angle 2: GLP-1 primary packaging/elastomer procurement (2 profiles)
  {
    id: 'robert-segura',
    name: "Robert Segura",
    angles: [{ number: 2, label: 'GLP-1 primary packaging/elastomer procurement' }],
    status: "unvetted",
    content: (
      <ul>
        <li>Chief Corporate Development Officer at SteriPack Group Ltd</li>
        <li>Can speak to product configurations and where HVS is used relative to standard</li>
        <li>Can speak to drug product type from small molecule to biologics and how this relates to packaging decision</li>
      </ul>
    ),
    profileDetails: {
      id: 'robert-segura',
      name: 'Robert Segura',
      isCustomRecruit: true,
      biography: 'Robert Segura is currently Chief Corporate Development Officer at SteriPack (08/2024-Present). Previously, he was Vice President, Corporate Development (09/2021-08/2024) at West Pharmaceutical Services. Prior to that, he was Vice President, Strategy and Business Development (07/2017-08/2021) at 3M.',
      jobHistory: [
        { id: 'job-1', companyName: 'SteriPack Group Ltd', role: 'Chief Corporate Development Officer', dateRange: '08/2024 - Present', isSelected: false },
        { id: 'job-2', companyName: 'West Pharmaceutical Services, Inc.', role: 'Vice President, Corporate Development', dateRange: '09/2021 - 08/2024', isSelected: false },
        { id: 'job-3', companyName: '3M Company', role: 'Vice President, Strategy and Business Development', dateRange: '07/2017 - 08/2021', isSelected: false },
      ],
      screeners: [], // Unvetted profiles have no business/angle screeners
      pastScreeners: [
        { id: 'past-screener-1', question: 'Can you speak to the $ content of elastomer in GLP-1 pens, vials, and KwikPen and quantify how much higher/lower formats are relative to one another? Please elaborate on your ability to do so for our client.', answer: 'Yes can speak to product configurations and where HVS is used relative to standard', isKeyQuestion: true, responseDate: '08/24/2025' },
        { id: 'past-screener-2', question: 'Can you discuss which drugs utilize multi-dose pens (i.e. KwikPen/FlexTouch) vs. single-use pens by drug and geography? Can you also discuss expectations for which drugs may convert to multi-dose in the future and over what time horizon this could happen?', answer: 'Yes can speak to drug product type from small molecule to biologics and how this relates to packaging decision', isKeyQuestion: true, responseDate: '08/22/2025' },
        { id: 'past-screener-3', question: 'Are you able to speak to the GLP-1 channel for elastomer? West\'s GLP-1 revenues appear to be growing faster than the market – is this stocking? Is it growth in biosimilars or compounding?', answer: 'Can speak to sub segment market performance and respective west performance', responseDate: '08/20/2025' },
        { id: 'past-screener-4', question: 'What are the key manufacturing constraints to producing more injectables (API vs. fill/finish vs. anything else)? During a potential consult, can you provide a quantitative view on GLP-1 injectables growth over the next 3-5 year?', answer: 'Bottlenecks exists along liquid injectable value chain, can speak to and market growth of GLP-1 and necessary infrastructure to Meet demand', isKeyQuestion: true, responseDate: '08/18/2025' },
        { id: 'past-screener-5', question: 'Do you know West\'s GLP-1 exposure to OUS, biosimilars, compounding, etc?', answer: 'Have directional sense of exposure and headwinds such as competition and alternative formats (oral etc)', responseDate: '08/16/2025' },
      ],
    },
  },
  {
    id: 'matyas-lakatos',
    name: "Dr. Matyas Lakatos",
    angles: [{ number: 2, label: 'GLP-1 primary packaging/elastomer procurement' }, { number: 1, label: 'GLP-1 Formers' }],
    status: "unvetted",
    content: (
      <ul>
        <li>Independent Consultant, previously Project Vice President for Rybelsus at Novo Nordisk</li>
        <li>Can discuss current and future use incl. oral GLP-1 trends and strategies</li>
        <li>Expertise in injectables and orals manufacturing constraints</li>
      </ul>
    ),
    profileDetails: {
      id: 'matyas-lakatos',
      name: 'Dr. Matyas Lakatos',
      isCustomRecruit: true,
      biography: 'Matyas Lakatos is an Independent Consultant (05/2025-present), advising biopharmaceutical companies on global strategy, commercialization, and portfolio leadership. He also holds part-time advisory positions, including THENA Capital Fellow (09/2025-present), advising on investment opportunities in chronic disease innovation, and Strategic Advisor at Evoleen (06/2025-present), supporting healthtech ventures with strategic positioning, go-to-market development, and ecosystem partnerships. Previously, he served as the Project Vice President for Rybelsus at Novo Nordisk (10/2021-04/2025).',
      jobHistory: [
        { id: 'job-1', companyName: 'Self-Employed', role: 'Independent Consultant', dateRange: '05/2025 - Present', isSelected: false },
        { id: 'job-2', companyName: 'Novo Nordisk A/S', role: 'Project Vice President Rybelsus', dateRange: '10/2021 - 04/2025', isSelected: false },
        { id: 'job-3', companyName: 'Novo Nordisk A/S', role: 'Vice President Global Marketing, Ozempic & Victoza and Cardiometabolic-Renal Market Development', dateRange: '03/2020 - 12/2021', isSelected: false },
        { id: 'job-4', companyName: 'Self-Employed', role: 'Biopharma Strategy Consulting', dateRange: '07/2019 - 02/2020', isSelected: false },
        { id: 'job-5', companyName: 'Takeda Pharmaceutical Company Limited', role: 'General Manager South East Europe', dateRange: '04/2018 - 06/2019', isSelected: false },
      ],
      screeners: [], // Unvetted profiles have no business/angle screeners
      pastScreeners: [
        { id: 'past-screener-1', question: 'Can you speak to the $ content of elastomer in GLP-1 pens, vials, and KwikPen and quantify how much higher/lower formats are relative to one another? Please elaborate on your ability to do so for our client.', answer: 'N/A, not an expert on this topic.', responseDate: '08/24/2025' },
        { id: 'past-screener-2', question: 'Can you discuss which drugs utilize multi-dose pens (i.e. KwikPen/FlexTouch) vs. single-use pens by drug and geography? Can you also discuss expectations for which drugs may convert to multi-dose in the future and over what time horizon this could happen?', answer: 'Yes, I can discuss current and future use incl. oral GLP-1 trends and strategies.', isKeyQuestion: true, responseDate: '08/22/2025' },
        { id: 'past-screener-3', question: 'Are you able to speak to the GLP-1 channel for elastomer? West\'s GLP-1 revenues appear to be growing faster than the market – is this stocking? Is it growth in biosimilars or compounding?', answer: 'N/A', responseDate: '08/20/2025' },
        { id: 'past-screener-4', question: 'What are the key manufacturing constraints to producing more injectables (API vs. fill/finish vs. anything else)? During a potential consult, can you provide a quantitative view on GLP-1 injectables growth over the next 3-5 year?', answer: 'Yes, on injectables and orals', isKeyQuestion: true, responseDate: '08/18/2025' },
        { id: 'past-screener-5', question: 'Do you know West\'s GLP-1 exposure to OUS, biosimilars, compounding, etc?', answer: 'N/A', responseDate: '08/16/2025' },
      ],
    },
  },
  {
    id: 'kam-tektas',
    name: "Kam Tektas",
    angles: [{ number: 3, label: 'Biosimilar players' }, { number: 2, label: 'GLP-1 primary packaging/elastomer procurement' }],
    status: "vetted",
    content: (
      <ul>
        <li>Head of North America Operations at Alliance Pharma plc</li>
        <li>Deep knowledge on devices used for Trulicity, Mounjaro and ZepBound</li>
        <li>Can speak about West Pharma's relationship with Eli Lilly that is not confidential</li>
      </ul>
    ),
    profileDetails: {
      id: 'kam-tektas',
      name: 'Kam Tektas',
      isCustomRecruit: true,
      biography: 'Kam Tektas, United States, is currently serving as Head of North America Operations at Alliance Pharma plc (05/2025 – Present), a private company with public debt specializing in the acquisition and management of pharmaceutical and healthcare brands. Previously, he was Global Supply Chain Lead at Eli Lilly and Company (01/2025 – 05/2025), a public multinational pharmaceutical company, where he supported global operations and logistics optimization.',
      jobHistory: [
        { id: 'job-1', companyName: 'Alliance Pharma plc', role: 'Head of North America Operations', dateRange: '05/2025 - Present', isSelected: false },
        { id: 'job-2', companyName: 'Eli Lilly and Company', role: 'Global Supply Chain Lead', dateRange: '01/2025 - 05/2025', isSelected: false },
        { id: 'job-3', companyName: 'Bayer', role: 'Head of Supply Chain - Nutritionals and Digestive Health', dateRange: '06/2019 - 12/2024', isSelected: false },
        { id: 'job-4', companyName: 'L\'Oréal S.A.', role: 'Plant Supply Chain Lead', dateRange: '04/2018 - 06/2019', isSelected: false },
        { id: 'job-5', companyName: 'Unilever', role: 'Strategic Planning Lead', dateRange: '08/2012 - 04/2018', isSelected: false },
      ],
      screeners: [
        { id: 'screener-1', question: 'Can you speak to the $ content of elastomer in GLP-1 pens, vials, and KwikPen and quantify how much higher/lower formats are relative to one another? Please elaborate on your ability to do so for our client.', answer: 'I worked at Eli Lilly and I am knowledgable about this topic. I can speak about publicly disclosed information and provide general knowledge.', isKeyQuestion: true },
        { id: 'screener-2', question: 'Can you discuss which drugs utilize multi-dose pens (i.e. KwikPen/FlexTouch) vs. single-use pens by drug and geography? Can you also discuss expectations for which drugs may convert to multi-dose in the future and over what time horizon this could happen?', answer: 'I have deep knowledge on devices used for Trulicity, Mounjaro and ZepBound. I can speak about the topics in this question', isKeyQuestion: true },
        { id: 'screener-3', question: 'Are you able to speak to the GLP-1 channel for elastomer? West\'s GLP-1 revenues appear to be growing faster than the market – is this stocking? Is it growth in biosimilars or compounding?', answer: 'It is not stocking. Due to high demand, devices are a constraint and ask from CMO\'s is to increase their output to meet the demand.', isKeyQuestion: false },
        { id: 'screener-4', question: 'What are the key manufacturing constraints to producing more injectables (API vs. fill/finish vs. anything else)? During a potential consult, can you provide a quantitative view on GLP-1 injectables growth over the next 3-5 year?', answer: 'API is not a constraint. Main constraint is device manufacturing capacity and fill/finish capacity. Outlook in the next 3-5 years is favorable for growth.', isKeyQuestion: true },
        { id: 'screener-5', question: 'Do you know West\'s GLP-1 exposure to OUS, biosimilars, compounding, etc?', answer: 'I can speak about West Pharma\'s relationship with Eli Lilly that is not confidential.', isKeyQuestion: false },
        { id: 'angle-screener-1', question: 'What is your perspective on the biosimilar GLP-1 market opportunity?', answer: 'The biosimilar GLP-1 market represents a significant opportunity, but it requires careful navigation of regulatory pathways, manufacturing scale-up, and competitive positioning. Device partnerships will be critical for biosimilar players to compete effectively.', isKeyQuestion: true },
        { id: 'angle-screener-2', question: 'How do biosimilar manufacturers approach device selection and supply chain for GLP-1 products?', answer: 'Biosimilar manufacturers typically focus on cost-effective device solutions while maintaining quality and patient experience. Supply chain strategies often involve partnerships with multiple device suppliers to ensure reliability and competitive pricing.', isKeyQuestion: false },
      ],
      pastScreeners: [
        { id: 'past-screener-1', question: 'What are the key factors driving patient preference for specific GLP-1 therapies in the market?', answer: 'Patient preferences are driven by dosing frequency, injection device ease of use, side effect profiles, and insurance coverage. Once-weekly formulations with user-friendly devices tend to have higher adherence rates.', isKeyQuestion: true, responseDate: '08/24/2025' },
        { id: 'past-screener-2', question: 'How do you see biosimilar GLP-1 products impacting the market landscape?', answer: 'Biosimilars will create pricing pressure and expand patient access, but branded products will maintain market share through device innovation, clinical differentiation, and strong physician relationships. The market is large enough to support both segments.', isKeyQuestion: true, responseDate: '08/22/2025' },
        { id: 'past-screener-3', question: 'What are the primary supply chain risks for GLP-1 manufacturers?', answer: 'Key risks include device component shortages, fill/finish capacity constraints, regulatory delays in new facilities, and geopolitical factors affecting global supply chains. Diversification of suppliers and manufacturing sites is critical.', responseDate: '08/20/2025' },
        { id: 'past-screener-4', question: 'Can you discuss the relationship between device manufacturers and GLP-1 pharmaceutical companies?', answer: 'The relationship is strategic and long-term, with device manufacturers being critical partners in product development. Close collaboration is needed for device design, regulatory approval, and supply chain coordination. These partnerships are typically multi-year agreements.', isKeyQuestion: true, responseDate: '08/18/2025' },
        { id: 'past-screener-5', question: 'What role does device innovation play in maintaining competitive advantage in the GLP-1 market?', answer: 'Device innovation is a key differentiator, especially as more products enter the market. Features like smaller needles, auto-injectors, and multi-dose formats can significantly impact patient experience and adherence, directly influencing market share.', responseDate: '08/16/2025' },
      ],
    },
  },
  // Angle 3: Biosimilar players (2 profiles)
  {
    id: 'peter-schneider',
    name: "Dr. Péter Schneider",
    angles: [{ number: 3, label: 'Biosimilar players' }],
    status: "unvetted",
    content: (
      <ul>
        <li>Chief Financial Officer – Hungary at Sandoz Group AG</li>
        <li>Can speak to macro-perspective on Kwikpen and multi-dose vs single-use pens by geography</li>
        <li>Knowledgeable on generics approaching the market and API capacity constraints</li>
      </ul>
    ),
    profileDetails: {
      id: 'peter-schneider',
      name: 'Dr. Péter Schneider',
      isCustomRecruit: true,
      biography: 'Péter Schneider, Hungary, is currently serving as Chief Financial Officer – Hungary at Sandoz Group AG (10/2023 – Present), a public global pharmaceutical company specializing in generics and biosimilars. Previously, he was General Manager at Humvo Magyarország Gyógyszer Azonosító és Nonprofit Zártkörűen Működő Részvénytársaság (07/2022 – 10/2023), a private nonprofit organization responsible for pharmaceutical serialization and verification in compliance with EU regulations.',
      jobHistory: [
        { id: 'job-1', companyName: 'Sandoz Group AG', role: 'Chief Financial Officer - Hungary', dateRange: '10/2023 - Present', isSelected: false },
        { id: 'job-2', companyName: 'Humvo Magyarorszag Gyogyszer Azonosito es NonProfit Zarkoruen Mukodo Reszvenytarsasag', role: 'General Manager', dateRange: '07/2022 - 10/2023', isSelected: false },
        { id: 'job-3', companyName: 'Novo Nordisk A/S', role: 'Finance Director / Business Partner', dateRange: '08/2009 - 07/2022', isSelected: false },
        { id: 'job-4', companyName: 'Novartis AG', role: 'Chief Financial Officer & Purchasing Director for Central & East Europe', dateRange: '01/2005 - 08/2009', isSelected: false },
      ],
      screeners: [], // Unvetted profiles have no business/angle screeners
      pastScreeners: [
        { id: 'past-screener-1', question: 'Can you speak to the $ content of elastomer in GLP-1 pens, vials, and KwikPen and quantify how much higher/lower formats are relative to one another? Please elaborate on your ability to do so for our client.', answer: 'yes, but more from a macro-perspective, as Kwikpen is a Lilly administer tool and I worked at Novo', responseDate: '08/24/2025' },
        { id: 'past-screener-2', question: 'Can you discuss which drugs utilize multi-dose pens (i.e. KwikPen/FlexTouch) vs. single-use pens by drug and geography? Can you also discuss expectations for which drugs may convert to multi-dose in the future and over what time horizon this could happen?', answer: 'yes, there are wide variations on geographies', isKeyQuestion: true, responseDate: '08/22/2025' },
        { id: 'past-screener-3', question: 'Are you able to speak to the GLP-1 channel for elastomer? West\'s GLP-1 revenues appear to be growing faster than the market – is this stocking? Is it growth in biosimilars or compounding?', answer: 'the latter ones, generics are approaching the market', responseDate: '08/20/2025' },
        { id: 'past-screener-4', question: 'What are the key manufacturing constraints to producing more injectables (API vs. fill/finish vs. anything else)? During a potential consult, can you provide a quantitative view on GLP-1 injectables growth over the next 3-5 year?', answer: 'it is API, capacity cannot bear still the demand', isKeyQuestion: true, responseDate: '08/18/2025' },
        { id: 'past-screener-5', question: 'Do you know West\'s GLP-1 exposure to OUS, biosimilars, compounding, etc?', answer: 'loosely, we were not direct competitors', responseDate: '08/16/2025' },
      ],
    },
  },
];

/**
 * Initial profiles with Quill-compliant HTML content as the source of truth
 */
export const createInitialProfiles = (): Profile[] =>
  initialProfiles.map((profile) => ({
    ...profile,
    contentHtml: convertToQuillHtml(profile.content),
  }));

/**
 * "Current: <role> at <company> (<dates>)" for an advisor's latest job
 */
export const getCurrentRoleText = (profile: Profile): string | null => {
  const latestJob = profile.profileDetails?.jobHistory?.[0];
  return latestJob ? `Current: ${latestJob.role} at ${latestJob.companyName} (${latestJob.dateRange})` : null;
};

/** Whether pitch HTML already opens with the "Current:" role line */
export const hasCurrentRoleLine = (html: string | null | undefined) => /^\s*<p>\s*Current:/i.test(html || '');

/**
 * Pitch HTML with the "Current:" role line as its first paragraph (as in the Figma editor)
 */
export const withCurrentRoleLine = (profile: Profile, html: string | null | undefined): string => {
  const roleText = getCurrentRoleText(profile);
  if (!roleText || hasCurrentRoleLine(html)) return html || '';
  const escaped = roleText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<p>${escaped}</p><p><br></p>${html || ''}`;
};
