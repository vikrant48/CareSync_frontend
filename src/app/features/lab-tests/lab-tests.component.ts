import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LabTestService, LabTest, BookingRequest } from '../../core/services/lab-test.service';
import { AuthService } from '../../core/services/auth.service';
import { PatientProfileService, PatientDto } from '../../core/services/patient-profile.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { PaymentService } from '../../core/services/payment.service';
import { DoctorLayoutComponent } from '../../shared/doctor-layout.component';
import { PatientLayoutComponent } from '../../shared/patient-layout.component';
import { PaymentPopupComponent, PaymentDetails } from '../../shared/payment-popup.component';
import { SearchableSelectComponent } from '../../shared/searchable-select.component';
import { ToastService } from '../../core/services/toast.service';
import { ModalShellComponent } from '../../shared/ui/modal-shell.component';
import { FilterBarComponent, FilterConfig } from '../../shared/components';

export interface CategoryTab {
  id: string;
  label: string;
  icon: string;
  count: number;
  badge?: string;
}

@Component({
  selector: 'app-lab-tests',
  standalone: true,
  imports: [CommonModule, FormsModule, DoctorLayoutComponent, PatientLayoutComponent, PaymentPopupComponent, SearchableSelectComponent, ModalShellComponent, FilterBarComponent],
  templateUrl: './lab-tests.component.html'
})
export class LabTestsComponent implements OnInit {
  private labTestService = inject(LabTestService);
  private authService = inject(AuthService);
  private patientService = inject(PatientProfileService);
  private appointmentService = inject(AppointmentService);
  private paymentService = inject(PaymentService);
  private router = inject(Router);
  private toast = inject(ToastService);

  // Signals for reactive state management
  labTests = signal<LabTest[]>([]);
  selectedTestIds = signal<Set<number>>(new Set());
  isFullBodyCheckup = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  isBooking = signal<boolean>(false);

  // Filter, Search, and Sort state signals
  searchTerm = signal<string>('');
  selectedCategory = signal<string>('ALL');
  sortBy = signal<string>('popular');

  readonly labFilterConfigs: FilterConfig[] = [
    {
      type: 'radio',
      key: 'category',
      label: 'Category',
      defaultValue: 'ALL',
      width: 'w-full',
      options: [{ label: 'All Tests', value: 'ALL', icon: 'fa-solid fa-table-cells-large' }]
    },
    {
      type: 'search',
      key: 'searchTerm',
      label: 'Search',
      placeholder: 'Search lab tests...',
      defaultValue: ''
    },
    {
      type: 'select',
      key: 'sortBy',
      label: 'Sort',
      defaultValue: 'popular',
      width: 'w-full sm:w-56',
      clearable: false,
      options: [
        { label: 'Popular', value: 'popular' },
        { label: 'Price: Low to High', value: 'price_asc' },
        { label: 'Price: High to Low', value: 'price_desc' },
        { label: 'Name: A to Z', value: 'name_asc' }
      ]
    }
  ];

  labFilterValues: Record<string, string> = {
    category: 'ALL',
    searchTerm: '',
    sortBy: 'popular'
  };
  selectedTestForDetails = signal<LabTest | null>(null);

  // Payment-related signals
  showPaymentPopup = signal<boolean>(false);
  pendingBookingRequest = signal<BookingRequest | null>(null);

  // Patient selection for doctors
  patients = signal<PatientDto[]>([]);
  selectedPatientId = signal<number | null>(null);
  isLoadingPatients = signal<boolean>(false);

