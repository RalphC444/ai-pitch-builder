import { createInitialProfiles, Profile } from './profiles';
import type { JobHistoryItem } from '../components/drawer';

/** Qualified Status chips from the Express List Figma */
export type QualifiedStatus = 'qualified' | 'pending' | 'not-qualified' | 'needs-review';
export type EngagementScore = 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor' | 'N/A';

/** One row of the Express List: an advisor on the project plus CRM fields */
export interface ExpressAdvisor {
  id: string;
  profile: Profile;
  qualifiedStatus: QualifiedStatus;
  /** Shows the qualifier ribbon next to the status */
  hasQualifier: boolean;
  country: string;
  hourlyRate: number;
  recommendationScore: number;
  recommendationExplanation: string;
  summary: string;
  engagement: EngagementScore;
  contact: { email: string; phone: string; timeZone: string; location: string };
  tags: string[];
  advisorNotes: string;
  clientFeedback: string;
}

type CrmFields = Omit<ExpressAdvisor, 'id' | 'profile'>;

const job = (id: string, companyName: string, role: string, dateRange: string): JobHistoryItem => ({ id, companyName, role, dateRange, isSelected: false });

/** Sample advisors added to the project roster (not yet pitched) */
const ADDITIONAL_PROFILES: Profile[] = [
  {
    id: 'nadia-okafor',
    name: 'Nadia Okafor',
    angles: [{ number: 1, label: 'GLP-1 Formers' }],
    status: 'unvetted',
    content: null,
    contentHtml: null,
    profileDetails: {
      id: 'nadia-okafor',
      name: 'Nadia Okafor',
      biography: 'Nadia Okafor is currently Vice President, Clinical Strategy at Zealand Pharma (02/2024 - Present), leading obesity and metabolic programs. Previously, she was Director of Medical Affairs at Novo Nordisk (06/2017 - 01/2024), supporting Wegovy launch evidence planning.',
      jobHistory: [
        job('job-1', 'Zealand Pharma A/S', 'Vice President, Clinical Strategy', '02/2024 - Present'),
        job('job-2', 'Novo Nordisk A/S', 'Director of Medical Affairs', '06/2017 - 01/2024'),
        job('job-3', 'AstraZeneca PLC', 'Medical Manager, Diabetes', '03/2013 - 05/2017'),
      ],
      screeners: [],
      pastScreeners: [
        { id: 'past-screener-1', question: 'Can you discuss which drugs utilize multi-dose pens (i.e. KwikPen/FlexTouch) vs. single-use pens by drug and geography?', answer: 'Yes, I supported device selection evidence for Wegovy and can speak to single-use vs multi-dose strategy across the US and EU.', isKeyQuestion: true, responseDate: '08/23/2025' },
        { id: 'past-screener-2', question: 'What are the key manufacturing constraints to producing more injectables?', answer: 'Fill/finish and device assembly capacity were the binding constraints during the Wegovy ramp-up.', responseDate: '08/19/2025' },
      ],
    },
  },
  {
    id: 'marco-bellini',
    name: 'Marco Bellini',
    angles: [{ number: 2, label: 'GLP-1 primary packaging/elastomer procurement' }],
    status: 'vetted',
    content: null,
    contentHtml: null,
    profileDetails: {
      id: 'marco-bellini',
      name: 'Marco Bellini',
      biography: 'Marco Bellini is currently Head of Procurement, Primary Packaging at Stevanato Group (09/2022 - Present), overseeing glass and elastomer component sourcing for injectable customers. Previously, he was Sourcing Manager at West Pharmaceutical Services (04/2016 - 08/2022).',
      jobHistory: [
        job('job-1', 'Stevanato Group S.p.A.', 'Head of Procurement, Primary Packaging', '09/2022 - Present'),
        job('job-2', 'West Pharmaceutical Services, Inc.', 'Sourcing Manager', '04/2016 - 08/2022'),
        job('job-3', 'Gerresheimer AG', 'Category Buyer', '01/2012 - 03/2016'),
      ],
      screeners: [
        { id: 'screener-1', question: 'Can you speak to the $ content of elastomer in GLP-1 pens, vials, and KwikPen?', answer: 'Yes, I priced plungers and lined seals for pen cartridges and can give relative $ content by format.', isKeyQuestion: true },
        { id: 'screener-2', question: "Are you able to speak to the GLP-1 channel for elastomer and West's growth?", answer: 'Yes, from the supplier side I saw HVS volumes for GLP-1 cartridges grow sharply from 2021.', isKeyQuestion: true },
      ],
      pastScreeners: [],
    },
  },
  {
    id: 'priya-raman',
    name: 'Priya Raman',
    angles: [{ number: 3, label: 'Biosimilar players' }],
    status: 'unvetted',
    content: null,
    contentHtml: null,
    profileDetails: {
      id: 'priya-raman',
      name: 'Priya Raman',
      biography: 'Priya Raman is currently Director, Biosimilars Portfolio at Biocon Biologics (05/2023 - Present), responsible for GLP-1 biosimilar launch sequencing. Previously, she was Senior Manager, Supply Chain at Sandoz (07/2019 - 04/2023).',
      jobHistory: [
        job('job-1', 'Biocon Biologics Ltd', 'Director, Biosimilars Portfolio', '05/2023 - Present'),
        job('job-2', 'Sandoz Group AG', 'Senior Manager, Supply Chain', '07/2019 - 04/2023'),
        job('job-3', 'Dr. Reddy\'s Laboratories', 'Supply Planning Lead', '02/2015 - 06/2019'),
      ],
      screeners: [],
      pastScreeners: [
        { id: 'past-screener-1', question: 'How do you see biosimilar GLP-1 products impacting the market landscape?', answer: 'Liraglutide biosimilars launch first; semaglutide follows by geography as patents lapse, starting outside the US.', isKeyQuestion: true, responseDate: '08/21/2025' },
        { id: 'past-screener-2', question: 'What are the key manufacturing constraints to producing more injectables?', answer: 'For biosimilar players, securing pen devices and fill/finish slots is harder than API.', responseDate: '08/17/2025' },
      ],
    },
  },
  {
    id: 'thomas-weber',
    name: 'Thomas Weber',
    angles: [{ number: 2, label: 'GLP-1 primary packaging/elastomer procurement' }],
    status: 'vetted',
    content: null,
    contentHtml: null,
    profileDetails: {
      id: 'thomas-weber',
      name: 'Thomas Weber',
      biography: 'Thomas Weber is currently Senior Director, Device Engineering at Ypsomed (01/2021 - Present), leading autoinjector and pen platform programs. Previously, he was Engineering Manager at BD (03/2014 - 12/2020).',
      jobHistory: [
        job('job-1', 'Ypsomed AG', 'Senior Director, Device Engineering', '01/2021 - Present'),
        job('job-2', 'Becton, Dickinson and Company', 'Engineering Manager', '03/2014 - 12/2020'),
      ],
      screeners: [
        { id: 'screener-1', question: 'Can you discuss which drugs utilize multi-dose pens vs. single-use pens?', answer: 'Yes, I can map pen platforms to GLP-1 brands and explain why reusable formats are gaining share in Europe.', isKeyQuestion: true },
      ],
      pastScreeners: [],
    },
  },
  {
    id: 'laura-chen',
    name: 'Laura Chen',
    angles: [{ number: 1, label: 'GLP-1 Formers' }],
    status: 'unvetted',
    content: null,
    contentHtml: null,
    profileDetails: {
      id: 'laura-chen',
      name: 'Laura Chen',
      biography: 'Laura Chen is currently an Independent Consultant (03/2025 - Present). Previously, she was Senior Director, Market Access at Eli Lilly (08/2019 - 02/2025), leading payer strategy for Mounjaro and Zepbound.',
      jobHistory: [
        job('job-1', 'Self-Employed', 'Independent Consultant', '03/2025 - Present'),
        job('job-2', 'Eli Lilly and Company', 'Senior Director, Market Access', '08/2019 - 02/2025'),
        job('job-3', 'Novo Nordisk Inc.', 'Associate Director, Pricing', '05/2015 - 07/2019'),
      ],
      screeners: [],
      pastScreeners: [
        { id: 'past-screener-1', question: 'How do you see the GLP-1 market evolving in terms of patient access and pricing?', answer: 'I can speak to Mounjaro and Zepbound payer negotiations and how employer coverage shapes uptake.', isKeyQuestion: true, responseDate: '08/22/2025' },
      ],
    },
  },
];

