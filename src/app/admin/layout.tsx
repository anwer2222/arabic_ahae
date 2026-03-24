import { ClerkProvider, UserButton } from "@clerk/nextjs";
import ConvexClerkProvider from "./clerkClientProvider";
import Link from "next/link";
// Optional: You can import Arabic localization for Clerk's internal UI
// import { arSA } from "@clerk/localizations";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // We provide Clerk ONLY to the admin section
    <ClerkProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Admin Header */}
        <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary">
              لوحة تحكم الإدارة
            </h1>
            <Link href="/" className="text-sm text-primary hover:underline mb-2 inline-block">
                 الصفحه الرئيسية
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">حساب المعلم</span>
              <UserButton />
            </div>
          </div>
        </header>

        {/* Admin Content */}
        <main className="flex-1 container mx-auto px-6 py-8">
        <ConvexClerkProvider>
            {children}
            </ConvexClerkProvider>
        </main>
      </div>
    </ClerkProvider>
  );
}