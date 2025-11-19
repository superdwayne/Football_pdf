import { google } from "googleapis"
import type { Player } from "@/types/player"

const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, "")

function getAuth() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!clientEmail || !privateKey) {
    throw new Error("Google Sheets credentials are not configured")
  }

  return new google.auth.JWT(clientEmail, undefined, privateKey, [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
  ])
}

const sheetsApi = google.sheets("v4")

export interface SheetPlayerRecord {
  player: Player
  statistics: any[]
  transfers: any[]
  injuries: any[]
  rawFields: Record<string, any>
}

export class GoogleSheetsProvider {
  private spreadsheetId: string
  private sheetName: string

  constructor() {
    const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    if (!id) {
      throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not set")
    }
    this.spreadsheetId = id
    this.sheetName = process.env.GOOGLE_SHEETS_MAIN_SHEET || "Sheet1"
  }

  private async getAllRows() {
    const auth = getAuth()
    const res = await sheetsApi.spreadsheets.values.get({
      auth,
      spreadsheetId: this.spreadsheetId,
      range: `${this.sheetName}!A:Z`,
    })

    const rows = res.data.values || []
    if (rows.length === 0) return { headers: [], dataRows: [] }

    const headers = rows[0]
    const dataRows = rows.slice(1)
    return { headers, dataRows }
  }

  private mapRow(headers: string[], row: string[], index: number) {
    const obj: Record<string, any> = {}
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? ""
    })

    const headerIndex = (name: string) => {
      const target = normalizeKey(name)
      const idx = headers.findIndex((h) => normalizeKey(h) === target)
      return idx
    }

    const get = (name: string) => {
      const idx = headerIndex(name)
      return idx >= 0 ? row[idx] ?? "" : ""
    }

    const performanceJson = get("Performance Data JSON")

    const player: Player = {
      id: index,
      name: get("Player Name") || get("Name"),
      firstName: get("First Name") || "",
      lastName: get("Last Name") || "",
      age: Number(get("Age")) || 0,
      dob: get("Date of Birth") || get("DOB") || "",
      height: get("Height") || "",
      weight: get("Weight") || "",
      nationality: get("Nationality") || "",
      preferredFoot: get("Preferred Foot") || null,
      photo: get("Photo URL") || "",
      currentTeam: get("Current Club")
        ? { name: get("Current Club") }
        : undefined,
    }

    return {
      player,
      statistics: [],
      transfers: [],
      injuries: [],
      rawFields: {
        "Performance Data JSON": performanceJson,
      },
      recordId: `sheet:${index}`,
    }
  }

  async searchPlayers(name: string, limit = 10) {
    const { headers, dataRows } = await this.getAllRows()
    const lower = name.toLowerCase()

    const records = dataRows
      .map((row, idx) => this.mapRow(headers, row, idx))
      .filter((rec) => rec.player.name.toLowerCase().includes(lower))
      .slice(0, limit)

    return records.map((rec) => ({
      ...rec.player,
      id: rec.player.id,
      // expose recordId so the API can use it
      recordId: rec.recordId,
    }))
  }

  async getPlayerByRecordId(recordId: string): Promise<Player | null> {
    const { headers, dataRows } = await this.getAllRows()

    let index = -1
    if (recordId.startsWith("sheet:")) {
      index = Number(recordId.split(":")[1] || "-1")
    }

    if (index < 0 || index >= dataRows.length) return null

    const rec = this.mapRow(headers, dataRows[index], index)
    return rec.player
  }

  async getPlayerStatistics(recordId: string) {
    // For now, no separate statistics sheet
    return []
  }

  async getPlayerTransfers(recordId: string) {
    return []
  }

  async getPlayerInjuries(recordId: string) {
    return []
  }

  async getPlayerEnhancedInfo(recordId: string) {
    return null
  }

  async getAirtableRecord(recordId: string) {
    const { headers, dataRows } = await this.getAllRows()

    let index = -1
    if (recordId.startsWith("sheet:")) {
      index = Number(recordId.split(":")[1] || "-1")
    }

    if (index < 0 || index >= dataRows.length) return null

    const mapped = this.mapRow(headers, dataRows[index], index)
    return { fields: mapped.rawFields }
  }
}
