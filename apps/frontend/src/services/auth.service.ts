export const authService = {
    async register(email: string, nickname: string, password: string) {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, nickname, password})
        })

        const data = await response.json();
        return data;
    },

    async login(email: string, password: string) {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password})
        })

        const data = await response.json();
        return data;
    }
}