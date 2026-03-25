import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage(props: { searchParams: Promise<{ error?: string, callbackUrl?: string }> }) {
  const searchParams = await props.searchParams;
  const error = searchParams.error;
  const callbackUrl = searchParams.callbackUrl || "/";

  async function loginAction(formData: FormData) {
    "use server";
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: callbackUrl,
    });
  }

  return (
    <div className="flex h-screen w-full bg-[#0E1117] text-gray-200">
      {/* Left side: branding/image */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-[#1A1F2B] to-[#0E1117] border-r border-[#2A303C]">
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            <svg className="w-8 h-8 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Agentic Enterprise
          </div>
          <p className="mt-6 text-xl text-gray-400 max-w-md leading-relaxed">
            The autonomous workforce platform. Deploy, manage, and scale AI employees 24/7.
          </p>
        </div>

        {/* Abstract shapes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4 text-sm text-gray-500">
          <span>© 2026 OpenClaw Corp. All rights reserved.</span>
          <a href="#" className="hover:text-blue-400 transition-colors">Privacy</a>
          <a href="#" className="hover:text-blue-400 transition-colors">Terms</a>
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="flex-1 flex justify-center items-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-bold text-white tracking-tight">Welcome back</h1>
            <p className="mt-3 text-gray-400 text-lg">Sign in to your administration dashboard.</p>
          </div>

          <form action={loginAction} className="mt-10 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 px-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    defaultValue="admin@openclaw.dev"
                    className="w-full pl-11 pr-4 py-3 bg-[#1A1F2B] border border-[#2A303C] rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-gray-500 transition-all outline-none"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5 px-1">
                  <label className="block text-sm font-medium text-gray-300">Password</label>
                  <a href="#" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    defaultValue="admin123"
                    className="w-full pl-11 pr-4 py-3 bg-[#1A1F2B] border border-[#2A303C] rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-gray-500 transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <svg className="h-5 w-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-red-400">
                  <p className="font-medium text-red-300">Authentication Failed</p>
                  <p className="mt-0.5">Invalid email or password. Please try again.</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transform transition-all active:scale-[0.98] outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0E1117]"
            >
              Sign In to Dashboard
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-[#2A303C] text-center">
            <p className="text-sm text-gray-400">
              Vibe Coding / Session 33 Demo<br/>
              Default: <code className="text-blue-400">admin@openclaw.dev</code> / <code className="text-blue-400">admin123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