/** CRM fields for each advisor on the project (sample data) */
const CRM_FIELDS: Record<string, CrmFields> = {
  'jennifer-walsh': { qualifiedStatus: 'pending', hasQualifier: false, country: 'United States', hourlyRate: 450, recommendationScore: 88, recommendationExplanation: 'Led GLP-1 commercial strategy at Novo Nordisk; strong fit for pricing and market access questions.', summary: 'Former Novo Nordisk commercial leader covering Ozempic and Wegovy market access.', engagement: 'Very Good', contact: { email: 'j.walsh@example.com', phone: '+1 555 0101', timeZone: 'United States : Eastern', location: 'Princeton, NJ, United States' }, tags: ['Pharmaceuticals', 'Market Access', 'Diabetes & Obesity'], advisorNotes: 'Responsive; prefers morning ET calls.', clientFeedback: 'Clear on payer dynamics in a prior GLP-1 consult.' },
  'michael-chen': { qualifiedStatus: 'pending', hasQualifier: true, country: 'United States', hourlyRate: 600, recommendationScore: 91, recommendationExplanation: 'Senior medical affairs experience across both Lilly and Novo GLP-1 franchises.', summary: 'Former Lilly VP Medical Affairs for Trulicity and Mounjaro.', engagement: 'Excellent', contact: { email: 'm.chen@example.com', phone: '+1 555 0102', timeZone: 'United States : Eastern', location: 'Indianapolis, IN, United States' }, tags: ['Pharmaceuticals', 'Medical Affairs', 'Clinical Development'], advisorNotes: 'Has done 4 consults with us this year.', clientFeedback: 'Very strong on clinical outcomes data.' },
  'sarah-thompson': { qualifiedStatus: 'qualified', hasQualifier: true, country: 'Denmark', hourlyRate: 550, recommendationScore: 94, recommendationExplanation: 'Ran Novo Nordisk global GLP-1 supply chain; directly answers capacity questions.', summary: 'Former Head of Global Supply Chain at Novo Nordisk.', engagement: 'Excellent', contact: { email: 's.thompson@example.com', phone: '+45 55 01 03', timeZone: 'Denmark : Central European', location: 'Copenhagen, Denmark' }, tags: ['Supply Chain', 'Manufacturing', 'Pharmaceuticals'], advisorNotes: 'Vetted on all five screeners.', clientFeedback: 'Excellent detail on fill/finish bottlenecks.' },
  'robert-segura': { qualifiedStatus: 'pending', hasQualifier: false, country: 'United States', hourlyRate: 500, recommendationScore: 86, recommendationExplanation: 'Corporate development at West and SteriPack; knows elastomer product configurations.', summary: 'SteriPack CDO, formerly West Pharmaceutical corporate development.', engagement: 'Good', contact: { email: 'r.segura@example.com', phone: '+1 555 0104', timeZone: 'United States : Eastern', location: 'Exton, PA, United States' }, tags: ['Medical Devices', 'Packaging', 'Corporate Development'], advisorNotes: 'Former West employee - check conflicts before scheduling.', clientFeedback: 'N/A' },
  'matyas-lakatos': { qualifiedStatus: 'needs-review', hasQualifier: false, country: 'Denmark', hourlyRate: 650, recommendationScore: 72, recommendationExplanation: 'Strong on oral GLP-1 strategy; limited elastomer knowledge per screeners.', summary: 'Former Novo Nordisk Project VP for Rybelsus, now independent.', engagement: 'Good', contact: { email: 'm.lakatos@example.com', phone: '+45 55 01 05', timeZone: 'Denmark : Central European', location: 'Copenhagen, Denmark' }, tags: ['Pharmaceuticals', 'Oral GLP-1', 'Strategy'], advisorNotes: 'Answered N/A to two angle screeners.', clientFeedback: 'N/A' },
  'kam-tektas': { qualifiedStatus: 'qualified', hasQualifier: true, country: 'United States', hourlyRate: 400, recommendationScore: 82, recommendationExplanation: 'Recent Lilly supply chain role; knows devices for Trulicity, Mounjaro and Zepbound.', summary: 'Alliance Pharma NA operations head, formerly Lilly global supply chain.', engagement: 'Very Good', contact: { email: 'k.tektas@example.com', phone: '+1 555 0106', timeZone: 'United States : Central', location: 'Chicago, IL, United States' }, tags: ['Supply Chain', 'Devices', 'Pharmaceuticals'], advisorNotes: 'Confirm what he can share on West relationship.', clientFeedback: 'Helpful on device constraints.' },
  'peter-schneider': { qualifiedStatus: 'pending', hasQualifier: false, country: 'Hungary', hourlyRate: 350, recommendationScore: 68, recommendationExplanation: 'Finance lens on biosimilar entrants; device knowledge is macro-level.', summary: 'Sandoz CFO Hungary, 13 years in Novo Nordisk finance.', engagement: 'Fair', contact: { email: 'p.schneider@example.com', phone: '+36 55 01 07', timeZone: 'Hungary : Central European', location: 'Budapest, Hungary' }, tags: ['Biosimilars', 'Finance', 'Generics'], advisorNotes: 'Prefers written follow-ups.', clientFeedback: 'N/A' },
  'nadia-okafor': { qualifiedStatus: 'pending', hasQualifier: true, country: 'Denmark', hourlyRate: 525, recommendationScore: 89, recommendationExplanation: 'Supported Wegovy device evidence planning; current Zealand Pharma VP.', summary: 'Zealand Pharma VP Clinical Strategy, formerly Novo Nordisk Medical Affairs.', engagement: 'Very Good', contact: { email: 'n.okafor@example.com', phone: '+45 55 01 08', timeZone: 'Denmark : Central European', location: 'Copenhagen, Denmark' }, tags: ['Pharmaceuticals', 'Obesity', 'Medical Affairs'], advisorNotes: 'New to the network this quarter.', clientFeedback: 'N/A' },
  'marco-bellini': { qualifiedStatus: 'qualified', hasQualifier: true, country: 'Italy', hourlyRate: 300, recommendationScore: 92, recommendationExplanation: 'Buys GLP-1 elastomer components today; former West sourcing manager.', summary: 'Stevanato Head of Procurement, Primary Packaging.', engagement: 'Excellent', contact: { email: 'm.bellini@example.com', phone: '+39 55 01 09', timeZone: 'Italy : Central European', location: 'Padua, Italy' }, tags: ['Packaging', 'Procurement', 'Elastomers'], advisorNotes: 'Strong fit for angle 2.', clientFeedback: 'N/A' },
  'priya-raman': { qualifiedStatus: 'pending', hasQualifier: false, country: 'India', hourlyRate: 250, recommendationScore: 79, recommendationExplanation: 'Leads GLP-1 biosimilar launch sequencing at Biocon; ex-Sandoz supply chain.', summary: 'Biocon Biologics Director, Biosimilars Portfolio.', engagement: 'Good', contact: { email: 'p.raman@example.com', phone: '+91 55 01 10', timeZone: 'India : Indian Standard', location: 'Bengaluru, India' }, tags: ['Biosimilars', 'Supply Chain', 'Launch Strategy'], advisorNotes: 'Available evenings ET.', clientFeedback: 'N/A' },
  'thomas-weber': { qualifiedStatus: 'not-qualified', hasQualifier: false, country: 'Switzerland', hourlyRate: 475, recommendationScore: 58, recommendationExplanation: 'Device engineering depth, but current Ypsomed role is a potential conflict.', summary: 'Ypsomed Senior Director, Device Engineering.', engagement: 'Poor', contact: { email: 't.weber@example.com', phone: '+41 55 01 11', timeZone: 'Switzerland : Central European', location: 'Burgdorf, Switzerland' }, tags: ['Medical Devices', 'Engineering'], advisorNotes: 'Compliance flagged current-employer conflict.', clientFeedback: 'N/A' },
  'laura-chen': { qualifiedStatus: 'pending', hasQualifier: false, country: 'United States', hourlyRate: 425, recommendationScore: 84, recommendationExplanation: 'Led Lilly payer strategy for Mounjaro and Zepbound until 2025.', summary: 'Independent consultant, former Lilly Senior Director, Market Access.', engagement: 'Very Good', contact: { email: 'l.chen@example.com', phone: '+1 555 0112', timeZone: 'United States : Pacific', location: 'San Diego, CA, United States' }, tags: ['Market Access', 'Pricing', 'Pharmaceuticals'], advisorNotes: 'Recently left Lilly - observe cooling-off guidance.', clientFeedback: 'N/A' },
};

