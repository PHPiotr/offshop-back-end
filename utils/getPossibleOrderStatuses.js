const possibleStatuses = ['LOCAL_SOFT_DELETED', 'LOCAL_NEW_INITIATED', 'LOCAL_NEW_REJECTED', 'LOCAL_NEW_COMPLETED', 'NEW', 'PENDING', 'WAITING_FOR_CONFIRMATION', 'COMPLETED', 'CANCELED', 'REJECTED'];
const possibleStatusesLabels = {
    LOCAL_SOFT_DELETED: 'lokalna - usunięta',
    LOCAL_NEW_INITIATED: 'lokalna - zainicjowana',
    LOCAL_NEW_REJECTED: 'lokalna - odrzucona',
    LOCAL_NEW_COMPLETED: 'lokalna - zakończona',
    NEW: 'lokalna - nowa',
    PENDING: 'nowa',
    WAITING_FOR_CONFIRMATION: 'niepotwierdzona przez sklep',
    COMPLETED: 'opłacona',
    CANCELED: 'anulowana',
    REJECTED: 'odrzucona',
};
const statusesDescriptions = {
    PENDING: 'Czekamy na potwierdzenie z banku, że dokonałeś płatności.',
    WAITING_FOR_CONFIRMATION: 'Wpłacone przez Ciebie środki zostały przekazane do dyspozycji sklepu. Skontaktuj się z nim, aby poznać status swojego zamówienia.',
    COMPLETED: 'Wpłacone przez Ciebie środki zostały przekazane do sklepu.',
};

module.exports.possibleOrderStatuses = possibleStatuses;
module.exports.possibleOrderStatusesLabels = possibleStatusesLabels;
module.exports.statusesDescriptions = statusesDescriptions;
