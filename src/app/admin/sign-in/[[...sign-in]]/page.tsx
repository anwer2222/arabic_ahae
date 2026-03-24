import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">تسجيل الدخول للإدارة</h2>
        <p className="text-muted-foreground">
          يرجى تسجيل الدخول باستخدام حساب Google المعتمد
        </p>
      </div>
      
      {/* Clerk's pre-built component */}
      <SignIn 
        path="/admin/sign-in" 
        routing="path" 
        fallbackRedirectUrl="/admin" 
      />
    </div>
  );
}