/** Compact spec for the rest of the project roster (sample data) */
interface RosterSpec {
  id: string;
  name: string;
  angle: number;
  vetted: boolean;
  biography: string;
  jobs: Array<[string, string, string]>;
  screener: [string, string];
  crm: CrmFields;
}

const ANGLE_LABELS: Record<number, string> = {
  1: 'GLP-1 Formers',
  2: 'GLP-1 primary packaging/elastomer procurement',
  3: 'Biosimilar players',
};

const crm = (
  qualifiedStatus: QualifiedStatus,
  hasQualifier: boolean,
  country: string,
  hourlyRate: number,
  recommendationScore: number,
  engagement: EngagementScore,
  recommendationExplanation: string,
  summary: string,
  contact: ExpressAdvisor['contact'],
  tags: string[],
  advisorNotes = 'N/A',
  clientFeedback = 'N/A',
): CrmFields => ({ qualifiedStatus, hasQualifier, country, hourlyRate, recommendationScore, engagement, recommendationExplanation, summary, contact, tags, advisorNotes, clientFeedback });

const MORE_ADVISORS: RosterSpec[] = [
  { id: 'daniel-ortiz', name: 'Daniel Ortiz', angle: 3, vetted: true, biography: 'Daniel Ortiz is currently Head of Biosimilar Operations at Viatris (04/2022 - Present). Previously, he was Director, Manufacturing Strategy at Teva Pharmaceuticals (06/2016 - 03/2022).', jobs: [['Viatris Inc.', 'Head of Biosimilar Operations', '04/2022 - Present'], ['Teva Pharmaceuticals', 'Director, Manufacturing Strategy', '06/2016 - 03/2022'], ['Mylan N.V.', 'Operations Manager', '01/2011 - 05/2016']], screener: ['What are the primary supply chain risks for GLP-1 manufacturers?', 'Pen device capacity is the gating item for biosimilar entrants; API is available from several CDMOs.'], crm: crm('qualified', true, 'United States', 375, 87, 'Very Good', 'Runs biosimilar operations today; direct view of device sourcing constraints.', 'Viatris Head of Biosimilar Operations.', { email: 'd.ortiz@example.com', phone: '+1 555 0113', timeZone: 'United States : Eastern', location: 'Pittsburgh, PA, United States' }, ['Biosimilars', 'Operations', 'Manufacturing']) },
  { id: 'hannah-lindqvist', name: 'Hannah Lindqvist', angle: 1, vetted: false, biography: 'Hannah Lindqvist is currently Director, Device Strategy at Ascendis Pharma (01/2023 - Present). Previously, she was Senior Manager, Device Strategy at Novo Nordisk (08/2016 - 12/2022), working on FlexTouch lifecycle plans.', jobs: [['Ascendis Pharma A/S', 'Director, Device Strategy', '01/2023 - Present'], ['Novo Nordisk A/S', 'Senior Manager, Device Strategy', '08/2016 - 12/2022']], screener: ['Can you discuss which drugs utilize multi-dose pens vs. single-use pens?', 'Yes, I worked on FlexTouch lifecycle planning and can compare multi-dose and single-use strategies by market.'], crm: crm('pending', false, 'Denmark', 450, 83, 'Good', 'Ran FlexTouch device strategy at Novo Nordisk until 2022.', 'Ascendis Director of Device Strategy, ex-Novo Nordisk.', { email: 'h.lindqvist@example.com', phone: '+45 55 01 14', timeZone: 'Denmark : Central European', location: 'Hellerup, Denmark' }, ['Medical Devices', 'Pharmaceuticals']) },
  { id: 'kenji-watanabe', name: 'Kenji Watanabe', angle: 2, vetted: true, biography: 'Kenji Watanabe is currently Sourcing Director at Terumo Corporation (05/2020 - Present), responsible for elastomer and syringe components. Previously, he was Key Account Manager at Datwyler (03/2014 - 04/2020).', jobs: [['Terumo Corporation', 'Sourcing Director', '05/2020 - Present'], ['Datwyler Holding Inc.', 'Key Account Manager', '03/2014 - 04/2020']], screener: ['Can you speak to the $ content of elastomer in GLP-1 pens and vials?', 'Yes, I can compare plunger and seal pricing across pen cartridges and vials from both buyer and supplier sides.'], crm: crm('qualified', true, 'Japan', 325, 90, 'Excellent', 'Has bought and sold GLP-1 elastomer components.', 'Terumo Sourcing Director, ex-Datwyler.', { email: 'k.watanabe@example.com', phone: '+81 55 01 15', timeZone: 'Japan : Japan Standard', location: 'Tokyo, Japan' }, ['Packaging', 'Elastomers', 'Procurement']) },
  { id: 'olivia-grant', name: 'Olivia Grant', angle: 1, vetted: false, biography: 'Olivia Grant is currently Vice President, Marketing at Amgen (02/2024 - Present). Previously, she was Brand Director, Trulicity at Eli Lilly (07/2017 - 01/2024).', jobs: [['Amgen Inc.', 'Vice President, Marketing', '02/2024 - Present'], ['Eli Lilly and Company', 'Brand Director, Trulicity', '07/2017 - 01/2024'], ['Sanofi', 'Associate Brand Manager', '09/2013 - 06/2017']], screener: ['How do you see the GLP-1 market evolving in terms of patient access and pricing?', 'I can speak to Trulicity brand strategy and how competitive entries shifted share and pricing.'], crm: crm('pending', false, 'United States', 550, 81, 'Good', 'Ran Trulicity brand marketing for seven years.', 'Amgen VP Marketing, ex-Lilly Trulicity brand lead.', { email: 'o.grant@example.com', phone: '+1 555 0116', timeZone: 'United States : Pacific', location: 'Thousand Oaks, CA, United States' }, ['Marketing', 'Pharmaceuticals'], 'Current Amgen role - check obesity pipeline conflicts.') },
  { id: 'rafael-souza', name: 'Rafael Souza', angle: 3, vetted: false, biography: 'Rafael Souza is currently Biosimilars Launch Lead, Latin America at Sandoz (09/2021 - Present). Previously, he was Portfolio Manager at Eurofarma (02/2016 - 08/2021).', jobs: [['Sandoz Group AG', 'Biosimilars Launch Lead, Latin America', '09/2021 - Present'], ['Eurofarma Laboratórios', 'Portfolio Manager', '02/2016 - 08/2021']], screener: ['How do you see biosimilar GLP-1 products impacting the market landscape?', 'Latin America will see liraglutide biosimilars early; device partnerships decide who launches first.'], crm: crm('needs-review', false, 'Brazil', 275, 74, 'Fair', 'Regional launch view of biosimilar GLP-1s.', 'Sandoz biosimilars launch lead for Latin America.', { email: 'r.souza@example.com', phone: '+55 55 01 17', timeZone: 'Brazil : Brasília', location: 'São Paulo, Brazil' }, ['Biosimilars', 'Launch Strategy']) },
  { id: 'emma-fischer', name: 'Emma Fischer', angle: 2, vetted: true, biography: 'Emma Fischer is currently Elastomer Product Manager at Datwyler (06/2019 - Present). Previously, she was Product Specialist at Aptar Pharma (10/2014 - 05/2019).', jobs: [['Datwyler Holding Inc.', 'Elastomer Product Manager', '06/2019 - Present'], ['Aptar Pharma', 'Product Specialist', '10/2014 - 05/2019']], screener: ["Are you able to speak to the GLP-1 channel for elastomer and West's growth?", 'Yes, I track GLP-1 cartridge component demand and competitive share versus West.'], crm: crm('qualified', false, 'Switzerland', 300, 88, 'Very Good', 'Product owner for elastomer components sold into GLP-1 pens.', 'Datwyler Elastomer Product Manager.', { email: 'e.fischer@example.com', phone: '+41 55 01 18', timeZone: 'Switzerland : Central European', location: 'Schattdorf, Switzerland' }, ['Elastomers', 'Packaging', 'Product Management']) },
  { id: 'samuel-adeyemi', name: 'Samuel Adeyemi', angle: 1, vetted: true, biography: 'Samuel Adeyemi is currently Vice President, Sterile Operations at Catalent (03/2023 - Present). Previously, he was Fill/Finish Plant Director at Novo Nordisk (01/2017 - 02/2023) in Clayton, NC.', jobs: [['Catalent, Inc.', 'Vice President, Sterile Operations', '03/2023 - Present'], ['Novo Nordisk Inc.', 'Fill/Finish Plant Director', '01/2017 - 02/2023']], screener: ['What are the key manufacturing constraints to producing more injectables?', 'Fill/finish line availability and device assembly were our constraints in Clayton; I can quantify capacity adds.'], crm: crm('qualified', true, 'United States', 500, 93, 'Excellent', 'Ran a Novo Nordisk GLP-1 fill/finish plant through the Wegovy ramp.', 'Catalent VP Sterile Operations, ex-Novo Nordisk plant director.', { email: 's.adeyemi@example.com', phone: '+1 555 0119', timeZone: 'United States : Eastern', location: 'Raleigh, NC, United States' }, ['Manufacturing', 'Fill/Finish', 'Supply Chain']) },
  { id: 'chloe-martin', name: 'Chloé Martin', angle: 2, vetted: false, biography: 'Chloé Martin is currently Packaging Engineering Lead at Sanofi (11/2020 - Present). Previously, she was Application Engineer at West Pharmaceutical Services (05/2015 - 10/2020).', jobs: [['Sanofi', 'Packaging Engineering Lead', '11/2020 - Present'], ['West Pharmaceutical Services, Inc.', 'Application Engineer', '05/2015 - 10/2020']], screener: ['Can you speak to the $ content of elastomer in GLP-1 pens, vials, and KwikPen?', 'I can speak to component specs and relative costs from my time at West, but not current pricing.'], crm: crm('pending', false, 'France', 350, 76, 'Good', 'Former West application engineer; packaging lead at a pen user.', 'Sanofi Packaging Engineering Lead, ex-West.', { email: 'c.martin@example.com', phone: '+33 55 01 20', timeZone: 'France : Central European', location: 'Lyon, France' }, ['Packaging', 'Engineering']) },
  { id: 'arjun-mehta', name: 'Arjun Mehta', angle: 3, vetted: false, biography: 'Arjun Mehta is currently Vice President, Business Development at Lupin Biologics (07/2022 - Present). Previously, he was Associate Director, Partnerships at Biocon Biologics (03/2017 - 06/2022).', jobs: [['Lupin Biologics', 'Vice President, Business Development', '07/2022 - Present'], ['Biocon Biologics Ltd', 'Associate Director, Partnerships', '03/2017 - 06/2022']], screener: ['How do biosimilar manufacturers approach device selection for GLP-1 products?', 'We partner with two pen suppliers to de-risk launch timing; I negotiated those agreements.'], crm: crm('pending', true, 'India', 225, 80, 'Very Good', 'Negotiated pen device partnerships for a biosimilar GLP-1 program.', 'Lupin Biologics VP Business Development.', { email: 'a.mehta@example.com', phone: '+91 55 01 21', timeZone: 'India : Indian Standard', location: 'Mumbai, India' }, ['Biosimilars', 'Business Development']) },
  { id: 'grace-oneill', name: "Grace O'Neill", angle: 1, vetted: true, biography: "Grace O'Neill is currently an Independent Consultant (06/2024 - Present). Previously, she was Market Access Director, UK & Ireland at Eli Lilly (04/2018 - 05/2024).", jobs: [['Self-Employed', 'Independent Consultant', '06/2024 - Present'], ['Eli Lilly and Company', 'Market Access Director, UK & Ireland', '04/2018 - 05/2024']], screener: ['How do you see the GLP-1 market evolving in terms of patient access and pricing?', 'I can speak to NICE and NHS access for Mounjaro and how supply limits shaped rollout.'], crm: crm('qualified', false, 'United Kingdom', 400, 85, 'Very Good', 'Led UK market access for Lilly GLP-1s through 2024.', 'Independent consultant, ex-Lilly UK market access director.', { email: 'g.oneill@example.com', phone: '+44 55 01 22', timeZone: 'United Kingdom : GMT', location: 'London, United Kingdom' }, ['Market Access', 'Pharmaceuticals']) },
  { id: 'lukas-brandt', name: 'Lukas Brandt', angle: 2, vetted: true, biography: 'Lukas Brandt is currently Procurement Director at Schott Pharma (08/2021 - Present). Previously, he was Strategic Buyer at Gerresheimer (01/2015 - 07/2021).', jobs: [['Schott Pharma AG', 'Procurement Director', '08/2021 - Present'], ['Gerresheimer AG', 'Strategic Buyer', '01/2015 - 07/2021']], screener: ['What are the key manufacturing constraints to producing more injectables?', 'Glass cartridge capacity has eased; elastomer components and pen assembly remain tight.'], crm: crm('qualified', false, 'Germany', 325, 84, 'Good', 'Buys primary packaging inputs for injectable cartridges.', 'Schott Pharma Procurement Director.', { email: 'l.brandt@example.com', phone: '+49 55 01 23', timeZone: 'Germany : Central European', location: 'Mainz, Germany' }, ['Procurement', 'Packaging']) },
  { id: 'sofia-rossi', name: 'Sofia Rossi', angle: 3, vetted: false, biography: 'Sofia Rossi is currently Head of Regulatory Affairs at Polpharma Biologics (02/2022 - Present). Previously, she was Regulatory Manager at Sandoz (09/2016 - 01/2022).', jobs: [['Polpharma Biologics', 'Head of Regulatory Affairs', '02/2022 - Present'], ['Sandoz Group AG', 'Regulatory Manager', '09/2016 - 01/2022']], screener: ['How do you see biosimilar GLP-1 products impacting the market landscape?', 'EU approvals for liraglutide biosimilars set the template; device bridging studies are the long pole.'], crm: crm('not-qualified', false, 'Poland', 300, 62, 'Poor', 'Regulatory depth, but limited commercial view of the GLP-1 channel.', 'Polpharma Biologics Head of Regulatory Affairs.', { email: 's.rossi@example.com', phone: '+48 55 01 24', timeZone: 'Poland : Central European', location: 'Warsaw, Poland' }, ['Regulatory', 'Biosimilars']) },
  { id: 'ben-carter', name: 'Ben Carter', angle: 1, vetted: false, biography: 'Ben Carter is currently Director, Pharmacy Strategy at CVS Health (10/2023 - Present). Previously, he was Senior Director, US Payer Strategy at Novo Nordisk (05/2018 - 09/2023).', jobs: [['CVS Health Corporation', 'Director, Pharmacy Strategy', '10/2023 - Present'], ['Novo Nordisk Inc.', 'Senior Director, US Payer Strategy', '05/2018 - 09/2023']], screener: ['How do you see the GLP-1 market evolving in terms of patient access and pricing?', 'I negotiated Ozempic and Wegovy formulary access and now see the PBM side of GLP-1 cost management.'], crm: crm('needs-review', true, 'United States', 475, 86, 'Good', 'Both Novo Nordisk payer strategy and PBM perspective.', 'CVS Health Director of Pharmacy Strategy, ex-Novo Nordisk.', { email: 'b.carter@example.com', phone: '+1 555 0125', timeZone: 'United States : Eastern', location: 'Woonsocket, RI, United States' }, ['Market Access', 'PBM', 'Pricing'], 'PBM employer - confirm compliance clearance.') },
];

