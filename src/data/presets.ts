import { LetterTone, ScenarioPreset } from '../types/letter';

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'security-deposit',
    title: 'Security Deposit Deduction Dispute',
    category: 'Housing & Tenancy',
    tone: LetterTone.Firm,
    recipientName: 'Property Management Office',
    recipientOrganization: 'Oakridge Residential Properties',
    problem:
      'I vacated Apartment 4B on October 31, 2026, after a two-year lease and left the unit clean and undamaged. On November 8, I received a refund statement deducting $650 for hallway carpet replacement. My signed move-in inspection checklist from November 2024 explicitly documented pre-existing carpet wear in the hallway. Please return the withheld $650 within 14 days.',
  },
  {
    id: 'medical-billing',
    title: 'Duplicate Medical Billing Appeal',
    category: 'Billing & Insurance',
    tone: LetterTone.Diplomatic,
    recipientName: 'Patient Financial Services',
    recipientOrganization: 'Mercy Regional Medical Center',
    problem:
      'My latest statement dated November 2, 2026 (Account #MR-88412) includes two identical charges of $420 for a single outpatient diagnostic ultrasound performed on September 18, 2026. My insurer processed the first claim, and the second line item appears to be a duplicate billing entry. I am requesting an itemized audit and removal of the duplicate $420 charge.',
  },
  {
    id: 'defective-appliance',
    title: 'Warranty Replacement Request',
    category: 'Consumer & Retail',
    tone: LetterTone.Firm,
    recipientName: 'Warranty Claims Department',
    recipientOrganization: 'Vanguard Home Appliances',
    problem:
      'I purchased a Vanguard Series 7 Induction Range (Serial #VG7-209441) on May 14, 2026, with a one-year manufacturer warranty. Within five months, the primary control board failed twice despite an authorized technician repair on September 29. Because the unit remains non-functional, I am requesting a full replacement unit or refund under warranty.',
  },
  {
    id: 'flight-delay',
    title: 'Cancelled Flight Expense Reimbursement',
    category: 'Travel & Transit',
    tone: LetterTone.Diplomatic,
    recipientName: 'Customer Relations Department',
    recipientOrganization: 'Meridian Airlines',
    problem:
      'My flight MN-418 on October 24, 2026 (Booking Ref: K8P2LQ) was cancelled due to an unscheduled aircraft maintenance issue, stranding me overnight before rebooking the next morning. I incurred $238 in hotel accommodation and airport transit expenses and have retained itemized receipts. I am requesting reimbursement for these documented out-of-pocket costs.',
  },
  {
    id: 'municipal-tree',
    title: 'Hazardous Street Tree Maintenance Request',
    category: 'Municipal & Civic',
    tone: LetterTone.Urgent,
    recipientName: 'Director of Public Works',
    recipientOrganization: 'City Department of Forestry & Streets',
    problem:
      'Following last week’s windstorm, a large split limb on the municipal elm tree on the public right-of-way in front of 412 Elmwood Avenue is hanging directly over the pedestrian sidewalk and power drop line. Neighbors reported it via phone (Ticket #PW-3091), and we are formally requesting an urgent arborist inspection and safe removal of the damaged limb.',
  },
  {
    id: 'vendor-extension',
    title: 'Contract Deliverable Timeline Adjustment',
    category: 'Business & Commercial',
    tone: LetterTone.Conciliatory,
    recipientName: 'Procurement & Partnerships Lead',
    recipientOrganization: 'Northstar Logistics Group',
    problem:
      'Our engineering team is completing the warehouse inventory integration under Statement of Work #SOW-19. Because third-party customs API credentials were delivered ten business days later than planned on October 28, we are requesting a formal two-week adjustment of the final UAT milestone from November 20 to December 4, 2026, at no additional cost.',
  },
];

export const FORMAL_LETTER_SECTIONS = [
  {
    step: '01. Sender & Date Block',
    summary: 'Establishes provenance and creates a clear chronological record.',
    detail:
      'Place your full name, return mailing address, email or phone number, and the complete written date (e.g., November 10, 2026) at the top left before the recipient block.',
  },
  {
    step: '02. Recipient & Subject Line',
    summary: 'Routes correspondence immediately to the decision-maker.',
    detail:
      'Address a specific person, title, or department (such as Patient Financial Services) followed by a concise "Re:" reference line citing relevant account, lease, or invoice numbers.',
  },
  {
    step: '03. Factual Statement of Issue',
    summary: 'States key dates, agreements, and events in the opening paragraph.',
    detail:
      'Lead with verifiable facts—when an agreement began, what occurred, and what prior steps were taken—avoiding emotional phrasing so the core issue can be verified quickly.',
  },
  {
    step: '04. Specific Resolution & Timeline',
    summary: 'Defines what action is requested and by what date.',
    detail:
      'Close with a concrete, reasonable remedy (e.g., an itemized statement, a $650 refund, or an inspection) and a polite response window such as 10 to 14 business days.',
  },
];
