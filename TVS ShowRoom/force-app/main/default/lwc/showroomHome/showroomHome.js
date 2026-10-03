import { LightningElement } from 'lwc';
export default class ShowroomHome extends LightningElement {
    get links(){return [
        {key:'leads',label:'Leads',icon:'standard:lead'},
        {key:'opportunities',label:'Opportunities',icon:'standard:opportunity'},
        {key:'bookings',label:'Bookings',icon:'standard:orders'},
        {key:'serviceAppointments',label:'Service Appointments',icon:'standard:service_appointment'},
        {key:'reports',label:'Reports',icon:'standard:report'},
        {key:'dashboards',label:'Dashboards',icon:'standard:dashboard'}
    ];}
    go(e){this.dispatchEvent(new CustomEvent('navigate',{detail:{key:e.currentTarget.dataset.key},bubbles:true,composed:true}));}
}