const specToProfile = (spec: RosterSpec): Profile => ({
  id: spec.id,
  name: spec.name,
  angles: [{ number: spec.angle, label: ANGLE_LABELS[spec.angle] }],
  status: spec.vetted ? 'vetted' : 'unvetted',
  content: null,
  contentHtml: null,
  profileDetails: {
    id: spec.id,
    name: spec.name,
    biography: spec.biography,
    jobHistory: spec.jobs.map(([companyName, role, dateRange], index) => job(`job-${index + 1}`, companyName, role, dateRange)),
    screeners: spec.vetted ? [{ id: 'screener-1', question: spec.screener[0], answer: spec.screener[1], isKeyQuestion: true }] : [],
    pastScreeners: spec.vetted ? [] : [{ id: 'past-screener-1', question: spec.screener[0], answer: spec.screener[1], isKeyQuestion: true, responseDate: '08/20/2025' }],
  },
});

/**
 * Everyone on the project's Express List: the advisors already in the pitch builder
 * plus the rest of the roster
 */
export const createExpressRoster = (): ExpressAdvisor[] => [
  ...[...createInitialProfiles(), ...ADDITIONAL_PROFILES].map((profile) => ({ id: profile.id, profile, ...CRM_FIELDS[profile.id] })),
  ...MORE_ADVISORS.map((spec) => ({ id: spec.id, profile: specToProfile(spec), ...spec.crm })),
];

