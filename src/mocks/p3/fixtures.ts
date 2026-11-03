// OWNER: P3
import type { Cause, ConnectStatus, Impact, Merchant, Progress } from "./contract";

export const merchants: Merchant[] = [
  {
    id: "m_demo_1",
    name: "Sunrise Coffee",
    email: "hello@sunrisecoffee.test",
    stripeAccountId: "acct_demo_1",
    onboardingComplete: true,
    ruleType: "ROUND_UP",
    percentageBps: 100,
    activeCauseId: "c_park",
  },
  {
    id: "m_demo_2",
    name: "Pixel Print Shop",
    email: "team@pixelprint.test",
    stripeAccountId: null,
    onboardingComplete: false,
    ruleType: "PERCENTAGE",
    percentageBps: 250,
    activeCauseId: null,
  },
];

export const causes: Cause[] = [
  {
    id: "c_park",
    slug: "riverside-park-cleanup",
    title: "Riverside Park Cleanup",
    description: "Weekly volunteer cleanups and new recycling bins along the river.",
    city: "Austin",
    goalCents: 500_000,
    ownerName: "Maria Lopez",
    onboardingComplete: true,
    status: "ACTIVE",
  },
  {
    id: "c_pantry",
    slug: "eastside-food-pantry",
    title: "Eastside Food Pantry",
    description: "Stock the shelves for 200 families every month.",
    city: "Austin",
    goalCents: 1_000_000,
    ownerName: "Devon Price",
    onboardingComplete: true,
    status: "ACTIVE",
  },
  {
    id: "c_library",
    slug: "little-library-network",
    title: "Little Library Network",
    description: "Build and stock free neighborhood book exchanges.",
    city: "Denver",
    goalCents: 250_000,
    ownerName: "Priya Nair",
    onboardingComplete: true,
    status: "ACTIVE",
  },
];

export const progressBySlug: Record<string, Progress> = {
  "riverside-park-cleanup": {
    raisedCents: 182_400,
    goalCents: 500_000,
    donorCount: 143,
    recent: [
      { amountCents: 35, createdAt: "2026-11-02T18:20:00Z" },
      { amountCents: 100, createdAt: "2026-11-02T16:05:00Z" },
    ],
  },
  "eastside-food-pantry": {
    raisedCents: 912_000,
    goalCents: 1_000_000,
    donorCount: 610,
    recent: [{ amountCents: 62, createdAt: "2026-11-03T09:10:00Z" }],
  },
  "little-library-network": {
    raisedCents: 0,
    goalCents: 250_000,
    donorCount: 0,
    recent: [],
  },
};

export const impactByMerchant: Record<string, Impact> = {
  m_demo_1: {
    totalDonatedCents: 48_250,
    orderCount: 612,
    donationCount: 540,
    byCause: [
      { causeId: "c_park", title: "Riverside Park Cleanup", amountCents: 31_000 },
      { causeId: "c_pantry", title: "Eastside Food Pantry", amountCents: 17_250 },
    ],
  },
  m_demo_2: { totalDonatedCents: 0, orderCount: 0, donationCount: 0, byCause: [] },
};

export const connectStatusByMerchant: Record<string, ConnectStatus> = {
  m_demo_1: { onboardingComplete: true, requirementsDue: [] },
  m_demo_2: {
    onboardingComplete: false,
    requirementsDue: ["external_account", "individual.verification.document"],
  },
};
