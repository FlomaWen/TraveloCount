import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { DocumentsService } from './documents.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post('trips/:tripId/documents')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('linkedExpenseId') linkedExpenseId?: string,
  ) {
    return this.documents.upload(user.id, tripId, file, linkedExpenseId);
  }

  @Get('trips/:tripId/documents')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Query('expenseId') expenseId?: string,
  ) {
    return this.documents.list(user.id, tripId, expenseId);
  }

  @Patch('documents/:id')
  link(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { linkedExpenseId: string | null },
  ) {
    return this.documents.link(user.id, id, body.linkedExpenseId ?? null);
  }

  @Get('documents/:id')
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { stream, filename, mimeType, sizeBytes } = await this.documents.download(user.id, id);
    res.setHeader('content-type', mimeType);
    res.setHeader('content-length', String(sizeBytes));
    res.setHeader(
      'content-disposition',
      `attachment; filename="${encodeURIComponent(filename)}"`,
    );
    res.setHeader('cache-control', 'private, max-age=31536000, immutable');
    stream.pipe(res);
  }
}
