export interface PortfolioAthlete {
  id: string;
  name: string;
  classification: "NBA" | "NIL/Collegiate";
  organization: string;
  highSchool: string;
  valuation: number;
  contractType: string;
  behavioralScore: number;
  vistaPathToYes: number;
  status: "Verified Asset" | "Active Pipeline";
}

export interface GlobalMetrics {
  totalPortfolioValue: number;
  activeNILLiquidity: number;
  verifiedAssets: number;
  vistaOnboardingRate: string;
}

export const headsUpPortfolio: PortfolioAthlete[] = [
  {
    id: "p_001",
    name: "Cade Cunningham",
    classification: "NBA",
    organization: "Detroit Pistons",
    highSchool: "Arlington Bowie",
    valuation: 269000000,
    contractType: "Max Extension",
    behavioralScore: 94,
    vistaPathToYes: 100,
    status: "Verified Asset",
  },
  {
    id: "p_002",
    name: "Tyrese Maxey",
    classification: "NBA",
    organization: "Philadelphia 76ers",
    highSchool: "South Garland",
    valuation: 204000000,
    contractType: "Max Extension",
    behavioralScore: 96,
    vistaPathToYes: 100,
    status: "Verified Asset",
  },
  {
    id: "p_003",
    name: "Ron Holland",
    classification: "NBA",
    organization: "Detroit Pistons",
    highSchool: "Duncanville",
    valuation: 37000000,
    contractType: "Rookie Scale",
    behavioralScore: 88,
    vistaPathToYes: 100,
    status: "Verified Asset",
  },
  {
    id: "p_004",
    name: "Jalen Wilson",
    classification: "NBA",
    organization: "Brooklyn Nets",
    highSchool: "Guyer (Denton)",
    valuation: 49000000,
    contractType: "Standard NBA",
    behavioralScore: 92,
    vistaPathToYes: 100,
    status: "Verified Asset",
  },
  {
    id: "p_005",
    name: "JT Toppin",
    classification: "NIL/Collegiate",
    organization: "Texas Tech",
    highSchool: "Faith Family",
    valuation: 4000000,
    contractType: "NIL / Rev Share",
    behavioralScore: 89,
    vistaPathToYes: 65,
    status: "Active Pipeline",
  },
  {
    id: "p_006",
    name: "Tre Johnson",
    classification: "NIL/Collegiate",
    organization: "University of Texas",
    highSchool: "Lake Highlands / Link",
    valuation: 2500000,
    contractType: "NIL Projection",
    behavioralScore: 91,
    vistaPathToYes: 40,
    status: "Active Pipeline",
  },
  {
    id: "p_007",
    name: "Wade Taylor IV",
    classification: "NIL/Collegiate",
    organization: "Texas A&M",
    highSchool: "Lancaster",
    valuation: 850000,
    contractType: "NIL Anchor",
    behavioralScore: 98,
    vistaPathToYes: 85,
    status: "Active Pipeline",
  },
];

export const globalMetrics: GlobalMetrics = {
  totalPortfolioValue: 1150000000,
  activeNILLiquidity: 10500000,
  verifiedAssets: 42,
  vistaOnboardingRate: "78%",
};