  // Dynamic Category Mapping Helper
  getTestCategoryInfo(test: LabTest): { category: string; icon: string; iconBg: string; isPopular?: boolean } {
    const name = test.testName.toLowerCase();
    const desc = (test.description || '').toLowerCase();

    if (name.includes('full body') || name.includes('checkup') || name.includes('package')) {
      return { category: 'Health Package', icon: 'fa-user-doctor text-blue-400', iconBg: 'bg-blue-500/10 border-blue-500/20', isPopular: true };
    }
    if (name.includes('afp') || name.includes('liver') || name.includes('lft') || name.includes('bilirubin')) {
      return { category: 'Liver', icon: 'fa-cubes text-[#f97316]', iconBg: 'bg-orange-500/10 border-orange-500/20', isPopular: true };
    }
    if (name.includes('ana') || name.includes('autoimmune') || name.includes('antibody') || name.includes('antibodies')) {
      return { category: 'Autoimmune', icon: 'fa-shield-halved text-indigo-400', iconBg: 'bg-indigo-500/10 border-indigo-500/20', isPopular: true };
    }
    if (name.includes('tpo') || name.includes('thyroid') || name.includes('tsh') || name.includes('t3') || name.includes('t4')) {
      return { category: 'Thyroid', icon: 'fa-dna text-purple-400', iconBg: 'bg-purple-500/10 border-purple-500/20' };
    }
    if (name.includes('hcg') || name.includes('beta') || name.includes('pregnancy')) {
      return { category: 'Pregnancy', icon: 'fa-baby text-pink-400', iconBg: 'bg-pink-500/10 border-pink-500/20' };
    }
    if (name.includes('urea') || name.includes('kidney') || name.includes('creatinine') || name.includes('kft')) {
      return { category: 'Kidney', icon: 'fa-filter text-violet-400', iconBg: 'bg-violet-500/10 border-violet-500/20' };
    }
    if (name.includes('ck-mb') || name.includes('heart') || name.includes('cardiac') || name.includes('troponin')) {
      return { category: 'Heart', icon: 'fa-heart-pulse text-rose-500', iconBg: 'bg-rose-500/10 border-rose-500/20' };
    }
    if (name.includes('cbc') || name.includes('blood') || name.includes('count') || name.includes('plasma')) {
      return { category: 'Blood', icon: 'fa-droplet text-red-500', iconBg: 'bg-red-500/10 border-red-500/20', isPopular: true };
    }
    if (name.includes('sugar') || name.includes('glucose') || name.includes('hba1c') || name.includes('diabetes')) {
      return { category: 'Diabetes', icon: 'fa-bullseye text-amber-400', iconBg: 'bg-amber-500/10 border-amber-500/20', isPopular: true };
    }

    return { category: 'General', icon: 'fa-vial text-sky-400', iconBg: 'bg-sky-500/10 border-sky-500/20' };
  }

  // Dynamic Category Tabs computed from loaded lab tests
  categoryTabs = computed<CategoryTab[]>(() => {
    const tests = this.labTests();
    const total = tests.length;

    let popularCount = 0;
    let bloodCount = 0;
    let thyroidCount = 0;
    let diabetesCount = 0;
    let liverCount = 0;
    let kidneyCount = 0;

    tests.forEach((t, index) => {
      const info = this.getTestCategoryInfo(t);
      if (info.isPopular || index < 6) popularCount++;
      if (info.category === 'Blood' || t.testName.toLowerCase().includes('blood') || t.testName.toLowerCase().includes('cbc')) bloodCount++;
      if (info.category === 'Thyroid' || t.testName.toLowerCase().includes('thyroid')) thyroidCount++;
      if (info.category === 'Diabetes' || t.testName.toLowerCase().includes('sugar')) diabetesCount++;
      if (info.category === 'Liver' || t.testName.toLowerCase().includes('afp')) liverCount++;
      if (info.category === 'Kidney' || t.testName.toLowerCase().includes('urea')) kidneyCount++;
    });

    return [
      { id: 'ALL', label: 'All Tests', icon: 'fa-table-cells-large', count: total },
      { id: 'POPULAR', label: 'Popular', icon: 'fa-star text-amber-400', count: popularCount },
      { id: 'BLOOD', label: 'Blood Tests', icon: 'fa-droplet text-red-500', count: bloodCount },
      { id: 'THYROID', label: 'Thyroid', icon: 'fa-dna text-purple-400', count: thyroidCount },
      { id: 'DIABETES', label: 'Diabetes', icon: 'fa-bullseye text-amber-400', count: diabetesCount },
      { id: 'LIVER', label: 'Liver', icon: 'fa-cubes text-orange-400', count: liverCount },
      { id: 'KIDNEY', label: 'Kidney', icon: 'fa-filter text-violet-400', count: kidneyCount },
    ];
  });

  // Filtered and Sorted Tests List computed property
  filteredLabTests = computed(() => {
    let list = [...this.labTests()];
    const query = this.searchTerm().trim().toLowerCase();
    const cat = this.selectedCategory();
    const sort = this.sortBy();

    // 1. Filter by Category Tab
    if (cat === 'POPULAR') {
      list = list.filter((t, i) => this.getTestCategoryInfo(t).isPopular || i < 6);
    } else if (cat === 'BLOOD') {
      list = list.filter(t => this.getTestCategoryInfo(t).category === 'Blood' || t.testName.toLowerCase().includes('blood') || t.testName.toLowerCase().includes('cbc'));
    } else if (cat === 'THYROID') {
      list = list.filter(t => this.getTestCategoryInfo(t).category === 'Thyroid' || t.testName.toLowerCase().includes('thyroid'));
    } else if (cat === 'DIABETES') {
      list = list.filter(t => this.getTestCategoryInfo(t).category === 'Diabetes' || t.testName.toLowerCase().includes('sugar'));
    } else if (cat === 'LIVER') {
      list = list.filter(t => this.getTestCategoryInfo(t).category === 'Liver' || t.testName.toLowerCase().includes('afp'));
    } else if (cat === 'KIDNEY') {
      list = list.filter(t => this.getTestCategoryInfo(t).category === 'Kidney' || t.testName.toLowerCase().includes('urea'));
    }

    // 2. Filter by Search Query
    if (query) {
      list = list.filter(t => {
        const catInfo = this.getTestCategoryInfo(t);
        return t.testName.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query)) ||
          catInfo.category.toLowerCase().includes(query);
      });
    }

