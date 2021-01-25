import { Component,OnDestroy, OnInit } from '@angular/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NgbCalendar, NgbDate, NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';
import {Frequency, Options, RRule} from 'rrule';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import * as moment from 'moment';


export function toNativeDate(ngbDate: NgbDate): Date {
  return new Date(Date.UTC(ngbDate.year, ngbDate.month - 1, ngbDate.day));
}



@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.css']
})


export class TabsComponent implements OnInit, OnDestroy {


  Frequency = Frequency;
  recurringForm : any;
  hoveredDate: NgbDate | null = null;
  Freq = Frequency;
  private destroy$ = new Subject();
  dates: Date[] = [];

  get f(): any {
    return this.recurringForm.controls;
  }
  
  private today: any;
  private weekdayMap = [
    RRule.MO,
    RRule.TU,
    RRule.WE,
    RRule.TH,
    RRule.FR,
    RRule.SA,
    RRule.SU
  ];

  orders: any[] = [];
  date = moment();
  startEndDatesForm: any;
  weeklyForm: any;
  events: string[] = [];
  radioSelected:string;
  tabIndex = 0;
  weekdays = [ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  years: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  name = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'one time', 'on completion of']
  tabName = '';

  constructor(
    private fb: FormBuilder,
    private calendar: NgbCalendar,
    public formatter: NgbDateParserFormatter
    
  ) { 
    this.radioSelected = "1";
  }

  ngOnInit() {
    this.tabName =this.name[0];
    this.today = this.calendar.getToday();
    this.initRecurringForm();
    this.subscribeToFormValue();
    this.startEndDatesForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      occurence: ['1'],
      valueRadio: ['1']
    });

    this.weeklyForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      occurence: [''],
      checkList: [''],
      valueRadio: ['1']
    });

  }


  onClickNext() {
    this.tabIndex = this.tabIndex + 1;
    this.tabName = this.name[this.tabIndex];
  }

  onClickDown() {
    this.tabIndex = this.tabIndex - 1;
    this.tabName = this.name[this.tabIndex];
  }

 

  selectedMonths(months: any) {
  }

  addEvent(type: string, event: MatDatepickerInputEvent<Date>) {
    this.events.push(`${type}: ${event.value}`);
  }







  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  dateSelected(date: NgbDate): void {
    if (!this.f.startDate.value && !this.f.endDate.value) {
      this.f.startDate.setValue(date);
    } else if (this.f.startDate.value && !this.f.endDate.value && date && date.after(this.f.startDate.value)) {
      this.f.endDate.setValue(date);
    } else {
      this.f.endDate.setValue(null);
      this.f.startDate.setValue(date);
    }
  }

  isHovered(date: NgbDate): any {
    return this.f.startDate.value &&
      !this.f.endDate.value &&
      this.hoveredDate &&
      date.after(this.f.startDate.value) &&
      date.before(this.hoveredDate);
  }

  isInside(date: NgbDate): any {
    return this.f.endDate.value && date.after(this.f.startDate.value) && date.before(this.f.endDate.value);
  }

  isRange(date: NgbDate): any {
    return date.equals(this.f.startDate.value) ||
      (this.f.endDate.value && date.equals(this.f.endDate.value)) ||
      this.isInside(date) || this.isHovered(date);
  }

  validateInput(currentValue: NgbDate | null, input: string): NgbDate | null {
    const parsed = this.formatter.parse(input);
    return parsed && this.calendar.isValid(NgbDate.from(parsed)) ? NgbDate.from(parsed) : currentValue;
  }

  setStartDate(value: string): void {
    this.f.startDate.setValue(this.validateInput(this.f.startDate.value, value));
  }

  setEndDate(value: string): void {
    this.f.endDate.setValue(this.validateInput(this.f.endDate.value, value));
  }

  private initRecurringForm(): void {
    this.recurringForm = this.fb.group({
      startDate: [this.today],
      endDate: [this.calendar.getNext(this.today, 'd', 7)],
      frequency: [Frequency.DAILY],
      occurence:[''],
      onWeekday: this.fb.array(
        [false, false, false, false, false, false, false].map(val => this.fb.control(val))
      ),
      onMonthday: [this.today]
    });
  }

  private subscribeToFormValue(): void {
    this.recurringForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((value: { frequency: Frequency; startDate: any; endDate: any; onWeekday: boolean[]; onMonthday: { day: any; }; }) => {
      const options: Partial<Options> = {
        freq: value.frequency || Frequency.DAILY,
        dtstart: toNativeDate(value.startDate || this.today),
        until: toNativeDate(value.endDate || this.today),
        byweekday:  Frequency.WEEKLY ?
          this.getWeekday(value.onWeekday) : null,
        bymonthday: value.frequency === Frequency.MONTHLY ?
          (value.onMonthday && value.onMonthday.day || this.today.day) : null
      };
      const rule = new RRule(options);
      this.dates = rule.all();
    });

    this.recurringForm.patchValue({
      startDate: this.today,
      endDate: this.calendar.getNext(this.today, 'd', 7),
      frequency: Frequency.DAILY
    });
  }

  private getWeekday(byWeekday: any[]): any {
    const result = byWeekday
      .map((v, i) => v && this.weekdayMap[i] || null)
      .filter(v => !!v);
    return result.length ? result : null;
  }

}

