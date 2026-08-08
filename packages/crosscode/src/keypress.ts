import { emitKeypressEvents } from "node:readline";

export function onKeypress(callback: (key: string) => void) {
    emitKeypressEvents(process.stdin)

    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true)
        process.stdin.resume()
    }

    process.stdin.on("data", (data: Buffer) => {
        console.log(`[keypress] received data: length=${data.length}, bytes=[${Array.from(data).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(', ')}]`)
        if (data.length === 1 && data[0] === 0x6c) callback("l")
        else if (data.length === 1 && data[0] === 0x03) callback("ctrl-c")
    })
}

export function cleanupKeypress() {
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(false)
        process.stdin.pause()
    }
}