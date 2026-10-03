export const MODULES = [
    { key:'dashboard', label:'Dashboard', icon:'utility:dashboard', route:'dashboard', dashboard:true },
    { key:'home', label:'Home', icon:'utility:home', route:'home' },
    { key:'accounts', label:'Accounts', icon:'standard:account', route:'accounts' },
    { key:'contacts', label:'Contacts', icon:'standard:contact', route:'contacts' },
    { key:'leads', label:'Leads', icon:'standard:lead', route:'leads' },
    { key:'opportunities', label:'Opportunities', icon:'standard:opportunity', route:'opportunities' },
    { key:'products', label:'Products', icon:'standard:product', route:'products' },
    { key:'inventory', label:'Vehicle Inventory', icon:'standard:asset_object', route:'inventory' },
    { key:'bookings', label:'Vehicle Booking', icon:'standard:orders', route:'bookings' },
    { key:'testRides', label:'Test Ride', icon:'utility:walkthrough', route:'test-rides' },
    { key:'serviceAppointments', label:'Service Appointment', icon:'standard:service_appointment', route:'service-appointments' },
    { key:'jobCards', label:'Job Card', icon:'standard:work_order', route:'job-cards' },
    { key:'spareParts', label:'Spare Parts', icon:'standard:product_consumed', route:'spare-parts' },
    { key:'accessories', label:'Accessories', icon:'standard:asset_relationship', route:'accessories' },
    { key:'suppliers', label:'Supplier', icon:'standard:partner_fund_allocation', route:'suppliers' },
    { key:'loans', label:'Loan', icon:'standard:currency', route:'loans' },
    { key:'insurance', label:'Insurance', icon:'standard:insurance', route:'insurance' },
    { key:'warranty', label:'Warranty', icon:'standard:entitlement', route:'warranty' },
    { key:'amc', label:'AMC', icon:'standard:contract', route:'amc' },
    { key:'deliveries', label:'Delivery', icon:'utility:truck', route:'deliveries' },
    { key:'invoices', label:'Invoice', icon:'standard:orders', route:'invoices' },
    { key:'payments', label:'Payment', icon:'standard:payment_gateway', route:'payments' },
    { key:'rto', label:'RTO Registration', icon:'standard:approval', route:'rto' },
    { key:'reports', label:'Reports', icon:'standard:report', route:'reports' },
    { key:'dashboards', label:'Dashboards', icon:'standard:dashboard', route:'dashboards' }
];

export const MODULE_MAP = Object.fromEntries(MODULES.map(m => [m.key, m]));
