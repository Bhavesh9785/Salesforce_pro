import { LightningElement, api, track } from 'lwc';
import describeModule from '@salesforce/apex/ShowroomController.describeModule';
import getRecords from '@salesforce/apex/ShowroomController.getRecords';
import saveRecord from '@salesforce/apex/ShowroomController.saveRecord';
import deleteRecord from '@salesforce/apex/ShowroomController.deleteRecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ShowroomModule extends LightningElement {
    @api moduleKey;
    @api initialSearch = '';
    @api startNewRecord = false;
    @track rows = [];
    @track columns = [];
    @track formFields = [];
    loading = true;
    saving = false;
    modalOpen = false;
    deleteOpen = false;
    viewMode = false;
    recordId;
    searchText = '';
    errorMessage = '';
    pageNumber = 1;
    pageSize = 10;
    total = 0;
    moduleInfo;

    connectedCallback() {
        this.searchText = this.initialSearch || '';
        this.load();
    }

    renderedCallback() {
        if (this.initialSearch && this.searchText !== this.initialSearch) {
            this.searchText = this.initialSearch;
            this.pageNumber = 1;
            this.load();
        }
    }

    get moduleLabel() { return this.moduleInfo?.label || this.pretty(this.moduleKey); }
    get empty() { return !this.loading && this.rows.length === 0; }
    get pageCount() { return Math.max(1, Math.ceil(this.total / this.pageSize)); }
    get firstPage() { return this.pageNumber <= 1; }
    get lastPage() { return this.pageNumber >= this.pageCount; }
    get startRecord() { return this.total ? ((this.pageNumber - 1) * this.pageSize) + 1 : 0; }
    get endRecord() { return Math.min(this.pageNumber * this.pageSize, this.total); }
    get modalTitle() { return this.viewMode ? 'View Record' : (this.recordId ? 'Edit Record' : 'New Record'); }
    get saveLabel() { return this.saving ? 'Saving...' : 'Save'; }

    async load() {
        this.loading = true;
        this.errorMessage = '';
        try {
            if (!this.moduleInfo || this.moduleInfo.key !== this.moduleKey) {
                this.moduleInfo = await describeModule({moduleKey:this.moduleKey});
                this.columns = this.moduleInfo.fields.slice(0, 7);
                if (this.startNewRecord) {
                    this.openCreate();
                    this.dispatchEvent(new CustomEvent('newrequesthandled', { bubbles: true, composed: true }));
                }
            }
            const result = await getRecords({
                moduleKey:this.moduleKey,
                searchText:this.searchText,
                pageSize:this.pageSize,
                pageNumber:this.pageNumber
            });
            this.total = result.total || 0;
            this.rows = (result.records || []).map(r => ({
                ...r,
                cells: this.columns.map(c => ({key:r.Id+'-'+c.apiName, display:this.displayValue(r[c.apiName], c.type)}))
            }));
        } catch (e) {
            this.errorMessage = this.normalizeError(e);
            this.rows = [];
        } finally {
            this.loading = false;
        }
    }

    displayValue(value, type) {
        if (value === null || value === undefined || value === '') return '—';
        if (type === 'boolean') return value ? 'Yes' : 'No';
        return String(value);
    }

    pretty(key) { return (key || '').replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()); }
    normalizeError(e) { return e?.body?.message || e?.message || 'Unexpected Salesforce error.'; }

    handleSearch(e) { this.searchText = e.target.value; }
    handleSearchKey(e) { if (e.key === 'Enter') { this.pageNumber = 1; this.load(); } }
    clearSearch() { this.searchText = ''; this.pageNumber = 1; this.load(); }
    refresh() { this.load(); }
    previousPage() { if (!this.firstPage) { this.pageNumber--; this.load(); } }
    nextPage() { if (!this.lastPage) { this.pageNumber++; this.load(); } }

    buildFormFields(record={}) {
        this.formFields = (this.moduleInfo?.fields || []).filter(f => f.createable || f.updateable).map(f => {
            const raw = record[f.apiName];
            const type = f.type;
            return {
                ...f,
                value: raw ?? '',
                display: this.displayValue(raw,type),
                requiredMark: f.required ? ' *' : '',
                isPicklist: type === 'picklist',
                isBoolean: type === 'boolean',
                inputType: this.inputType(type),
                inputClass: 'input',
                options: f.options || []
            };
        });
    }

    inputType(type) {
        if (type === 'date') return 'date';
        if (type === 'datetime') return 'datetime-local';
        if (type === 'email') return 'email';
        if (type === 'phone') return 'tel';
        if (type === 'currency' || type === 'double' || type === 'integer' || type === 'long' || type === 'percent') return 'number';
        if (type === 'url') return 'url';
        return 'text';
    }

    openCreate() {
        this.recordId = null; this.viewMode = false; this.modalOpen = true; this.buildFormFields({});
    }

    viewRecord(e) {
        const row = this.rows.find(r => r.Id === e.currentTarget.dataset.id);
        this.recordId = row?.Id; this.viewMode = true; this.modalOpen = true; this.buildFormFields(row || {});
    }

    editRecord(e) {
        const row = this.rows.find(r => r.Id === e.currentTarget.dataset.id);
        this.recordId = row?.Id; this.viewMode = false; this.modalOpen = true; this.buildFormFields(row || {});
    }

    confirmDelete(e) { this.recordId = e.currentTarget.dataset.id; this.deleteOpen = true; }
    cancelDelete() { this.deleteOpen = false; this.recordId = null; }
    closeModal() { this.modalOpen = false; this.recordId = null; }
    stopPropagation(e) { e.stopPropagation(); }
    backdropClose(e) { if (e.target === e.currentTarget) this.closeModal(); }

    handleFieldChange(e) {
        const api = e.currentTarget.dataset.field;
        const value = e.target.value;
        this.formFields = this.formFields.map(f => f.apiName === api ? {...f,value,display:value} : f);
    }

    handleBooleanChange(e) {
        const api = e.currentTarget.dataset.field;
        const value = e.target.checked;
        this.formFields = this.formFields.map(f => f.apiName === api ? {...f,value,display:value?'Yes':'No'} : f);
    }

    async save() {
        const values = {};
        for (const f of this.formFields) {
            if (f.required && (f.value === '' || f.value === null || f.value === undefined)) {
                this.toast('Validation', `${f.label} is required.`, 'error'); return;
            }
            values[f.apiName] = f.value;
        }
        this.saving = true;
        try {
            await saveRecord({moduleKey:this.moduleKey, values, recordId:this.recordId});
            this.toast('Success', 'Record saved successfully.', 'success');
            this.closeModal();
            await this.load();
        } catch (e) {
            this.toast('Save failed', this.normalizeError(e), 'error');
        } finally { this.saving = false; }
    }

    async deleteRecord() {
        this.saving = true;
        try {
            await deleteRecord({moduleKey:this.moduleKey, recordId:this.recordId});
            this.toast('Deleted', 'Record deleted successfully.', 'success');
            this.cancelDelete();
            if (this.rows.length === 1 && this.pageNumber > 1) this.pageNumber--;
            await this.load();
        } catch(e) {
            this.toast('Delete failed', this.normalizeError(e), 'error');
        } finally { this.saving = false; }
    }

    exportCsv() {
        if (!this.rows.length) { this.toast('Export','No records to export.','info'); return; }
        const header = this.columns.map(c=>`"${c.label}"`).join(',');
        const body = this.rows.map(r=>this.columns.map(c=>`"${String(r[c.apiName] ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
        const blob = new Blob([header+'\n'+body],{type:'text/csv;charset=utf-8;'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href=url; a.download=`${this.moduleKey}.csv`; a.click(); URL.revokeObjectURL(url);
    }

    printTable() {
        const html = `<html><head><title>${this.moduleLabel}</title><style>body{font:12px Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:7px;text-align:left}th{background:#eaf2fb}</style></head><body><h2>${this.moduleLabel}</h2>${this.template.querySelector('table')?.outerHTML || ''}</body></html>`;
        const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
    }

    toast(title,message,variant) { this.dispatchEvent(new ShowToastEvent({title,message,variant})); }
}