// ==================== Derived fields ====================

const splitDates = (dateRange: string) => {
  const [start, end] = dateRange.split(/\s+-\s+/);
  return { start: start || '', end: end || '' };
};

export const getCurrentJob = (advisor: ExpressAdvisor) => advisor.profile.profileDetails?.jobHistory?.[0];
/** Former 1-3 = the jobs after the most recent one */
export const getFormerJob = (advisor: ExpressAdvisor, index: 1 | 2 | 3) => advisor.profile.profileDetails?.jobHistory?.[index];
export const getJobStart = (item?: JobHistoryItem) => (item ? splitDates(item.dateRange).start : '');
export const getJobEnd = (item?: JobHistoryItem) => (item ? splitDates(item.dateRange).end : '');

export const getScreenerResponses = (advisor: ExpressAdvisor) => {
  const details = advisor.profile.profileDetails;
  return [...(details?.screeners || []), ...(details?.pastScreeners || [])];
};

const yearOf = (monthYear: string) => {
  if (/present/i.test(monthYear)) return new Date().getFullYear();
  const match = monthYear.match(/(\d{4})/);
  return match ? Number(match[1]) : NaN;
};

// ==================== Agentic PM filters ====================

export type FilterField =
  | 'Company Name - Former'
  | 'Company Name - Current'
  | 'Company Name'
  | 'Angle'
  | 'Country'
  | 'Qualified Status'
  | 'Hourly Rate'
  | 'Recommendation Score'
  | 'Engagement Score'
  | 'Employment Dates';

