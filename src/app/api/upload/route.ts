import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  document: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'],
  archive: ['zip', 'rar'],
  text: ['txt', 'csv', 'json', 'xml', 'md', 'html', 'css', 'js', 'ts'],
}

const ALL_ALLOWED_EXTENSIONS = Object.values(ALLOWED_EXTENSIONS).flat()

function getExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

function isAllowedType(filename: string): boolean {
  const ext = getExtension(filename)
  return ALL_ALLOWED_EXTENSIONS.includes(ext)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Try to get file from "file" or "attachment" field
    let file = formData.get('file') as File | null
    if (!file) {
      file = formData.get('attachment') as File | null
    }

    if (!file) {
      return NextResponse.json(
        { error: 'Tidak ada file yang diunggah' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Ukuran file melebihi batas 10MB` },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'File kosong tidak dapat diunggah' },
        { status: 400 }
      )
    }

    // Validate file type
    const originalName = file.name
    if (!isAllowedType(originalName)) {
      return NextResponse.json(
        { error: `Tipe file tidak didukung. Tipe yang diizinkan: ${ALL_ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = getExtension(originalName)
    const uniqueId = uuidv4()
    const uniqueFilename = ext ? `${uniqueId}.${ext}` : uniqueId

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Save file
    const filePath = path.join(uploadsDir, uniqueFilename)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // Return the public URL and original filename
    const url = `/uploads/${uniqueFilename}`

    return NextResponse.json({
      url,
      filename: originalName,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Gagal menyimpan file' },
      { status: 500 }
    )
  }
}
