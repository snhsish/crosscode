import chalk from "chalk"
import QRCode from "qrcode"
import { encodeQrPayload } from "@crosscode/shared"
import { debug } from "./util"

// Full-cell ANSI rendering: each QR module is one terminal cell painted
// with an explicit background colour (black/white). Unlike half-block
// glyph rendering (qrcode-terminal `small: true`, `▀▄█`), this does not
// depend on font glyph shapes, cell aspect ratio, light/dark theme, or
// Terminal.app line spacing — the gaps that made issue #133 unscannable.
const BLACK_CELL = "\x1b[40m  \x1b[0m"
const WHITE_CELL = "\x1b[47m  \x1b[0m"

export type QrRenderOptions = {
    /** Compact but still full-cell output (smaller margin + lower EC). Default false. */
    small?: boolean
}

export function renderQrTerminalText(data: string, opts: QrRenderOptions = {}): string {
    const margin = opts.small ? 2 : 4
    const errorCorrectionLevel = opts.small ? "L" : "M"
    const qr = QRCode.create(data, { errorCorrectionLevel })
    const size = qr.modules.size
    const lines: string[] = []
    for (let r = -margin; r < size + margin; r++) {
        let line = ""
        for (let c = -margin; c < size + margin; c++) {
            const dark = r >= 0 && r < size && c >= 0 && c < size ? qr.modules.get(r, c) !== 0 : false
            line += dark ? BLACK_CELL : WHITE_CELL
        }
        lines.push(line)
    }
    return lines.join("\n")
}

export type PrintTunnelQrOptions = QrRenderOptions & {
    /** When true, skip the QR graphic and print the URL only. */
    disabled?: boolean
}

export function printTunnelQr(
    url: string,
    token: string,
    opencodePort: number,
    requestedPort: number,
    opts: PrintTunnelQrOptions = {},
) {
    const payload = encodeQrPayload({ url, token, v: 1 })
    if (opencodePort !== requestedPort) {
        console.log(chalk.yellow(`opencode running on port ${opencodePort}`))
    }
    if (opts.disabled) {
        console.log(chalk.cyanBright("\n Scan with CrossCode App:"))
        console.log(chalk.grey(`URL: ${url}`))
        console.log(chalk.dim("QR display disabled (--no-qr). Enter the URL manually in the app."))
        console.log(chalk.dim("Press Ctrl+C to exit."))
        return
    }
    console.log(chalk.cyanBright("\n Scan with CrossCode App:"))
    try {
        console.log()
        // Raw ANSI string on its own line: never wrap in chalk or trim,
        // or the explicit black/white cells lose contrast.
        console.log(renderQrTerminalText(payload, { small: opts.small }))
        console.log()
    } catch (err) {
        debug("QR render failed", { error: err instanceof Error ? err.message : String(err) })
        console.log(chalk.yellow("Could not render QR code in this terminal."))
    }
    console.log(chalk.grey(`URL: ${url}`))
    if (process.env.TERM_PROGRAM === "Apple_Terminal") {
        console.log(chalk.dim("Terminal.app tip: if the code won't scan, zoom out (Cmd+-) and keep the whole code visible."))
    }
    console.log(chalk.dim("Press Ctrl+C to exit."))
}
