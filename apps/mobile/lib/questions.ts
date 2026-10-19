import { QuestionRequest } from "@/store/questions.store"
import { apiUrl, getAuthHeader, unwrapList } from "@/lib/utils"
import { getServerVersion } from "@/lib/server-version"

export const getPendingQuestions = async (
    url: string,
    token: string
): Promise<QuestionRequest[]> => {
    try {
        const version = getServerVersion(url)
        // v2: GET /api/question/request ; v1: GET /question
        const endpoints =
            version >= 2
                ? [apiUrl(url, 2, "/question/request"), apiUrl(url, 1, "/question")]
                : [apiUrl(url, 1, "/question"), apiUrl(url, 2, "/question/request")]
        for (const endpoint of endpoints) {
            try {
                const res = await fetch(endpoint, {
                    method: "GET",
                    headers: {
                        Authorization: getAuthHeader(token),
                    },
                })
                if (!res.ok) continue
                const data = await res.json()
                const list = unwrapList<QuestionRequest>(data)
                return Array.isArray(list) ? list : []
            } catch {
                continue
            }
        }
        return []
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
        const version = getServerVersion(url)
        // v2 replies are session-scoped; without a session we can't build the
        // path, so fall back to the legacy route (bridged on some servers).
        const endpoints = [
            apiUrl(url, 1, `/question/${requestId}/reply`),
            apiUrl(url, 2, `/question/request/${requestId}/reply`),
        ]
        void version
        for (const endpoint of endpoints) {
            try {
                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        Authorization: getAuthHeader(token),
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ answers }),
                })
                if (res.ok) return true
            } catch {
                continue
            }
        }
        return false
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
        const endpoints = [
            apiUrl(url, 1, `/question/${requestId}/reject`),
            apiUrl(url, 2, `/question/request/${requestId}/reject`),
        ]
        for (const endpoint of endpoints) {
            try {
                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        Authorization: getAuthHeader(token),
                    },
                })
                if (res.ok) return true
            } catch {
                continue
            }
        }
        return false
    } catch {
        return false
    }
}
