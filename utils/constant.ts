import {
  Apple,
  Monitor,
  Terminal,
  Users,
  Server,
  CircleHelp,
  Settings,
  AtSign,
  CodeXml,
  LinkIcon,
  MessageCircle,
  Play,
  Home,
  Download,
  UserRound,
  LogIn,
  Palette,
  Gamepad2,
  Box,
  Layers,
  Package,
  Sparkles,
} from "@gorth/primitive/cores/lucide";

export const launcherFaqQuestions = [
  [
    "Why is my Minecraft name different from SSO?",
    "Minecraft names use 3–16 ASCII letters, digits and underscores. Your game profile has a stable UUID and its own unique name; changing it does not change your central account.",
  ],
  [
    "Who can see my skin?",
    "Your library and previews are private. Uploading or activating does not publish a skin. To display it in Minecraft, explicitly enable Publish my active skin in Settings → Privacy and save. Public texture copies may remain cached after you turn publishing off.",
  ],
  [
    "Does this replace a Microsoft licence?",
    "No. Gorth game profiles belong to a separate identity domain. Microsoft/Mojang-only servers do not accept them.",
  ],
  [
    "Why did renaming sign my game out?",
    "Renaming revokes old game sessions. The launcher requests a new game session from its native authenticated website session before playing.",
  ],
  [
    "What skin formats are supported?",
    "Use a 64×64 RGB/RGBA PNG. Classic models may use legacy 64×32. The upload limit is 256 KB; metadata is stripped by the server.",
  ],
  [
    "Why can a server reject my Gorth profile?",
    "The server must participate in the same Gorth identity system and use the authlib-injector root shown in For servers. Modern chat-signing certificates and trusted client-IP attestation are not implemented; review the required server settings there.",
  ],
];

export const downloadPlatformIcons = {
  macos: Apple,
  windows: Monitor,
  linux: Terminal,
};

export const ProductIcon = Box;
export const dashboardNavigation = [
  { title: "Profile", url: "/account", icon: UserRound },
  { title: "Friend", url: "/account/friend", icon: Users },
  { title: "Skin", url: "/account/skin", icon: Palette },
  { title: "Download", url: "/account/download", icon: Download },
  { title: "For servers", url: "/account/server", icon: Server },
  { title: "FAQ", url: "/account/faq", icon: CircleHelp },
  { title: "Settings", url: "/account/settings", icon: Settings },
];
export const accountNavigation = [
  { title: "Overview", url: "/account" },
  { title: "Your skins", url: "/account/skin" },
];
export const headerNavigation = {
  main: [
    { title: "Account", url: "/account", icon: UserRound },
    { title: "Your skins", url: "/account/skin", icon: Palette },
  ],
  secondary: [{ title: "Sign in", url: "/auth/sign-in", icon: LogIn }],
  navigation: [
    { title: "Home", url: "/", icon: Home },
    { title: "Features", url: "/#features", icon: Gamepad2 },
    { title: "Download", url: "/download", icon: Download },
  ],
};
export const footerSocials = [
  {
    title: "Gorth on X",
    url: "https://www.twitter.com/gorth.org",
    icon: AtSign,
  },
  {
    title: "Gorth on LinkedIn",
    url: "https://www.linkedin.com/company/gorth",
    icon: LinkIcon,
  },
  {
    title: "Gorth on Discord",
    url: "https://discord.gg/gorth",
    icon: MessageCircle,
  },
  {
    title: "Gorth on GitHub",
    url: "https://www.github.com/gorth.org",
    icon: CodeXml,
  },
  {
    title: "Gorth on YouTube",
    url: "https://www.youtube.com/gorth.org",
    icon: Play,
  },
];
export const product = {
  name: "Gorth Launcher",
  eyebrow: "Your games, organized",
  headline: "Your next adventure starts here.",
  description:
    "A home for your Minecraft instances. Keep your setups organized and spend more time in the worlds you love.",
};
export const features = [
  {
    title: "Separate instances",
    description:
      "Give every setup its own home, with settings and content organized around each instance.",
    icon: Layers,
  },
  {
    title: "Content in one place",
    description:
      "Browse and manage the mods, resource packs and other content in your library.",
    icon: Package,
  },
  {
    title: "A familiar desktop",
    description:
      "Make the launcher yours with themes, layouts and keyboard shortcuts.",
    icon: Sparkles,
  },
];
