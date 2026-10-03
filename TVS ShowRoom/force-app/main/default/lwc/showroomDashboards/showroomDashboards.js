import { LightningElement, wire } from 'lwc';
import getDashboardCounts from '@salesforce/apex/ShowroomController.getDashboardCounts';
export default class ShowroomDashboards extends LightningElement {
    c={};
    @wire(getDashboardCounts) wired({data}){if(data)this.c=data;}
    get items(){return [
        {title:'Sales Dashboard',value:this.c.opportunities??0,sub:'Opportunities',style:'width:70%'},
        {title:'Service Dashboard',value:this.c.serviceAppointments??0,sub:'Appointments',style:'width:52%'},
        {title:'Inventory Dashboard',value:this.c.inventory??0,sub:'Vehicle records',style:'width:65%'},
        {title:'Finance Dashboard',value:this.c.payments??0,sub:'Payments',style:'width:58%'},
        {title:'Customer Dashboard',value:this.c.accounts??0,sub:'Accounts',style:'width:76%'},
        {title:'Sales Lead Dashboard',value:this.c.leads??0,sub:'Leads',style:'width:61%'}
    ]; }
}
