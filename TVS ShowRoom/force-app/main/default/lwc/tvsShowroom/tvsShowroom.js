import { LightningElement, track } from 'lwc';
import { MODULES, MODULE_MAP } from 'c/showroomConfig';

export default class TvsShowroom extends LightningElement {
    @track currentKey = 'dashboard';
    @track sidebarOpen = true;
    @track notificationsOpen = false;
    @track childSearch = '';
    @track createNewRequest = false;
    globalSearch = '';

    get navigation() {
        return MODULES.map(item => ({
            ...item,
            className: `nav-item ${item.key === this.currentKey ? 'active' : ''}`
        }));
    }

    get pageTitle() {
        return MODULE_MAP[this.currentKey]?.label || 'Dashboard';
    }

    get sidebarClass() {
        return `sidebar ${this.sidebarOpen ? 'open' : 'closed'}`;
    }

    get showDashboard() { return this.currentKey === 'dashboard'; }
    get showHome() { return this.currentKey === 'home'; }
    get showReports() { return this.currentKey === 'reports'; }
    get showDashboards() { return this.currentKey === 'dashboards'; }
    get showModule() {
        return !this.showDashboard && !this.showHome && !this.showReports && !this.showDashboards;
    }

    get userName() {
        return 'Sales User';
    }

    get userInitial() {
        return this.userName.substring(0,1).toUpperCase();
    }

    handleNavigate(event) {
        this.currentKey = event.currentTarget.dataset.key;
        this.childSearch = '';
        this.createNewRequest = false;
        if (window.innerWidth < 900) this.sidebarOpen = false;
    }

    handleChildNavigate(event) {
        const key = event.detail?.key;
        if (key && MODULE_MAP[key]) {
            this.currentKey = key;
            this.childSearch = event.detail.search || '';
            this.createNewRequest = event.detail.action === 'new';
        }
    }

    clearCreateRequest() { this.createNewRequest = false; }

    handleGlobalSearch(event) {
        this.globalSearch = event.target.value;
    }

    handleGlobalKey(event) {
        if (event.key === 'Enter' && this.globalSearch.trim()) {
            this.currentKey = 'accounts';
            this.childSearch = this.globalSearch.trim();
        }
    }

    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
    }

    toggleNotifications() {
        this.notificationsOpen = !this.notificationsOpen;
    }

    refreshPage() {
        window.location.reload();
    }
}
