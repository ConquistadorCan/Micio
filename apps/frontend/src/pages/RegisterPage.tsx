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
        try {
            const response = await authFetch("/auth/register", "POST", { nickname, email, password })
            console.log(response)
        }
        catch(e) {
            console.log(e)
        }
    }

    return (
        <div>
            <h1>Register Page</h1>
            <Input
                placeholder="Please Enter Your Nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
            />
            <Input
                placeholder="Please Enter Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={handleSubmit}>Register</Button>
        </div>
    )
}