export type FilterOperator = 'contains' | 'is' | 'less than' | 'greater than' | 'between';

export interface AdvisorFilter {
  field: FilterField;
  operator: FilterOperator;
  values: string[];
}

export const QUALIFIED_LABELS: Record<QualifiedStatus, string> = {
  qualified: 'Qualified',
  pending: 'Pending',
  'not-qualified': 'Not qualified',
  'needs-review': 'Needs review',
};

const COMPANY_SUFFIXES = /\b(a\/s|inc\.?|incorporated|plc|ag|ltd\.?|llc|s\.p\.a\.|s\.a\.|group|company|corporation|corp\.?|and company|pharmaceutical services|laboratories)\b/gi;

const companyKey = (name: string) => name.toLowerCase().replace(COMPANY_SUFFIXES, '').replace(/[,.&]/g, ' ').replace(/\s+/g, ' ').trim();

const shortCompany = (name: string) => name.replace(/,?\s*(A\/S|Inc\.?|plc|AG|Ltd|LLC|S\.p\.A\.|S\.A\.)$/i, '').replace(/\s+and Company$/i, '').trim();

const jobMatchesCompany = (item: JobHistoryItem, values: string[]) =>
  values.some((value) => companyKey(item.companyName).includes(companyKey(value)) || companyKey(value).includes(companyKey(item.companyName)));

