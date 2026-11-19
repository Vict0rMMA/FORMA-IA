import { BottomNav, Sidebar } from "@/components/shell/nav";
import { LogoMark } from "@/components/ui/logo";
import { StoreProvider } from "@/lib/store";

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="animate-pulse">
        <LogoMark size={40} />
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider fallback={<Splash />}>
      <Sidebar />
      <div className="md:pl-[232px]">
        <main className="pt-safe mx-auto w-full max-w-[1120px] px-4 pb-32 pt-6 sm:px-6 md:px-10 md:pb-16 md:pt-10">{children}</main>
      </div>
      <BottomNav />
    </StoreProvider>
  );
}
