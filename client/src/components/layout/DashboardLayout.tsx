import { ReactNode } from "react";
import { User, RefreshCw, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleFit } from "@/hooks/useGoogleFit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import bgImage from "@assets/generated_images/abstract_dark_neon_gradient_background_for_fitness_app.png";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { isConnected, connect, disconnect, sync, isSyncing } = useGoogleFit();

  const handleSync = () => {
    if (isConnected) {
      sync(undefined);
    } else {
      connect(undefined);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground overflow-hidden relative font-sans selection:bg-primary/30">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 opacity-60 pointer-events-none"
        style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
      />
      
      {/* Radial Gradient Overlay for depth */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />

      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-primary/50 transition-all duration-500 disabled:opacity-50"
          data-testid="button-sync-fit"
        >
          {isSyncing ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 text-primary group-hover:rotate-180 transition-transform duration-700 ease-in-out" />
          )}
          <span className="text-xs font-medium text-white/80">
            {isConnected ? 'Sync Fit' : 'Connect Fit'}
          </span>
        </button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="p-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all duration-300"
              data-testid="button-profile"
            >
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px]">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-black/95 backdrop-blur-xl border-white/10" align="end">
            <DropdownMenuLabel className="text-white">
              {user?.email || 'My Account'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              onClick={() => window.location.href = '/api/logout'}
              className="text-white hover:bg-white/10 cursor-pointer"
              data-testid="menu-item-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content */}
      <main className="relative z-10 h-screen overflow-y-auto scrollbar-hide p-4 md:p-8 lg:p-12">
        <div className="max-w-[1600px] mx-auto h-full flex flex-col">
            {children}
        </div>
      </main>
    </div>
  );
}
