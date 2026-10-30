
export type ResourceCategory =
  | "shelter"
  | "food"
  | "healthcare"
  | "housing"
  | "hygiene"
  | "legal"
  | "employment"
  | "transportation"
  | "benefits"
  | "community"
  | "other";

export type VerificationStatus =
  | "verified"
  | "unverified"
  | "pending"
  | "closed";

export interface ResourceAddress {
  street?: string;
  city: string;
  county?: string;
  state: string;
  postalCode?: string;
  country: "US";
}

export interface ResourceSource {
  name: string;
  url?: string;
  retrievedAt: string;
}

export interface Resource {
  id: string;
  name: string;
  description?: string;
  category: ResourceCategory;
  address: ResourceAddress;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  phone?: string;
  website?: string;
  hoursText?: string;
  services: string[];
  eligibility?: string[];
  intakeInstructions?: string;
  accessibility?: string[];
  languages?: string[];
  cost: "free" | "paid" | "sliding-scale" | "unknown";
  verificationStatus: VerificationStatus;
  lastVerifiedAt?: string;
  source: ResourceSource;
}
