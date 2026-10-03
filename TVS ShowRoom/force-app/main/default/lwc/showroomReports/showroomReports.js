import { LightningElement } from 'lwc';
import getRecords from '@salesforce/apex/ShowroomController.getRecords';
export default class ShowroomReports extends LightningElement {
    selectedLabel = 'Sales Report';
    selectedKey = 'sales';
    columns = [];
    rows = [];
    loading = false;
    errorMessage = '';
    get reports(){return [
        {key:'sales',label:'Sales Report',description:'Vehicle sales and revenue'},
        {key:'booking',label:'Booking Report',description:'Booking pipeline'},
        {key:'inventory',label:'Inventory Report',description:'Vehicle stock'},
        {key:'service',label:'Service Report',description:'Appointments and jobs'},
        {key:'parts',label:'Spare Parts Report',description:'Parts stock and usage'},
        {key:'finance',label:'Finance Report',description:'Invoices and collections'},
        {key:'insurance',label:'Insurance Report',description:'Policy records'},
        {key:'rto',label:'RTO Report',description:'Registrations'},
        {key:'customer',label:'Customer Report',description:'Customer records'},
        {key:'collection',label:'Collection Report',description:'Payment collection'}
    ]; }
    get hasRows() { return this.rows.length > 0; }
    get hasError() { return Boolean(this.errorMessage); }

    connectedCallback() { this.loadReport(); }

    async openReport(event) {
        const report = this.reports.find(item => item.key === event.currentTarget.dataset.key);
        if (!report) return;
        this.selectedKey = report.key;
        this.selectedLabel = report.label;
        await this.loadReport();
    }

    async loadReport() {
        const moduleKeyByReport = {
            sales: 'opportunities', booking: 'bookings', inventory: 'inventory',
            service: 'serviceAppointments', parts: 'spareParts', finance: 'invoices',
            insurance: 'insurance', rto: 'rto', customer: 'accounts', collection: 'payments'
        };
        this.loading = true;
        this.errorMessage = '';
        this.rows = [];
        try {
            const result = await getRecords({
                moduleKey: moduleKeyByReport[this.selectedKey],
                searchText: '',
                pageSize: 50,
                pageNumber: 1
            });
            this.columns = (result.module.fields || []).slice(0, 6);
            this.rows = (result.records || []).map(record => ({
                key: record.Id,
                cells: this.columns.map(column => ({
                    key: `${record.Id}-${column.apiName}`,
                    value: record[column.apiName] == null ? '' : String(record[column.apiName])
                }))
            }));
        } catch (error) {
            this.errorMessage = error?.body?.message || error?.message || 'Unable to load this report.';
        } finally {
            this.loading = false;
        }
    }

    print() { window.print(); }
}
