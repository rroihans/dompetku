import prisma from "./prisma"

type LogLevel = "INFO" | "WARN" | "ERROR"

export async function logSistem(level: LogLevel, modul: string, pesan: string, stackTrace?: string) {
    const timestamp = new Date().toISOString()
    console.log(`[KEU-LOG] [${timestamp}] [${level}] [${modul}] ${pesan}`)

    try {
        await prisma.logSistem.create({
            data: {
                level,
                modul,
                pesan,
                stackTrace,
            },
        })
    } catch (error) {
        console.error(`[KEU-LOG] [CRITICAL] Gagal menulis log ke database:`, error)
    }
}
