export interface ApiEnv {
  Variables: {
    user: AuthUser;
    minecraftNativeSessionId: string;
  };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username: string | null;
  image: string | null;
}

export interface AuthMeResponse {
  user: AuthUser | null;
}

export interface DownloadOption {
  id: string;
  platform: "macos" | "windows" | "linux";
  architecture: "arm64" | "x64";
  label: string;
  description: string;
  url: string | null;
}
