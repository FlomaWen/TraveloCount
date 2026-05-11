import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Controller('trips/:tripId/expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expenses.create(user.id, tripId, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Param('tripId') tripId: string) {
    return this.expenses.listForTrip(user.id, tripId);
  }
}
