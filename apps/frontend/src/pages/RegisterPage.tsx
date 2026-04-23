import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useApi } from "@/services/api"
import { useState } from "react"

export function RegisterPage() {
    const [nickname, setNickname] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const { authFetch } = useApi()

    async function handleSubmit() {
        await authFetch("/auth/register", "POST", { nickname, email, password })
    }

    return (
        <div className="dark min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create An Account</h1>
                    <p className="text-sm text-muted-foreground mt-1">Sign up to get started</p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Nickname</label>
                        <Input
                            placeholder="yourname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Email</label>
                        <Input
                            placeholder="you@example.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Password</label>
                        <Input
                            placeholder="••••••••"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <Button className="w-full mt-2" onClick={handleSubmit}>
                        Sign up
                    </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    Already have an account?{" "}
                    <a href="/login" className="text-accent-foreground hover:text-primary font-medium transition-colors">
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    )
}
