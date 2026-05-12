import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { createReadStream, promises as fs } from 'fs';
import { extname, join, resolve } from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const UPLOAD_ROOT = resolve(process.cwd(), 'uploads');

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(
    userId: string,
    tripId: string,
    file: Express.Multer.File,
    linkedExpenseId?: string,
  ) {
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this trip');

    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(`Unsupported MIME type: ${file.mimetype}`);
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException(`File too large (max ${MAX_SIZE / 1024 / 1024} MB)`);
    }

    if (linkedExpenseId) {
      const expense = await this.prisma.expense.findUnique({
        where: { id: linkedExpenseId },
        select: { tripId: true },
      });
      if (!expense || expense.tripId !== tripId) {
        throw new BadRequestException('Linked expense not in this trip');
      }
    }

    const ext = extname(file.originalname) || '';
    const stored = `${randomUUID()}${ext}`;
    const tripDir = join(UPLOAD_ROOT, tripId);
    await fs.mkdir(tripDir, { recursive: true });
    await fs.writeFile(join(tripDir, stored), file.buffer);

    const doc = await this.prisma.document.create({
      data: {
        tripId,
        uploaderId: userId,
        filename: file.originalname,
        storedPath: `${tripId}/${stored}`,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        linkedExpenseId,
      },
    });

    await this.prisma.activityEvent.create({
      data: {
        tripId,
        userId,
        type: ActivityType.DOCUMENT_UPLOADED,
        payload: { documentId: doc.id, filename: doc.filename },
      },
    });

    return this.sanitize(doc);
  }

  async list(userId: string, tripId: string, expenseId?: string) {
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this trip');
    const docs = await this.prisma.document.findMany({
      where: {
        tripId,
        ...(expenseId ? { linkedExpenseId: expenseId } : {}),
      },
      include: { uploader: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((d) => this.sanitize(d));
  }

  async link(userId: string, documentId: string, linkedExpenseId: string | null) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { trip: { select: { members: { select: { userId: true } } } } },
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (!doc.trip.members.some((m) => m.userId === userId)) {
      throw new ForbiddenException('Not a member of this trip');
    }
    if (linkedExpenseId) {
      const expense = await this.prisma.expense.findUnique({
        where: { id: linkedExpenseId },
        select: { tripId: true },
      });
      if (!expense || expense.tripId !== doc.tripId) {
        throw new BadRequestException('Linked expense not in this trip');
      }
    }
    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: { linkedExpenseId },
    });
    return this.sanitize(updated);
  }

  async download(userId: string, documentId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { trip: { select: { members: { select: { userId: true } } } } },
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (!doc.trip.members.some((m) => m.userId === userId)) {
      throw new ForbiddenException('Not a member of this trip');
    }
    const absolutePath = join(UPLOAD_ROOT, doc.storedPath);
    await fs.access(absolutePath).catch(() => {
      throw new NotFoundException('File missing on disk');
    });
    return {
      stream: createReadStream(absolutePath),
      filename: doc.filename,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
    };
  }

  private sanitize<T extends { storedPath?: string }>(doc: T): Omit<T, 'storedPath'> {
    const { storedPath: _drop, ...rest } = doc;
    return rest;
  }
}
