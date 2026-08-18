export interface ContactPerson {
  name: string;
  shortName: string;
  role?: string;
  phone: string;
  tel: string;
  whatsapp: string;
}

export const CONTACT_PERSONS: ContactPerson[] = [
  {
    name: "Gulshan Ali Sheikh",
    shortName: "Gulshan",
    role: "Sales & Technical Helpline",
    phone: "+91 91980 35803",
    tel: "+919198035803",
    whatsapp: "https://wa.me/919198035803",
  },
  {
    name: "Sahil Sheikh",
    shortName: "Sahil",
    role: "Order & Dispatch Support",
    phone: "+91 92649 20211",
    tel: "+919264920211",
    whatsapp: "https://wa.me/919264920211",
  },
  {
    name: "Vishal Poddar",
    shortName: "Vishal",
    role: "Project & Commercial Inquiries",
    phone: "+91 78709 35277",
    tel: "+917870935277",
    whatsapp: "https://wa.me/917870935277",
  },
];
