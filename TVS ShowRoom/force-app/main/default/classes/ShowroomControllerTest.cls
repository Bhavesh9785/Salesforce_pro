@IsTest
private class ShowroomControllerTest {
    @IsTest
    static void dashboardCountsDoesNotFail() {
        Test.startTest();
        Map<String,Integer> counts = ShowroomController.getDashboardCounts();
        Test.stopTest();
        System.assertNotEquals(null, counts);
    }

    @IsTest
    static void unsupportedModuleThrows() {
        try {
            ShowroomController.describeModule('doesNotExist');
            System.assert(false, 'Expected exception');
        } catch (Exception e) {
            System.assert(e.getMessage().contains('Unsupported showroom module'));
        }
    }
}
