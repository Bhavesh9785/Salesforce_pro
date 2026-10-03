import { LightningElement, wire } from 'lwc';
import getDashboardCounts from '@salesforce/apex/ShowroomController.getDashboardCounts';

export default class ShowroomDashboard extends LightningElement {
    counts = {};
    @wire(getDashboardCounts) wired({data}) {
        if (data) this.counts = data;
    }

    get cards() {
        return [
            {key:'accounts', label:'Accounts', value:this.counts.accounts ?? 0, note:'Salesforce org'},
            {key:'leads', label:'Leads', value:this.counts.leads ?? 0, note:'Active records'},
            {key:'opportunities', label:'Opportunities', value:this.counts.opportunities ?? 0, note:'Pipeline'},
            {key:'inventory', label:'Vehicle Inventory', value:this.counts.inventory ?? 0, note:'Stock records'},
            {key:'bookings', label:'Bookings', value:this.counts.bookings ?? 0, note:'Booking records'},
            {key:'serviceAppointments', label:'Service Appointments', value:this.counts.serviceAppointments ?? 0, note:'Service records'},
            {key:'invoices', label:'Invoices', value:this.counts.invoices ?? 0, note:'Finance records'},
            {key:'payments', label:'Payments', value:this.counts.payments ?? 0, note:'Collection records'}
        ];
    }

    get bars() {
        const vals = [25, 48, 36, 65, 52, 78, 58];
        return vals.map((v,i)=>({label:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i], style:`height:${v}%`}));
    }

    get quickActions() {
        return [
            {key:'leads',label:'New Lead',icon:'standard:lead',action:'new'},
            {key:'bookings',label:'New Booking',icon:'standard:orders',action:'new'},
            {key:'testRides',label:'Test Ride',icon:'utility:walkthrough'},
            {key:'serviceAppointments',label:'Service',icon:'standard:service_appointment'},
            {key:'invoices',label:'Invoice',icon:'standard:orders'},
            {key:'reports',label:'Reports',icon:'standard:report'}
        ];
    }

    openModule(e) {
        const action = this.quickActions.find(item => item.key === e.currentTarget.dataset.key)?.action;
        this.dispatchEvent(new CustomEvent('navigate',{
            detail:{key:e.currentTarget.dataset.key, action}, bubbles:true, composed:true
        }));
    }
    refresh() { window.location.reload(); }
}
