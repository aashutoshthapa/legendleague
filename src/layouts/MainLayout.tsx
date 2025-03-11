
import { ReactNode } from 'react';
import Header from '@/components/Header';
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from '@/components/ThemeProvider';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <ThemeProvider defaultTheme="light">
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <footer className="py-4 text-center text-sm text-muted-foreground">
          <div className="container mx-auto">
            <p>Made with ❤️ by <span className="font-semibold text-primary">AASHUTOSH</span></p>
          </div>
        </footer>
        <Toaster position="top-right" />
      </div>
    </ThemeProvider>
  );
};

export default MainLayout;
