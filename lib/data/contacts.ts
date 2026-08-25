export interface ContactPerson {
  name: string;
  shortName: string;
  role: string;
  title?: string;
  email?: string;
  phone: string;
  tel: string;
  whatsapp: string;
  isFounder?: boolean;
}

export interface DepartmentContact {
  department: string;
  email: string;
  lead: string;
  role: string;
  description: string;
}

export interface LeadershipMember {
  name: string;
  role: string;
  email: string;
  bio: string;
  social?: string;
  isFounder?: boolean;
}

export const LEADERSHIP_TEAM: LeadershipMember[] = [
  {
    name: "Sahil Sheikh",
    role: "Founder, CEO & CTO",
    email: "sahil@intrihub.com",
    bio: "Spearheading the technology infrastructure, platform architecture, and overall vision of Intrihub.",
    social: "https://www.instagram.com/sahil_sheikh78/",
    isFounder: true,
  },
  {
    name: "Gulshan",
    role: "Chief Operating Officer (COO)",
    email: "gulshan@intrihub.com",
    bio: "Managing vendor relations, supply chain logistics, and ground operations to ensure lightning-fast execution.",
  },
  {
    name: "Vishal Poddar",
    role: "Chief Product Officer (CPO)",
    email: "vishal@intrihub.com",
    bio: "Curating top-tier product catalogs, monitoring market trends, and ensuring the best value and variety for our customers.",
  },
];

export const CORE_DEPARTMENTS: DepartmentContact[] = [
  {
    department: "Technical Support",
    email: "sahil@intrihub.com",
    lead: "Sahil Sheikh",
    role: "Founder, CEO & CTO",
    description: "Platform uptime, developer APIs, vendor portal integration & technical queries.",
  },
  {
    department: "Operations & Logistics",
    email: "gulshan@intrihub.com",
    lead: "Gulshan",
    role: "Chief Operating Officer (COO)",
    description: "Freight tracking, warehouse distribution, fleet routing & delivery updates.",
  },
  {
    department: "Product & Merchandising",
    email: "vishal@intrihub.com",
    lead: "Vishal Poddar",
    role: "Chief Product Officer (CPO)",
    description: "Catalog onboardings, wholesale sample requests & brand partnerships.",
  },
];

export const CONTACT_PERSONS: ContactPerson[] = [
  {
    name: "Sahil Sheikh",
    shortName: "Sahil (CEO)",
    role: "Founder, CEO & CTO | Company Head",
    email: "sahil@intrihub.com",
    phone: "+91 92649 20211",
    tel: "+919264920211",
    whatsapp: "https://wa.me/919264920211",
    isFounder: true,
  },
  {
    name: "Gulshan",
    shortName: "Gulshan (COO)",
    role: "Chief Operating Officer | Operations & Logistics",
    email: "gulshan@intrihub.com",
    phone: "+91 91980 35803",
    tel: "+919198035803",
    whatsapp: "https://wa.me/919198035803",
  },
  {
    name: "Vishal Poddar",
    shortName: "Vishal (CPO)",
    role: "Chief Product Officer | Product & Merchandising",
    email: "vishal@intrihub.com",
    phone: "+91 92649 20211",
    tel: "+919264920211",
    whatsapp: "https://wa.me/919264920211",
  },
  {
    name: "Intrihub Central Support",
    shortName: "Support Desk",
    role: "General Inquiries & Customer Helpdesk",
    email: "info@intrihub.com",
    phone: "+91 92649 20211",
    tel: "+919264920211",
    whatsapp: "https://wa.me/919264920211",
  },
];

