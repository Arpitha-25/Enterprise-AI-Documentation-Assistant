import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-md animate-fade-in">
        
        {/* Brand logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20 mb-3">
            NP
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NetPilot AI</h1>
          <p className="text-sm text-slate-400">Documentation Intelligence Platform</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white">Welcome back</CardTitle>
            <CardDescription className="text-slate-400">
              Sign in to your account to access your documentation chat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs font-medium text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg animate-shake">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">Email Address</label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950/50 border-slate-800 text-white placeholder-slate-500 focus:border-blue-500! h-10"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">Password</label>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950/50 border-slate-800 text-white placeholder-slate-500 focus:border-blue-500! h-10"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium h-10 mt-6 rounded-lg transition-all"
              >
                {submitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-800/60 py-4 bg-slate-950/30">
            <span className="text-xs text-slate-400">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-500 hover:text-blue-400 font-medium">
                Create account
              </Link>
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default Login;