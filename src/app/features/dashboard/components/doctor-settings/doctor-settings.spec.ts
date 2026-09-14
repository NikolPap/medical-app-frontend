import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorSettings } from './doctor-settings';

describe('DoctorSettings', () => {
  let component: DoctorSettings;
  let fixture: ComponentFixture<DoctorSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorSettings],
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
