import { emitKeypressEvents } from "node:readline";

export function onKeypress(callback: (key: string) => void) {
    emitKeypressEvents(process.stdin)

    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true)
        process.stdin.resume()
    }

    process.stdin.on("data", (data: Buffer) => {
        if (data.length === 1 && data[0] === 0x6c) callback("l")
        else if (data[0] === 0x03) callback("ctrl-c")
    })
}

export function cleanupKeypress() {
    process.stdin.setRawMode(false)
    process.stdin.pause()
}