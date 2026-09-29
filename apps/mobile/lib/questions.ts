import { QuestionRequest } from "@/store/questions.store"
import { getAuthHeader } from "@/lib/utils"
import { getServerVersion } from "@/lib/server-version"

export const getPendingQuestions = async (
    url: string,
    token: string
): Promise<QuestionRequest[]> => {
    // No v2 equivalent yet; the UI mutes questions on v2 (see supportsFeature).
    if (getServerVersion(url) >= 2) return []
    try {
        const res = await fetch(`${url}/question`, {
            method: "GET",
            headers: {
                Authorization: getAuthHeader(token),
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
    if (getServerVersion(url) >= 2) return false
    try {
        const res = await fetch(`${url}/question/${requestId}/reply`, {
            method: "POST",
            headers: {
                Authorization: getAuthHeader(token),
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
    if (getServerVersion(url) >= 2) return false
    try {
        const res = await fetch(`${url}/question/${requestId}/reject`, {
            method: "POST",
            headers: {
                Authorization: getAuthHeader(token),
            },
        })
        return res.ok
    } catch {
        return false
    }
}