const isFormerJob = (item: JobHistoryItem) => !/present/i.test(item.dateRange);

const jobInYears = (item: JobHistoryItem, from: number, to: number) => {
  const { start, end } = splitDates(item.dateRange);
  const startYear = yearOf(start);
  const endYear = yearOf(end || 'present');
  return startYear <= to && endYear >= from;
};

/**
 * Does an advisor match every filter? Employment Dates narrows company filters
 * to jobs held in that window.
 */
export const matchesFilters = (advisor: ExpressAdvisor, filters: AdvisorFilter[]): boolean => {
  const jobs = advisor.profile.profileDetails?.jobHistory || [];
  const years = filters.find((filter) => filter.field === 'Employment Dates');
  const [fromYear, toYear] = years ? [Number(years.values[0]), Number(years.values[1])] : [NaN, NaN];
  const inWindow = (item: JobHistoryItem) => !years || jobInYears(item, fromYear, toYear);

  return filters.every((filter) => {
    switch (filter.field) {
      case 'Company Name - Former':
        return jobs.some((item) => isFormerJob(item) && jobMatchesCompany(item, filter.values) && inWindow(item));
      case 'Company Name - Current':
        return jobs.some((item) => !isFormerJob(item) && jobMatchesCompany(item, filter.values) && inWindow(item));
      case 'Company Name':
        return jobs.some((item) => jobMatchesCompany(item, filter.values) && inWindow(item));
      case 'Employment Dates': {
        const hasCompanyFilter = filters.some((other) => other.field.startsWith('Company Name'));
        return hasCompanyFilter || jobs.some(inWindow);
      }
      case 'Angle':
        return advisor.profile.angles.some((angle) => filter.values.includes(`Angle ${angle.number}`));
      case 'Country':
        return filter.values.includes(advisor.country);
      case 'Qualified Status':
        return filter.values.includes(QUALIFIED_LABELS[advisor.qualifiedStatus]);
      case 'Engagement Score':
        return filter.values.includes(advisor.engagement);
      case 'Hourly Rate':
        return filter.operator === 'less than' ? advisor.hourlyRate < Number(filter.values[0]) : advisor.hourlyRate > Number(filter.values[0]);
      case 'Recommendation Score':
        return filter.operator === 'less than' ? advisor.recommendationScore < Number(filter.values[0]) : advisor.recommendationScore > Number(filter.values[0]);
      default:
        return true;
    }
  });
};

export const describeFilter = (filter: AdvisorFilter) =>
  filter.operator === 'between'
    ? `${filter.field} between ${filter.values.join(' and ')}`
    : `${filter.field} ${filter.operator} ${filter.values.join(', ')}`;

const COUNTRY_WORDS: Array<[RegExp, string]> = [
  [/\b(us|u\.s\.?|usa|united states|american|america)\b/i, 'United States'],
  [/\b(denmark|danish)\b/i, 'Denmark'],
  [/\b(hungary|hungarian)\b/i, 'Hungary'],
  [/\b(india|indian)\b/i, 'India'],
  [/\b(italy|italian)\b/i, 'Italy'],
  [/\b(switzerland|swiss)\b/i, 'Switzerland'],
  [/\b(uk|united kingdom|britain|british)\b/i, 'United Kingdom'],
  [/\b(germany|german)\b/i, 'Germany'],
  [/\b(france|french)\b/i, 'France'],
  [/\b(japan|japanese)\b/i, 'Japan'],
  [/\b(brazil|brazilian)\b/i, 'Brazil'],
  [/\b(poland|polish)\b/i, 'Poland'],
];

const ENGAGEMENT_WORDS: EngagementScore[] = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];

export interface ParsedRequest {
  /** "start over" / "clear filters" */
  reset: boolean;
  filters: AdvisorFilter[];
  /** Fields the user asked to remove ("remove the country filter") */
  removeFields: FilterField[];
}

/**
 * Turn a plain-English request into Express List filters (rule-based, offline).
 * e.g. "formers of Novo Nordisk or Eli Lilly in Angle 1, based in the US"
 */
