import { Pipe, PipeTransform } from '@angular/core';
import { formatInr } from './format.util';

/** `{{ amount | inr }}` -> `₹1,500`; `{{ amount | inr:2 }}` -> `₹1,500.00` */
@Pipe({ name: 'inr', standalone: true })
export class InrPipe implements PipeTransform {
  transform(value: number | string | null | undefined, fixedDecimals?: number): string {
    return formatInr(value, fixedDecimals);
  }
}