    // 3. Sort List
    if (sort === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === 'name_asc') {
      list.sort((a, b) => a.testName.localeCompare(b.testName));
    }

    return list;
  });

  // Computed values for selected tests & totals
  selectedTests = computed(() =>
    this.labTests().filter(test => this.selectedTestIds().has(test.id))
  );

  totalPrice = computed(() =>
    this.labTestService.calculateTotalPrice(this.selectedTests())
  );

  selectedCount = computed(() => this.selectedTestIds().size);

  // User details
  currentRole = computed(() => this.authService.role());
  currentUser = computed(() => this.authService.user());
  currentUsername = computed(() => this.authService.username());

  constructor() {
    effect(() => {
      const tabs = this.categoryTabs();
      const category = this.labFilterConfigs.find((c) => c.key === 'category');
      if (!category) return;
      category.options = tabs.map((tab) => ({
        label: `${tab.label} (${tab.count})`,
        value: tab.id,
        icon: `fa-solid ${tab.icon.split(' ')[0]}`
      }));
    });
  }

  onLabFilterChange(values: Record<string, string>) {
    this.searchTerm.set(values['searchTerm'] || '');
    this.selectedCategory.set(values['category'] || 'ALL');
    this.sortBy.set(values['sortBy'] || 'popular');
  }

  clearLabFilters() {
    this.searchTerm.set('');
    this.selectedCategory.set('ALL');
    this.sortBy.set('popular');
    this.labFilterValues = {
      category: 'ALL',
      searchTerm: '',
      sortBy: 'popular'
    };
  }

  ngOnInit() {
    this.loadLabTests();
    if (this.currentRole() === 'DOCTOR') {
      this.loadPatients();
    }
  }

  loadPatients() {
    this.isLoadingPatients.set(true);
    this.appointmentService.getDoctorUniquePatients().subscribe({
      next: (patients) => {
        this.patients.set(patients);
        this.isLoadingPatients.set(false);
      },
      error: (error) => {
        console.error('Error loading doctor patients:', error);
        this.toast.showError('Failed to load patients. Please try again.');
        this.isLoadingPatients.set(false);
      }
    });
  }

  selectPatient(patientId: number | null) {
    this.selectedPatientId.set(patientId);
  }

  loadLabTests() {
    this.isLoading.set(true);
    this.toast.clearAll();

    this.labTestService.getAllLabTests().subscribe({
      next: (tests) => {
        this.labTests.set(tests.filter(test => test.isActive));
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading lab tests:', error);
        this.toast.showError('Failed to load lab tests. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  toggleTestSelection(testId: number) {
    const currentSelection = new Set(this.selectedTestIds());

    if (currentSelection.has(testId)) {
      currentSelection.delete(testId);
    } else {
      currentSelection.add(testId);
    }

    this.selectedTestIds.set(currentSelection);

    if (currentSelection.size !== this.labTests().length) {
      this.isFullBodyCheckup.set(false);
    }
  }

  selectAllTests() {
    const allTestIds = new Set(this.labTests().map(test => test.id));
    this.selectedTestIds.set(allTestIds);
    this.isFullBodyCheckup.set(true);
  }

  unselectAllTests() {
    this.selectedTestIds.set(new Set());
    this.isFullBodyCheckup.set(false);
  }

  toggleFullBodyCheckup() {
    const newValue = !this.isFullBodyCheckup();
    this.isFullBodyCheckup.set(newValue);

    if (newValue) {
      this.selectAllTests();
    } else {
      this.unselectAllTests();
    }
  }

  isTestSelected(testId: number): boolean {
    return this.selectedTestIds().has(testId);
  }

  bookTests() {
    if (this.selectedTestIds().size === 0) {
      this.toast.showError('Please select at least one test to book.');
      return;
    }

    if (this.currentRole() === 'DOCTOR' && !this.selectedPatientId()) {
      this.toast.showError('Please select a patient for the booking.');
      return;
    }

    this.toast.clearAll();

    const bookingRequest: BookingRequest = {
      selectedTestIds: Array.from(this.selectedTestIds()),
      isFullBodyCheckup: this.isFullBodyCheckup(),
      patientId: this.currentRole() === 'DOCTOR' ? this.selectedPatientId() : null
    };

    if (this.currentRole() === 'PATIENT') {
      this.pendingBookingRequest.set(bookingRequest);
      this.showPaymentPopup.set(true);
    } else {
      this.createDoctorBooking(bookingRequest);
    }
  }

  getPatientIdForPayment(): number | undefined {
    if (this.currentRole() === 'PATIENT') {
      return this.currentUser()?.id;
    } else if (this.currentRole() === 'DOCTOR') {
      return this.selectedPatientId() || undefined;
    }
    return undefined;
  }

  onPaymentSuccess(paymentDetails: PaymentDetails) {
    if (this.pendingBookingRequest()) {
      this.createPatientBookingWithPayment(this.pendingBookingRequest()!, paymentDetails);
    } else {
      this.toast.showSuccess('Lab tests booked successfully!');
      this.clearSelections();
      this.showPaymentPopup.set(false);
    }
  }

  onPaymentCancel() {
    this.closePaymentPopup();
  }

  closePaymentPopup() {
    this.showPaymentPopup.set(false);
    this.pendingBookingRequest.set(null);
  }

  private createPatientBookingWithPayment(bookingRequest: BookingRequest, paymentDetails: PaymentDetails) {
    this.isBooking.set(true);

    const paymentRequest: any = {
      amount: this.totalPrice(),
      description: `Lab tests booking - ${this.selectedTests().map(t => t.testName).join(', ')}`,
      paymentMethod: paymentDetails.method.toUpperCase() as 'UPI' | 'CARD' | 'QR_CODE',
      paymentType: 'LAB_TEST',
      patientId: parseInt(this.authService.userId() || '0'),
      currency: 'INR'
    };

    if (paymentDetails.method === 'upi' && paymentDetails.upiId) {
      paymentRequest.upiId = paymentDetails.upiId;
    } else if (paymentDetails.method === 'card' && paymentDetails.cardDetails) {
      const [month, year] = (paymentDetails.cardDetails.expiryDate || '').split('/');
      paymentRequest.cardDetails = {
        cardNumber: paymentDetails.cardDetails.cardNumber,
        expiryMonth: month || '',
        expiryYear: year ? `20${year}` : '',
        cvv: paymentDetails.cardDetails.cvv || '',
        cardholderName: paymentDetails.cardDetails.cardholderName || ''
      };
    }

    const patientBookingWithPayment = {
      bookingRequest,
      paymentRequest
    };

    this.labTestService.createPatientBookingWithPayment(patientBookingWithPayment).subscribe({
      next: () => {
        this.toast.showSuccess('Booking created successfully with payment!');
        this.clearSelections();
        this.isBooking.set(false);
        this.showPaymentPopup.set(false);
        this.pendingBookingRequest.set(null);

        setTimeout(() => {
          this.toast.clearAll();
        }, 3000);
      },
      error: (error) => {
        console.error('Error creating booking with payment:', error);
        let errorMsg = 'Failed to create booking with payment. Please try again.';
        if (error.error?.message) {
          errorMsg = error.error.message;
        }
        this.toast.showError(errorMsg);
        this.isBooking.set(false);
      }
    });
  }

  private createDoctorBooking(bookingRequest: BookingRequest) {
    this.isBooking.set(true);

    this.labTestService.createDoctorBooking(bookingRequest).subscribe({
      next: () => {
        this.toast.showSuccess('Booking created successfully! Patient can pay later.');
        this.clearSelections();
        this.isBooking.set(false);

        setTimeout(() => {
          this.toast.clearAll();
        }, 3000);
      },
      error: (error) => {
        console.error('Error creating doctor booking:', error);
        let errorMsg = 'Failed to create booking. Please try again.';
        if (error.error?.message) {
          errorMsg = error.error.message;
        }
        this.toast.showError(errorMsg);
        this.isBooking.set(false);
      }
    });
  }

  clearSelections() {
    this.selectedTestIds.set(new Set());
    this.isFullBodyCheckup.set(false);
    if (this.currentRole() === 'DOCTOR') {
      this.selectedPatientId.set(null);
    }
  }

  getSelectedPatientName(): string {
    const selectedId = this.selectedPatientId();
    if (!selectedId) return '';
    const patient = this.patients().find(p => p.id === selectedId);
    return patient ? `${patient.firstName} ${patient.lastName}` : '';
  }

  formatPrice(price: number): string {
    return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  getPrescriberName(): string {
    const role = this.currentRole();
    const user = this.currentUser();
    if (role === 'DOCTOR' && user) {
      return `Dr. ${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return 'Self';
  }

  navigateToBooking() {
    this.router.navigate(['/patient/lab-bookings']);
  }

  openTestDetails(test: LabTest, event: Event) {
    event.stopPropagation();
    this.selectedTestForDetails.set(test);
  }

  closeTestDetails() {
    this.selectedTestForDetails.set(null);
  }

  trackByTestId(index: number, test: LabTest): number {
    return test.id;
  }
}
