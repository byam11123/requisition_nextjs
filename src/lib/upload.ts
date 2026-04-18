import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function uploadFile(file: File, folder: string = 'misc'): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileName = `${Date.now()}-${file.name.replace(/\\s+/g, '_')}`;
  const uploadDir = join(process.cwd(), 'public', 'uploads', folder);

  await mkdir(uploadDir, { recursive: true });

  const filePath = join(uploadDir, fileName);
  await writeFile(filePath, buffer);

  return `/uploads/${folder}/${fileName}`;
}
