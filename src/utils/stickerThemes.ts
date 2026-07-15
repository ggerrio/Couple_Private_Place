export interface ScrapbookTheme {
  id: string;
  name: string;
  paperClass: string;
  borderClass: string;
  textColor: string;
  tapePattern: 'striped' | 'grid' | 'botanical' | 'plaid' | 'stars' | 'lace';
  tapeColor: string;
  badgeClass: string;
  subtextColor: string;
  progressBarClass: string;
  stickersPriority?: string[];
}

export const SCRAPBOOK_THEMES: ScrapbookTheme[] = [
  {
    id: "cozy-wood",
    name: "Cozy Wood",
    paperClass: "bg-[#FDFBF7]",
    borderClass: "border-2 border-solid border-[#4E3B24]/20",
    textColor: "text-[#4E3B24]",
    tapePattern: "striped",
    tapeColor: "#D97706",
    badgeClass: "bg-[#F59E0B]/10 text-[#D97706] border-[#F59E0B]/20",
    subtextColor: "text-[#4E3B24]/80",
    progressBarClass: "bg-[#D97706]",
    stickersPriority: ["stamp", "ticket"]
  },
  {
    id: "lavender",
    name: "Lavender",
    paperClass: "bg-[#FDFBF7]",
    borderClass: "border-2 border-dashed border-[#4F46E5]/20",
    textColor: "text-[#1E1B4B]",
    tapePattern: "lace",
    tapeColor: "#818CF8",
    badgeClass: "bg-[#818CF8]/10 text-[#4F46E5] border-[#818CF8]/20",
    subtextColor: "text-[#1E1B4B]/80",
    progressBarClass: "bg-[#4F46E5]",
    stickersPriority: ["washi-stripe", "star"]
  },
  {
    id: "moss",
    name: "Moss",
    paperClass: "bg-[#FDFBF7]",
    borderClass: "border-2 border-dotted border-[#2D5A27]/20",
    textColor: "text-[#1A2E1A]",
    tapePattern: "botanical",
    tapeColor: "#2D5A27",
    badgeClass: "bg-[#2D5A27]/10 text-[#2D5A27] border-[#2D5A27]/20",
    subtextColor: "text-[#1A2E1A]/80",
    progressBarClass: "bg-[#2D5A27]",
    stickersPriority: ["ginkgo", "daisy"]
  }
];