export const parseFilterRequest = (text: string, roster: ExpressAdvisor[]): ParsedRequest => {
  const lower = text.toLowerCase();
  const filters: AdvisorFilter[] = [];
  const removeFields: FilterField[] = [];

  const reset = /\b(start over|clear (all|everything|filters?)|reset( filters?)?|remove all|show (me )?everyone|show all)\b/.test(lower);

  // Removal requests: "remove the angle filter", "drop country"
  const removal = lower.match(/\b(remove|drop|without|ignore)\b(.*)/);
  if (removal && !reset) {
    const rest = removal[2];
    if (/angle/.test(rest)) removeFields.push('Angle');
    if (/country|location|geograph|us\b|united states/.test(rest)) removeFields.push('Country');
    if (/rate|price|cost/.test(rest)) removeFields.push('Hourly Rate');
    if (/score|recommend/.test(rest)) removeFields.push('Recommendation Score');
    if (/compan|former|current/.test(rest)) removeFields.push('Company Name - Former', 'Company Name - Current', 'Company Name');
    if (/vetted|qualif|status/.test(rest)) removeFields.push('Qualified Status');
    if (/date|year|between/.test(rest)) removeFields.push('Employment Dates');
    if (/engagement/.test(rest)) removeFields.push('Engagement Score');
    if (removeFields.length > 0) return { reset: false, filters: [], removeFields };
  }

  // Companies mentioned, matched against the roster's employers
  const companies = new Map<string, string>();
  roster.forEach((advisor) => (advisor.profile.profileDetails?.jobHistory || []).forEach((item) => {
    if (/self-employed/i.test(item.companyName)) return;
    const key = companyKey(item.companyName);
    const keys = [key, ...key.split(' ').filter((word) => word.length >= 4 && !['global', 'services', 'biologics', 'pharma', 'group'].includes(word))];
    if (keys.some((candidate) => new RegExp(`\\b${candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lower))) {
      companies.set(key, shortCompany(item.companyName));
    }
  }));
  if (companies.size > 0) {
    const field: FilterField = /\b(former|formers|formerly|previous|previously|ex-|alumni|used to|left)\b/.test(lower)
      ? 'Company Name - Former'
      : /\b(current|currently|now at|presently)\b/.test(lower)
        ? 'Company Name - Current'
        : 'Company Name';
    filters.push({ field, operator: 'contains', values: Array.from(new Set(companies.values())) });
  }

  // Angles: "angle 1", "angles 1 and 3", or by name
  const angleNumbers = new Set<number>();
  const angleList = lower.match(/angles?\s+((?:\d+\s*(?:,|and|or|&)?\s*)+)/);
  if (angleList) angleList[1].match(/\d+/g)?.forEach((number) => angleNumbers.add(Number(number)));
  if (/biosimilar/.test(lower)) angleNumbers.add(3);
  if (/packaging|elastomer|procurement/.test(lower)) angleNumbers.add(2);
  if (/glp-1 formers|\bformers angle\b/.test(lower)) angleNumbers.add(1);
  if (angleNumbers.size > 0) {
    filters.push({ field: 'Angle', operator: 'contains', values: Array.from(angleNumbers).sort().map((number) => `Angle ${number}`) });
  }

  // Countries
  const countries = COUNTRY_WORDS.filter(([pattern]) => pattern.test(text)).map(([, country]) => country);
  if (countries.length > 0) filters.push({ field: 'Country', operator: 'is', values: Array.from(new Set(countries)) });

  // Qualified status
  const statuses: string[] = [];
  if (/\b(unvetted|not vetted|pending)\b/.test(lower)) statuses.push('Pending');
  if (/(^|[^n])\b(vetted|qualified)\b/.test(lower.replace(/unvetted|not qualified|not vetted/g, ''))) statuses.push('Qualified');
  if (/\b(not qualified|disqualified)\b/.test(lower)) statuses.push('Not qualified');
  if (/needs? review/.test(lower)) statuses.push('Needs review');
  if (statuses.length > 0) filters.push({ field: 'Qualified Status', operator: 'is', values: statuses });

  // Hourly rate: needs $ or rate/hour wording
  const rate = lower.match(/(under|below|less than|cheaper than|<|max(?:imum)?|up to)\s*\$\s?(\d+)|\$\s?(\d+)\s*(?:\/\s*h(?:ou)?r|an hour|per hour)?\s*(or less|or under|max)/)
    || lower.match(/rate\s*(?:is\s*)?(under|below|less than|<)\s*\$?\s?(\d+)/);
  const rateOver = lower.match(/(over|above|more than|>|at least)\s*\$\s?(\d+)/) || lower.match(/rate\s*(?:is\s*)?(over|above|more than|>)\s*\$?\s?(\d+)/);
  if (rate) filters.push({ field: 'Hourly Rate', operator: 'less than', values: [rate[2] || rate[3]] });
  else if (rateOver) filters.push({ field: 'Hourly Rate', operator: 'greater than', values: [rateOver[2]] });

  // Recommendation score
  const score = lower.match(/(?:recommendation\s+)?score\s*(?:is\s*|of\s*)?(above|over|greater than|more than|>|at least|below|under|less than|<)\s*(\d+)/)
    || lower.match(/(above|over|below|under)\s*(\d+)\s*(?:recommendation|score)/);
  if (score) {
    const below = /below|under|less|</.test(score[1]);
    filters.push({ field: 'Recommendation Score', operator: below ? 'less than' : 'greater than', values: [score[2]] });
  }

  // Engagement
  const engagement = ENGAGEMENT_WORDS.filter((word) => new RegExp(`\\b${word.toLowerCase()}\\b\\s+engagement|engagement\\s+(?:is\\s+|of\\s+)?${word.toLowerCase()}\\b`).test(lower));
  if (engagement.length > 0) filters.push({ field: 'Engagement Score', operator: 'is', values: engagement });

  // Years: "between 2019 and 2023", "from 2019 to 2023"
  const years = lower.match(/(?:between|from)\s*(\d{4})\s*(?:and|to|-|–)\s*(\d{4})/);
  if (years) {
    const [a, b] = [Number(years[1]), Number(years[2])].sort((x, y) => x - y);
    filters.push({ field: 'Employment Dates', operator: 'between', values: [String(a), String(b)] });
  }

  return { reset, filters, removeFields };
};

/**
 * Merge a new request into the filters so far: same field is replaced, new fields are added
 */
export const mergeFilters = (current: AdvisorFilter[], parsed: ParsedRequest): AdvisorFilter[] => {
  if (parsed.reset) return parsed.filters;
  const kept = current.filter((filter) =>
    !parsed.removeFields.includes(filter.field)
    && !parsed.filters.some((next) => next.field === filter.field
      || (next.field.startsWith('Company Name') && filter.field.startsWith('Company Name'))));
  return [...kept, ...parsed.filters];
};
