public with sharing class ShowroomController {
    /*
     * Generic Salesforce data service for the TVS Showroom LWC.
     * The UI uses Salesforce data directly through Apex; no external REST API is required.
     *
     * Object API names are allow-listed below. Add/change API names here if your org
     * uses different custom object names.
     */
    private static final Map<String, String> OBJECTS = new Map<String, String>{
        'accounts' => 'Account',
        'contacts' => 'Contact',
        'leads' => 'Lead',
        'opportunities' => 'Opportunity',
        'products' => 'Product2',
        'inventory' => 'Vehicle_Inventory__c',
        'bookings' => 'Vehicle_Booking__c',
        'testRides' => 'Test_Ride__c',
        'serviceAppointments' => 'Service_Appointment__c',
        'jobCards' => 'Job_Card__c',
        'spareParts' => 'Spare_Part__c',
        'accessories' => 'Accessory__c',
        'suppliers' => 'Supplier__c',
        'loans' => 'Loan__c',
        'insurance' => 'Insurance__c',
        'warranty' => 'Warranty__c',
        'amc' => 'AMC__c',
        'deliveries' => 'Delivery__c',
        'invoices' => 'Invoice__c',
        'payments' => 'Payment__c',
        'rto' => 'RTO_Registration__c'
    };

    public class FieldInfo {
        @AuraEnabled public String apiName;
        @AuraEnabled public String label;
        @AuraEnabled public String type;
        @AuraEnabled public Boolean required;
        @AuraEnabled public Boolean updateable;
        @AuraEnabled public Boolean createable;
        @AuraEnabled public List<String> options;
    }

    public class ModuleInfo {
        @AuraEnabled public String key;
        @AuraEnabled public String objectApiName;
        @AuraEnabled public String label;
        @AuraEnabled public List<FieldInfo> fields;
    }

    public class PageData {
        @AuraEnabled public ModuleInfo module;
        @AuraEnabled public List<Map<String,Object>> records;
        @AuraEnabled public Integer total;
    }

    @AuraEnabled(cacheable=true)
    public static ModuleInfo describeModule(String moduleKey) {
        String objectName = objectApiName(moduleKey);
        Schema.DescribeSObjectResult d = describeObject(objectName);
        ModuleInfo m = new ModuleInfo();
        m.key = moduleKey;
        m.objectApiName = objectName;
        m.label = d.getLabel();
        m.fields = fieldInfo(d);
        return m;
    }

    @AuraEnabled(cacheable=true)
    public static PageData getRecords(String moduleKey, String searchText, Integer pageSize, Integer pageNumber) {
        String objectName = objectApiName(moduleKey);
        Schema.DescribeSObjectResult d = describeObject(objectName);
        Map<String, Schema.SObjectField> fieldMap = d.fields.getMap();

        List<String> preferred = preferredFields(moduleKey);
        List<String> selected = new List<String>{ 'Id' };

        for (String f : preferred) {
            if (fieldMap.containsKey(f) && !selected.contains(f)) selected.add(f);
        }

        if (fieldMap.containsKey('Name') && !selected.contains('Name')) selected.add('Name');

        Integer size = (pageSize == null || pageSize < 1 || pageSize > 200) ? 20 : pageSize;
        Integer page = (pageNumber == null || pageNumber < 1) ? 1 : pageNumber;
        Integer offsetRows = (page - 1) * size;

        String soql = 'SELECT ' + String.join(selected, ',') +
                      ' FROM ' + objectName;

        List<String> whereParts = new List<String>();
        if (String.isNotBlank(searchText)) {
            String escaped = String.escapeSingleQuotes('%' + searchText.trim() + '%');
            List<String> searchable = new List<String>();
            for (String f : preferred) {
                if (!fieldMap.containsKey(f)) continue;
                Schema.DescribeFieldResult fd = fieldMap.get(f).getDescribe();
                if (fd.getType() == Schema.DisplayType.STRING ||
                    fd.getType() == Schema.DisplayType.TEXTAREA ||
                    fd.getType() == Schema.DisplayType.PHONE ||
                    fd.getType() == Schema.DisplayType.EMAIL ||
                    fd.getType() == Schema.DisplayType.URL ||
                    fd.getType() == Schema.DisplayType.PICKLIST) {
                    searchable.add(f + ' LIKE \'' + escaped + '\'');
                }
            }
            if (!searchable.isEmpty()) whereParts.add('(' + String.join(searchable, ' OR ') + ')');
        }

        if (!whereParts.isEmpty()) soql += ' WHERE ' + String.join(whereParts, ' AND ');
        String orderField = fieldMap.containsKey('LastModifiedDate') ? 'LastModifiedDate' : 'Id';
        soql += ' ORDER BY ' + orderField + ' DESC LIMIT ' + size + ' OFFSET ' + offsetRows;

        List<SObject> rows = Database.query(soql);

        String countSoql = 'SELECT COUNT() FROM ' + objectName;
        if (!whereParts.isEmpty()) countSoql += ' WHERE ' + String.join(whereParts, ' AND ');
        Integer total = Database.countQuery(countSoql);

        PageData result = new PageData();
        result.module = new ModuleInfo();
        result.module.key = moduleKey;
        result.module.objectApiName = objectName;
        result.module.label = d.getLabel();
        result.module.fields = new List<FieldInfo>();
        Map<String, FieldInfo> descriptions = new Map<String, FieldInfo>();
        for (FieldInfo info : fieldInfo(d)) descriptions.put(info.apiName, info);
        for (String fieldName : selected) {
            if (fieldName != 'Id' && descriptions.containsKey(fieldName)) {
                result.module.fields.add(descriptions.get(fieldName));
            }
        }
        result.records = new List<Map<String,Object>>();
        for (SObject row : rows) {
            Map<String,Object> item = new Map<String,Object>();
            for (String f : selected) item.put(f, row.get(f));
            result.records.add(item);
        }
        result.total = total;
        return result;
    }

    @AuraEnabled
    public static Id saveRecord(String moduleKey, Map<String,Object> values, Id recordId) {
        String objectName = objectApiName(moduleKey);
        Schema.DescribeSObjectResult d = describeObject(objectName);
        Map<String, Schema.SObjectField> fieldMap = d.fields.getMap();

        SObject row = recordId == null
            ? d.getSObjectType().newSObject()
            : d.getSObjectType().newSObject(recordId);

        if (values != null) {
            for (String fieldName : values.keySet()) {
                if (fieldName == 'Id' || !fieldMap.containsKey(fieldName)) continue;
                Schema.DescribeFieldResult fd = fieldMap.get(fieldName).getDescribe();
                if (!fd.isCreateable() && recordId == null) continue;
                if (!fd.isUpdateable() && recordId != null) continue;
                Object value = values.get(fieldName);
                if (value == null || String.valueOf(value).trim() == '') {
                    row.put(fieldName, null);
                } else {
                    row.put(fieldName, convertValue(value, fd));
                }
            }
        }

        if (recordId == null) {
            insert row;
        } else {
            update row;
        }
        return (Id)row.get('Id');
    }

    @AuraEnabled
    public static void deleteRecord(String moduleKey, Id recordId) {
        if (recordId == null) throw new AuraHandledException('Record Id is required.');
        String objectName = objectApiName(moduleKey);
        Schema.DescribeSObjectResult d = describeObject(objectName);
        SObject row = d.getSObjectType().newSObject(recordId);
        delete row;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String,Integer> getDashboardCounts() {
        Map<String,Integer> result = new Map<String,Integer>();
        for (String key : new List<String>{'accounts','leads','opportunities','products','inventory','bookings','serviceAppointments','invoices','payments'}) {
            try {
                result.put(key, Database.countQuery('SELECT COUNT() FROM ' + objectApiName(key)));
            } catch (Exception e) {
                result.put(key, 0);
            }
        }
        return result;
    }

    private static String objectApiName(String key) {
        if (!OBJECTS.containsKey(key)) {
            throw new AuraHandledException('Unsupported showroom module: ' + key);
        }
        String name = OBJECTS.get(key);
        if (!Schema.getGlobalDescribe().containsKey(name)) {
            throw new AuraHandledException(
                'Salesforce object ' + name + ' was not found. Update ShowroomController.OBJECTS to match your org.'
            );
        }
        return name;
    }

    private static Schema.DescribeSObjectResult describeObject(String objectName) {
        return Schema.getGlobalDescribe().get(objectName).getDescribe();
    }

    private static List<FieldInfo> fieldInfo(Schema.DescribeSObjectResult d) {
        List<FieldInfo> out = new List<FieldInfo>();
        List<String> preferred = new List<String>{
            'Name','AccountId','FirstName','LastName','Phone','MobilePhone','Email',
            'Website','Industry','Type','Status__c','LeadSource','Lead_Status__c',
            'Amount','StageName','CloseDate','ProductCode','Family','Description',
            'Vehicle__c','Customer__c','Booking_Date__c','Booking_Amount__c',
            'Delivery_Date__c','VIN__c','Engine_Number__c','Chassis_Number__c',
            'Color__c','Purchase_Date__c','Purchase_Price__c','Selling_Price__c',
            'Quantity__c','Price__c','Supplier__c','Service_Date__c','Service_Type__c',
            'Technician__c','Actual_Cost__c','Estimated_Cost__c','Invoice__c',
            'Payment_Date__c','Payment_Amount__c','Payment_Mode__c'
        };
        Map<String, Schema.SObjectField> fm = d.fields.getMap();
        for (String api : preferred) {
            if (!fm.containsKey(api)) continue;
            Schema.DescribeFieldResult f = fm.get(api).getDescribe();
            if (!f.isAccessible()) continue;
            FieldInfo i = new FieldInfo();
            i.apiName = api;
            i.label = f.getLabel();
            i.type = String.valueOf(f.getType()).toLowerCase();
            i.required = !f.isNillable() && f.getType() != Schema.DisplayType.BOOLEAN && !f.isDefaultedOnCreate();
            i.updateable = f.isUpdateable();
            i.createable = f.isCreateable();
            i.options = new List<String>();
            if (f.getType() == Schema.DisplayType.PICKLIST) {
                for (Schema.PicklistEntry entry : f.getPicklistValues()) {
                    if (entry.isActive()) i.options.add(entry.getValue());
                }
            }
            out.add(i);
        }
        return out;
    }

    private static List<String> preferredFields(String moduleKey) {
        Map<String,List<String>> m = new Map<String,List<String>>{
            'accounts' => new List<String>{'Name','Phone','Website','Type','Industry'},
            'contacts' => new List<String>{'Name','AccountId','Phone','MobilePhone','Email'},
            'leads' => new List<String>{'Name','Company','Phone','MobilePhone','Email','LeadSource','Status'},
            'opportunities' => new List<String>{'Name','AccountId','Amount','StageName','CloseDate'},
            'products' => new List<String>{'Name','ProductCode','Family','Description','IsActive'},
            'inventory' => new List<String>{'Name','Vehicle__c','VIN__c','Engine_Number__c','Chassis_Number__c','Color__c','Selling_Price__c','Status__c'},
            'bookings' => new List<String>{'Name','Customer__c','Vehicle__c','Booking_Date__c','Booking_Amount__c','Delivery_Date__c','Status__c'},
            'testRides' => new List<String>{'Name','Customer__c','Vehicle__c','Test_Ride_Date__c','Time_Slot__c','Status__c'},
            'serviceAppointments' => new List<String>{'Name','Customer__c','Vehicle__c','Service_Date__c','Service_Type__c','Status__c'},
            'jobCards' => new List<String>{'Name','Appointment__c','Technician__c','Estimated_Cost__c','Actual_Cost__c','Status__c'},
            'spareParts' => new List<String>{'Name','Part_Code__c','Category__c','Supplier__c','Cost_Price__c','Selling_Price__c','Quantity__c','Status__c'},
            'accessories' => new List<String>{'Name','Category__c','Supplier__c','Price__c','Quantity__c','Warranty__c','Status__c'},
            'suppliers' => new List<String>{'Name','Contact_Person__c','Mobile__c','Email__c','GST_Number__c','Status__c'},
            'loans' => new List<String>{'Name','Customer__c','Booking__c','Finance_Company__c','Loan_Amount__c','EMI__c','Status__c'},
            'insurance' => new List<String>{'Name','Customer__c','Vehicle__c','Insurance_Company__c','Premium__c','Start_Date__c','End_Date__c','Status__c'},
            'warranty' => new List<String>{'Name','Customer__c','Vehicle__c','Warranty_Type__c','Start_Date__c','End_Date__c','Status__c'},
            'amc' => new List<String>{'Name','Customer__c','Vehicle__c','Plan_Name__c','Price__c','Start_Date__c','End_Date__c','Status__c'},
            'deliveries' => new List<String>{'Name','Booking__c','Customer__c','Vehicle__c','Delivery_Date__c','PDI_Completed__c','Status__c'},
            'invoices' => new List<String>{'Name','Customer__c','Booking__c','Invoice_Date__c','Vehicle_Amount__c','Tax__c','Discount__c','Total_Amount__c','Status__c'},
            'payments' => new List<String>{'Name','Invoice__c','Customer__c','Payment_Date__c','Payment_Amount__c','Payment_Mode__c','Status__c'},
            'rto' => new List<String>{'Name','Customer__c','Vehicle__c','Registration_Number__c','Registration_Date__c','Registration_Status__c'}
        };
        return m.containsKey(moduleKey) ? m.get(moduleKey) : new List<String>{'Name'};
    }

    private static Object convertValue(Object raw, Schema.DescribeFieldResult f) {
        String value = String.valueOf(raw);
        Schema.DisplayType t = f.getType();
        if (t == Schema.DisplayType.BOOLEAN) return value == 'true';
        if (t == Schema.DisplayType.INTEGER) return Integer.valueOf(value);
        if (t == Schema.DisplayType.LONG) return Long.valueOf(value);
        if (t == Schema.DisplayType.DOUBLE) return Double.valueOf(value);
        if (t == Schema.DisplayType.CURRENCY || t == Schema.DisplayType.PERCENT) return Decimal.valueOf(value);
        if (t == Schema.DisplayType.DATE) return Date.valueOf(value);
        if (t == Schema.DisplayType.DATETIME) return Datetime.valueOf(value.replace('T',' '));
        if (t == Schema.DisplayType.REFERENCE) return Id.valueOf(value);
        return value;
    }
}
