import { QuestionRequest } from "@/store/questions.store"

export const getPendingQuestions = async (
    url: string,
    token: string
): Promise<QuestionRequest[]> => {
    try {
        const res = await fetch(`${url}/question`, {
            method: "GET",
            headers: {
                Authorization: `Basic ${btoa(`opencode:${token}`)}`,
            },
        })
        if (!res.ok) return []
        const data = await res.json()
        return Array.isArray(data) ? data : []
    } catch {
        return []
    }
}

export const replyToQuestion = async (
    url: string,
    token: string,
    requestId: string,
    answers: string[][]
): Promise<boolean> => {
    try {
        const res = await fetch(`${url}/question/${requestId}/reply`, {
            method: "POST",
            headers: {
                Authorization: `Basic ${btoa(`opencode:${token}`)}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ answers }),
        })
        return res.ok
    } catch {
        return false
    }
}

export const rejectQuestion = async (
    url: string,
    token: string,
    requestId: string
): Promise<boolean> => {
    try {
        const res = await fetch(`${url}/question/${requestId}/reject`, {
            method: "POST",
            headers: {
                Authorization: `Basic ${btoa(`opencode:${token}`)}`,
            },
        })
        return res.ok
    } catch {
        return false
    }
}
